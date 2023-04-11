import { BFFFxError } from './bfffxError';
import { logErrorCallback } from './logger';
import { buildServer } from './server';

import API from './api';

const SERVICE_NAME = 'firefox-api-proxy';

/**
 * Gets an instance of server.ts configured specifically for this
 * service.
 *
 * Exported separately to enable testing middleware composition.
 */
export const buildBFFFxServer = () => {
  return buildServer(
    SERVICE_NAME,
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
        // register logErrorCallback, forwarding all errors to cloudwatch
        errorCallback: logErrorCallback,
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
};
