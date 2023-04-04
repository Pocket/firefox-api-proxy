import * as Sentry from '@sentry/node';
import AWSXRay from 'aws-xray-sdk-core';
import https from 'https';

import config from './config';

import API from './api';
import { buildServer } from './server';
import { BFFFxError } from './bfffxError';

const serviceName = 'firefox-api-proxy';

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

const { app } = buildServer(
  serviceName,
  [
    {
      route: '/',
      router: API,
    },
  ],
  // BFFFx has an expected JSON error format, set these up in handlers
  {
    notFoundHandlerOptions: {
      defaultError: new BFFFxError('Not Found', {
        status: 404,
        jsonResponse: {
          errors: [
            {
              // this route doesn't exist
              id: 'a5d471c4-4d00-4300-9bb8-17d796f68a4a',
              status: '404',
              title: 'Not Found',
            },
          ],
        },
      }),
    },
    errorHandlerOptions: {
      defaultError: new BFFFxError('Bad Implementation', {
        status: 500,
        jsonResponse: {
          errors: [
            {
              // this shouldn't happen, open a bug if you see this id
              // this is indicative of runtime errors.
              id: 'a03b69b9-8a30-4b10-81c9-d8dbc7f61f50',
              status: '500',
              title: 'Internal Server Error',
            },
          ],
        },
      }),
    },
  }
);

app.listen({ port: config.app.port }, () =>
  console.log(
    `🚀 Firefox API Proxy ready at http://localhost:${config.app.port}`
  )
);
