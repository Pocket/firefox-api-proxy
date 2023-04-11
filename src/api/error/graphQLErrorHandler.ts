import { ClientError } from 'graphql-request';
import { BFFFxError, BFFFxErrorInstanceType } from '../../bfffxError';

/**
 * This file contains an extensible error handler for GraphQL errors.
 *
 * GraphQLErrorHandler is an error handling base that includes support
 * for handling common GraphQL scenarios that exist across all routes
 * like (see defaults below for exact set of handlers):
 * - authentication errors
 * - unhandled GraphQL errors
 *
 * This may be extended by implementing route specific ClientErrorHandler
 * functions.
 */

/**
 * Export type for route specific error handling.
 *
 * Return an appropriate BFFFxError to return a response to the client.
 * Otherwise, return null if the error does not match your expected error.
 */
export type ClientErrorHandler = (
  error: ClientError
) => BFFFxErrorInstanceType | null;

/**
 * Handles authentication errors.
 *
 * Auth errors are currently returned as this error:
 * {
 * "errors": [
 *   {
 *     "message": "500: Internal Server Error",
 *     "extensions": {
 *       "response": {
 *         "url": "https://list-api.readitlater.com/",
 *         "status": 500,
 *         "statusText": "Internal Server Error",
 *         "body": {
 *           "errors": [
 *             {
 *               "message": "You must be logged in to use this service",
 *               "extensions": {
 *                 "code": "UNAUTHENTICATED"
 *               }
 *             }
 *           ]
 *         }
 *       },
 *       "code": "INTERNAL_SERVER_ERROR"
 *     }
 *   }
 * ],
 * "data": {
 *   "user": {
 *     "savedItems": null
 *   }
 * },
 * "status": 200,
 * "headers": {}
 * }
 *
 * I do not expect this to stay stable. This implementation uses string searching
 * on this document to avoid breaks from changes upstream.
 *
 * @param error ClientError
 */
export const unauthenticatedErrorHandler: ClientErrorHandler = (
  error: ClientError
) => {
  // check if `"code": "UNAUTHENTICATED"` is present in the document
  // this should be returned in a top level error, but it is currently
  // nested. JSON.stringify output is minified
  if (JSON.stringify(error.response).indexOf('"code":"UNAUTHENTICATED"') >= 0) {
    return new BFFFxError('encountered UNAUTHENTICATED error upstream', {
      status: 401,
      jsonResponse: {
        errors: [
          {
            // If you are finding this code via this ID, the request is
            // failing because it is not completely authenticated.
            id: 'cd7495a6-8223-4bb8-a0a9-408be68f7967',
            status: '401',
            title: 'Unauthorized',
            source: {
              graphQLError: error.message,
            },
          },
        ],
      },
    });
  }

  return null;
};

// TODO: needs an error handler for missing consumer_key responses once that is implemented upstream

/**
 * All unhandled GraphQL errors are returned as 502 errors with a reference to
 * the original GraphQL error. This should always be the last error handler applied
 * to the chain, and it will not return null.
 *
 * These errors should not be handled in the client, and instead error handling
 * should be extended in this service to transform these errors into a stable error
 * template for Firefox.
 *
 * @param error
 */
export const unhandledErrorHandler: ClientErrorHandler = (
  error: ClientError
) => {
  return new BFFFxError('Encountered unknown error upstream', {
    status: 502,
    jsonResponse: {
      errors: [
        {
          id: '5eb9b295-1b8f-4d39-9337-6e91332d1029',
          status: '502',
          title: 'Bad Gateway',
          source: {
            graphQLError: error.message,
          },
        },
      ],
    },
  });
};

/**
 * defaultHandlers are run after all externally provided handlers in
 * GraphQLErrorHandler below. These handlers will be applied on all
 * routes.
 */
const defaultHandlers = [unauthenticatedErrorHandler, unhandledErrorHandler];

/**
 * Extensible error response building.
 *
 * This function executes all provided handlers sequentially in the order
 * provided, followed by defaultHandlers which are also run sequentially
 * in the order provided.
 *
 * This short circuits once any handler returns a non-null response, so
 * please be mindful of order concerns.
 *
 * GraphQL responses can include multiple GraphQL errors. We do not currently
 * do this, but this will need to be extended to handle multiple errors if
 * we start sending those upstream.
 *
 * Errors that are not the result of upstream GraphQL errors are just passed
 * through, to be handled by top level error handlers as a 500 response.
 *
 * @param handlers ClientErrorHandler[]
 */
export const GraphQLErrorHandler = (
  error: Error,
  handlers: ClientErrorHandler[] = []
): BFFFxErrorInstanceType | Error => {
  const allHandlers = [...handlers, ...defaultHandlers];
  let responseError = null;

  if (!(error instanceof ClientError)) {
    // if error is not a ClientError, just bubble it up to be handled
    // upstream. These should be truly exceptional cases like network
    // errors.
    return error;
  }

  // iterate over handlers until an error is found
  for (const handler of allHandlers) {
    responseError = handler(error);

    if (responseError) {
      break;
    }
  }

  if (!responseError) {
    // this should never happen, just guarding against unexpected
    // changes to defaultHandlers
    throw new Error(
      'ImplementationError: no GraphQLErrorHandler returned a non-null value'
    );
  }

  return responseError;
};
