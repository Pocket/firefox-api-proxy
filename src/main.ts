import * as Sentry from '@sentry/node';
import { serverLogger } from './server';
import config from './config';

import { buildBFFFxServer } from './bfffxServer';

Sentry.init({
  ...config.sentry,
  debug: config.sentry.environment == 'development',
  // this does not function because we do not do session management in this service.
  autoSessionTracking: false,
});

const { app } = buildBFFFxServer();

app.listen({ port: config.app.port }, () =>
  serverLogger.info(
    `🚀 Firefox API Proxy ready at http://localhost:${config.app.port}`
  )
);
