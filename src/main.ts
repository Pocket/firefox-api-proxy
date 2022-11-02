import * as Sentry from '@sentry/node';
import config from './config';
import AWSXRay from 'aws-xray-sdk-core';
import xrayExpress from 'aws-xray-sdk-express';
import express from 'express';
import https from 'https';

const serviceName = 'firefox-api-proxy';

//Set XRAY to just log if the context is missing instead of a runtime error
AWSXRay.setContextMissingStrategy('LOG_ERROR');

//Add the AWS XRAY ECS plugin that will add ecs specific data to the trace
AWSXRay.config([AWSXRay.plugins.ECSPlugin]);

//Capture all https traffic this service sends
//This is to auto capture node fetch requests (like to parser)
AWSXRay.captureHTTPsGlobal(https, true);

//Capture all promises that we make
AWSXRay.capturePromise();

Sentry.init({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
});


const app = express();

//If there is no host header (really there always should be..) then use parser-wrapper as the name
app.use(xrayExpress.openSegment(serviceName));

//Set XRay to use the host header to open its segment name.
AWSXRay.middleware.enableDynamicNaming('*');

app.use(express.json());

app.get('/.well-known/server-health', (req, res) => {
  res.status(200).send('ok');
});

//Make sure the express app has the xray close segment handler
app.use(xrayExpress.closeSegment());

app.listen({ port: 4001 }, () =>
  console.log(`🚀 Firefox API Proxy ready at http://localhost:${config.app.port}`)
);
