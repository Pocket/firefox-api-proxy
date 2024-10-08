const name = 'FirefoxAPIProxy';
const domainPrefix = 'firefox-api-proxy';
const isDev = process.env.NODE_ENV === 'development';
const environment = isDev ? 'Dev' : 'Prod';
const domain = isDev
  ? `${domainPrefix}.getpocket.dev`
  : `${domainPrefix}.readitlater.com`;
const graphqlVariant = isDev ? 'development' : 'current';
const githubConnectionArn = isDev
  ? 'arn:aws:codestar-connections:us-east-1:410318598490:connection/7426c139-1aa0-49e2-aabc-5aef11092032'
  : 'arn:aws:codestar-connections:us-east-1:996905175585:connection/5fa5aa2b-a2d2-43e3-ab5a-72ececfc1870';
const branch = isDev ? 'dev' : 'main';

//Arbitrary size and count for cache. No logic was used in deciding this.
const cacheNodes = isDev ? 2 : 2;
const cacheSize = isDev ? 'cache.t2.micro' : 'cache.t3.medium';

export const config = {
  name,
  isDev,
  prefix: `${name}-${environment}`,
  circleCIPrefix: `/${name}/CircleCI/${environment}`,
  shortName: 'FXBFF', //change to your service name, limit to 6 characters, match shared-infrastructure short name
  environment,
  domain,
  codePipeline: {
    githubConnectionArn,
    repository: 'pocket/firefox-api-proxy',
    branch,
  },
  graphqlVariant,
  cacheNodes,
  cacheSize,
  healthCheck: {
    command: [
      'CMD-SHELL',
      'curl -f http://localhost:4028/.well-known/server-health || exit 1',
    ],
    interval: 15,
    retries: 3,
    timeout: 5,
    startPeriod: 0,
  },
  tags: {
    service: name,
    environment,
    app_code: 'content',
    component_code: `content-${name.toLowerCase()}`,
    env_code: isDev ? 'dev' : 'prod',
  },
};
