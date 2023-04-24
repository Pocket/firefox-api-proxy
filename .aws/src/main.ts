import { Construct } from 'constructs';
import {
  App,
  DataTerraformRemoteState,
  RemoteBackend,
  TerraformStack,
} from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsKmsAlias } from '@cdktf/provider-aws/lib/data-aws-kms-alias';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsSnsTopic } from '@cdktf/provider-aws/lib/data-aws-sns-topic';

import { Wafv2WebAcl } from '@cdktf/provider-aws/lib/wafv2-web-acl';
import { Wafv2WebAclAssociation } from '@cdktf/provider-aws/lib/wafv2-web-acl-association';
import { Wafv2WebAclRule } from '@cdktf/provider-aws/lib/wafv2-web-acl';

import { config } from './config';
import {
  PocketALBApplication,
  PocketECSCodePipeline,
  PocketPagerDuty,
} from '@pocket-tools/terraform-modules';
import { PagerdutyProvider } from '@cdktf/provider-pagerduty/lib/provider';
import { LocalProvider } from '@cdktf/provider-local/lib/provider';
import { NullProvider } from '@cdktf/provider-null/lib/provider';
import * as fs from 'fs';

class Stack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, 'aws', { region: 'us-east-1' });
    new PagerdutyProvider(this, 'pagerduty_provider', { token: undefined });
    new LocalProvider(this, 'local_provider');
    new NullProvider(this, 'null_provider');

    new RemoteBackend(this, {
      hostname: 'app.terraform.io',
      organization: 'Pocket',
      workspaces: [{ prefix: `${config.name}-` }],
    });

    const region = new DataAwsRegion(this, 'region');
    const caller = new DataAwsCallerIdentity(this, 'caller');

    const pocketApp = this.createPocketAlbApplication({
      pagerDuty: this.createPagerDuty(),
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: this.getCodeDeploySnsTopic(),
      region,
      caller,
    });

    this.createApplicationCodePipeline(pocketApp);

    this.attachAWSWaf(pocketApp);
  }

  /**
   * Get the sns topic for code deploy
   * @private
   */
  private getCodeDeploySnsTopic() {
    return new DataAwsSnsTopic(this, 'backend_notifications', {
      name: `Backend-${config.environment}-ChatBot`,
    });
  }

  /**
   * Get secrets manager kms alias
   * @private
   */
  private getSecretsManagerKmsAlias() {
    return new DataAwsKmsAlias(this, 'kms_alias', {
      name: 'alias/aws/secretsmanager',
    });
  }

  /**
   * Create CodePipeline to build and deploy terraform and ecs
   * @param app
   * @private
   */
  private createApplicationCodePipeline(app: PocketALBApplication) {
    new PocketECSCodePipeline(this, 'code-pipeline', {
      prefix: config.prefix,
      source: {
        codeStarConnectionArn: config.codePipeline.githubConnectionArn,
        repository: config.codePipeline.repository,
        branchName: config.codePipeline.branch,
      },
    });
  }

  /**
   * Create PagerDuty service for alerts
   * @private
   */
  private createPagerDuty() {
    // don't create any pagerduty resources if in dev
    if (config.isDev) {
      return undefined;
    }

    const incidentManagement = new DataTerraformRemoteState(
      this,
      'incident_management',
      {
        organization: 'Pocket',
        workspaces: {
          name: 'incident-management',
        },
      }
    );

    return new PocketPagerDuty(this, 'pagerduty', {
      prefix: config.prefix,
      service: {
        criticalEscalationPolicyId: incidentManagement
          .get('policy_backend_critical_id')
          .toString(),
        nonCriticalEscalationPolicyId: incidentManagement
          .get('policy_backend_non_critical_id')
          .toString(),
      },
    });
  }

  private createPocketAlbApplication(dependencies: {
    pagerDuty: PocketPagerDuty;
    region: DataAwsRegion;
    caller: DataAwsCallerIdentity;
    secretsManagerKmsAlias: DataAwsKmsAlias;
    snsTopic: DataAwsSnsTopic;
  }): PocketALBApplication {
    const {
      //  pagerDuty, // enable if necessary
      region,
      caller,
      secretsManagerKmsAlias,
      snsTopic,
    } = dependencies;

    return new PocketALBApplication(this, 'application', {
      internal: false,
      prefix: config.prefix,
      alb6CharacterPrefix: config.shortName,
      tags: config.tags,
      cdn: false,
      domain: config.domain,
      containerConfigs: [
        {
          name: 'app',
          portMappings: [
            {
              hostPort: 4028,
              containerPort: 4028,
            },
          ],
          healthCheck: config.healthCheck,
          envVars: [
            {
              name: 'NODE_ENV',
              value: process.env.NODE_ENV,
            },
            {
              name: 'ENVIRONMENT',
              value: process.env.NODE_ENV, // this gives us a nice lowercase production and development
            },
          ],
          secretEnvVars: [
            {
              name: 'SENTRY_DSN',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SENTRY_DSN`,
            },
          ],
        },
        {
          name: 'xray-daemon',
          containerImage: 'public.ecr.aws/xray/aws-xray-daemon:latest',
          portMappings: [
            {
              hostPort: 2000,
              containerPort: 2000,
              protocol: 'udp',
            },
          ],
          command: ['--region', 'us-east-1', '--local-mode'],
        },
      ],
      codeDeploy: {
        useCodeDeploy: true,
        useCodePipeline: true,
        notifications: {
          notifyOnFailed: true,
          notifyOnStarted: false,
          notifyOnSucceeded: false,
        },
        snsNotificationTopicArn: snsTopic.arn,
      },
      exposedContainer: {
        name: 'app',
        port: 4028,
        healthCheckPath: '/.well-known/server-health',
      },
      ecsIamConfig: {
        prefix: config.prefix,
        taskExecutionRolePolicyStatements: [
          //This policy could probably go in the shared module in the future.
          {
            actions: ['secretsmanager:GetSecretValue', 'kms:Decrypt'],
            resources: [
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared`,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/*`,
              secretsManagerKmsAlias.targetKeyArn,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}`,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/*`,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.prefix}`,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.prefix}/*`,
            ],
            effect: 'Allow',
          },
          //This policy could probably go in the shared module in the future.
          {
            actions: ['ssm:GetParameter*'],
            resources: [
              `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}`,
              `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/*`,
            ],
            effect: 'Allow',
          },
        ],
        taskRolePolicyStatements: [
          {
            actions: [
              'xray:PutTraceSegments',
              'xray:PutTelemetryRecords',
              'xray:GetSamplingRules',
              'xray:GetSamplingTargets',
              'xray:GetSamplingStatisticSummaries',
            ],
            resources: ['*'],
            effect: 'Allow',
          },
        ],
        taskExecutionDefaultAttachmentArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      autoscalingConfig: {
        targetMinCapacity: 2,
        targetMaxCapacity: 10,
      },
      alarms: {
        //TODO: When you start using the service add the pagerduty arns as an action `pagerDuty.snsNonCriticalAlarmTopic.arn`
        http5xxErrorPercentage: {
          threshold: 25,
          evaluationPeriods: 4,
          period: 300,
          actions: config.isDev ? [] : [],
        },
      },
    });
  }

  /**
   * Create an AWS WAF and associate it with an ALB.
   *
   * Please see individual rules descriptions for behavior details.
   *
   * @param pocketApplication
   * @private
   */
  private attachAWSWaf(pocketApplication: PocketALBApplication) {
    /* 
    Rule 0: MozillaOpsSource

    Requests originating from Mozilla hosted Google CDNs include the following headers:
    - `x-source`: `mozilla`
    - `x-forwarded-for`: <end client IP address>

    For now, allow all traffic with `x-source`: `mozilla` to bypass the WAF.
    If needed, this can be tightened down several different ways:

    1. Add a Wafv2WebAclRuleStatementRateBasedStatement based on `x-forwarded-for`
       and block requests over a request limit.
    2. Block or limit requests from `consumer_key`s that are not firefox.
    */
    const mozillaOpsSourceRule = <Wafv2WebAclRule>{
      name: 'MozillaOpsSource',
      priority: 0,
      action: [{ allow: [{}] }],
      statement: [
        {
          byteMatchStatement: [
            {
              searchString: 'mozilla',
              fieldToMatch: [
                {
                  singleHeader: [
                    {
                      name: 'x-source',
                    },
                  ],
                },
              ],
              textTransformation: [
                {
                  priority: 0,
                  type: 'LOWERCASE',
                },
              ],
              positionalConstraint: 'EXACTLY',
            },
          ],
        },
      ],
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: 'MozillaOpsSource',
        sampledRequestsEnabled: true,
      },
    };

    /*
    Rule 1: Global Rate Limit

    This service is exposed to the public internet due to not having a VPC between
    AWS and GCP. Leaving this limit relatively permissive to allow devs and testing
    infrastructure to hit firefox-api-proxy directly bypassing caching.

    If needed, this limit can be decreased. All firefox client traffic should be though
    the CDN soon (still a nightly release hitting this service directly floating around).
    */
    const globalRateLimitRule = <Wafv2WebAclRule>{
      name: 'GlobalRateLimit',
      priority: 1,
      action: { block: {} },
      statement: {
        rateBasedStatement: {
          limit: 1000,
          aggregateKeyType: 'IP',
        },
      },
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: 'FirefoxApiProxyRateLimit',
        sampledRequestsEnabled: true,
      },
    };

    // create WAF and associate it with the ALB
    const waf = new Wafv2WebAcl(this, `${config.name}-waf`, {
      description: `Waf for firefox-api-proxy ${config.environment} environment`,
      name: `${config.name}-waf-${config.environment}`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: `${config.name}-waf-${config.environment}`,
        sampledRequestsEnabled: true,
      },
      rule: [mozillaOpsSourceRule, globalRateLimitRule],
    });

    new Wafv2WebAclAssociation(this, `${config.name}-association`, {
      resourceArn: pocketApplication.alb.alb.arn,
      webAclArn: waf.arn,
    });
  }
}

const app = new App();
const stack = new Stack(app, 'firefox-api-proxy');
const tfEnvVersion = fs.readFileSync('.terraform-version', 'utf8');
stack.addOverride('terraform.required_version', tfEnvVersion);
app.synth();
