import { Construct } from 'constructs';
import {
  App,
  DataTerraformRemoteState,
  S3Backend,
  TerraformStack,
} from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsKmsAlias } from '@cdktf/provider-aws/lib/data-aws-kms-alias';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsSnsTopic } from '@cdktf/provider-aws/lib/data-aws-sns-topic';

import { Wafv2WebAcl } from '@cdktf/provider-aws/lib/wafv2-web-acl';
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
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import * as fs from 'fs';

class Stack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{ tags: config.tags }],
    });
    new PagerdutyProvider(this, 'pagerduty_provider', { token: undefined });
    new LocalProvider(this, 'local_provider');
    new NullProvider(this, 'null_provider');

    new S3Backend(this, {
      bucket: `mozilla-content-team-${config.environment.toLowerCase()}-terraform-state`,
      dynamodbTable: `mozilla-content-team-${config.environment.toLowerCase()}-terraform-state`,
      key: config.name,
      region: 'us-east-1',
    });

    const region = new DataAwsRegion(this, 'region');
    const caller = new DataAwsCallerIdentity(this, 'caller');

    const pocketApp = this.createPocketAlbApplication({
      pagerDuty: this.createPagerDuty(),
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: this.getCodeDeploySnsTopic(),
      wafAcl: this.createWafAcl(),
      region,
      caller,
    });

    this.createApplicationCodePipeline(pocketApp);
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
          .get('policy_default_critical_id')
          .toString(),
        nonCriticalEscalationPolicyId: incidentManagement
          .get('policy_default_non_critical_id')
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
    wafAcl: Wafv2WebAcl;
  }): PocketALBApplication {
    const {
      //  pagerDuty, // enable if necessary
      region,
      caller,
      secretsManagerKmsAlias,
      snsTopic,
      wafAcl,
    } = dependencies;

    return new PocketALBApplication(this, 'application', {
      internal: false,
      prefix: config.prefix,
      alb6CharacterPrefix: config.shortName,
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
          logGroup: this.createCustomLogGroup('app'),
          logMultilinePattern: '^\\S.+',
          secretEnvVars: [
            {
              name: 'SENTRY_DSN',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SENTRY_DSN`,
            },
          ],
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
      wafConfig: {
        aclArn: wafAcl.arn,
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
   * Create an AWS WAF ACL and return it.
   *
   * This is a very permissive first pass. Some high level limits are lifted
   * from dotcom gateway, as it handles the current new-tab traffic, but it
   * also handles a lot of other traffic. I expect this to need iteration
   * once firefox stable starts consuming this service and we get a real
   * idea of usage numbers.
   *
   * Please see individual rules descriptions for behavior details, and
   * ideas for potential next steps.
   *
   * @private
   */
  private createWafAcl() {
    /*
    Rule 0: MozillaOpsSource

    Requests originating from Mozilla hosted Google CDNs include the following headers:
    - `x-source`: `mozilla`
    - `x-forwarded-for`: <end client IP address>

    For now, allow all traffic with `x-source`: `mozilla` to bypass the WAF.
    If needed, this can be tightened down several different ways:

    1. Add a Wafv2WebAclRuleStatementRateBasedStatement based on `x-forwarded-for`
       and block requests over a request limit. See docs here for details on this:
       https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-statement-type-rate-based.html
    2. Block or limit requests from `consumer_key`s that are not firefox.
    3. Make x-source a shared secret with SRE?
    */
    const mozillaOpsSourceRule = <Wafv2WebAclRule>{
      name: 'MozillaOpsSource',
      priority: 0,
      action: { count: {} },
      statement: {
        byteMatchStatement: {
          searchString: 'mozilla',
          fieldToMatch: {
            singleHeader: {
              name: 'x-source',
            },
          },
          textTransformation: [
            {
              priority: 0,
              type: 'LOWERCASE',
            },
          ],
          positionalConstraint: 'EXACTLY',
        },
      },
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

    https://docs.google.com/document/d/1EwCjt5rivBDFt1XaBig0atDSvycKD6_HcOeqiuLyNnQ
    Between 2023-09-11 and 2023-09-25 there was a increase in requests to 3000 RPM
    hitting the backend. The spike seemed to be coming from old ESR versins running
    on corporate networks, going through our CDN as expected. We did not see any sign
    of malicious intent. We successfully completed a load test for 4000 RPM in MC-135.
    */
    const globalRateLimitRule = <Wafv2WebAclRule>{
      name: 'GlobalRateLimit',
      priority: 1,
      action: { block: {} },
      statement: {
        rateBasedStatement: {
          limit: 4000,
          aggregateKeyType: 'IP',
        },
      },
      visibilityConfig: {
        cloudwatchMetricsEnabled: true,
        metricName: 'FirefoxApiProxyRateLimit',
        sampledRequestsEnabled: true,
      },
    };

    return new Wafv2WebAcl(this, `${config.name}-waf`, {
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
  }
  /**
   * Create Custom log group for ECS to share across task revisions
   * @param containerName
   * @private
   */
  private createCustomLogGroup(containerName: string) {
    const logGroup = new CloudwatchLogGroup(
      this,
      `${containerName}-log-group`,
      {
        name: `/Backend/${config.prefix}/ecs/${containerName}`,
        retentionInDays: 90,
        skipDestroy: true,
      }
    );

    return logGroup.name;
  }
}

const app = new App();
const stack = new Stack(app, 'firefox-api-proxy');
const tfEnvVersion = fs.readFileSync('.terraform-version', 'utf8');
stack.addOverride('terraform.required_version', tfEnvVersion);
app.synth();
