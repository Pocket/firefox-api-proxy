import * as Sentry from '@sentry/node';
import AWSXRay from 'aws-xray-sdk-core';
import https from 'https';

import config from './config';

import { buildBFFFxServer } from './bfffxServer';

Sentry.init({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
  // this does not function because we do not do session management in this service.
  autoSessionTracking: false,
});

//Set XRAY to just log if the context is missing instead of a runtime error
AWSXRay.setContextMissingStrategy('LOG_ERROR');

//Add the AWS XRAY ECS plugin that will add ecs specific data to the trace
AWSXRay.config([AWSXRay.plugins.ECSPlugin]);

//Capture all https traffic this service sends
//This is to auto capture node fetch requests (like to parser)
AWSXRay.captureHTTPsGlobal(https, true);

//Capture all promises that we make
AWSXRay.capturePromise();

const { app } = buildBFFFxServer();

app.listen({ port: config.app.port }, () =>
  console.log(
    `🚀 Firefox API Proxy ready at http://localhost:${config.app.port}`
  )
);
