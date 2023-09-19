import { ClientError, GraphQLClient } from 'graphql-request';
import express from 'express';
import config from '../../config';
import { consumer_key } from '../../auth/types';
import { doForwardHeader } from '../../lib/headerUtils';

/**
 * GraphQL Client doesn't export this type due to supporting arbitrary
 * fetch implementations with arbitrary Response types that might not
 * actually match. There are also quite a few issues with the accuracy
 * of exported types, and they are noted with comments.
 *
 * `Error` is actually a `graphql-request` ClientError for cases where we
 * expect there to be response headers.
 *
 * The nodejs Response type doesn't have all of the same properties as the
 * browser Response type, so it is Partial'd to work around this. Headers
 * will be present if it is this type. Do not use the instanceof operator
 * with Response, it will not work as it comes from the node runtime, and
 * our current typescript config / version is not correctly aware of those.
 */
export type GraphQLResponseMiddleware = (
  response: Error | Partial<Response>
) => void;

/**
 * Initializes a GraphQLClient for making requests to the web repo GraphQL
 * proxy.
 *
 * This client utilizes the middleware defined below to support forwarding
 * forwarding headers for both error and success cases.
 *
 * @param consumerKey
 * @returns GraphQLClient
 */
export const webProxyClient = (
  consumerKey: consumer_key,
  forwardHeadersMiddleware: GraphQLResponseMiddleware
): GraphQLClient => {
  /*
    TODO: potential improvements:
    - Incorporate AbortController for timeouts (map to 504 status in controller),
      The default timeouts are 30 seconds, which is probably a bit long.
  */
  return new GraphQLClient(
    `${config.app.graphGatewayUrl}?consumer_key=${consumerKey}&enable_cors=1`,
    {
      fetch,
      // baseline headers for all requests
      headers: {
        'apollographql-client-name': config.app.clientApiName,
      },
      responseMiddleware: forwardHeadersMiddleware,
    }
  );
};

// eslint / prettier config cannot cope with functions that return
// functions like this. Thrashes between 2 states.
// prettier-ignore

/**
 * We need to get into raw fetch responses in order to extract headers
 * and attach them to the corresponding express Response.
 *
 * Without giving up type safety using rawRequest, middlewares seem to
 * be the primary mechanism to access the raw fetch responses.
 *
 * Unfortunately, the `graphql-request` library doesn't export a type
 * for this middleware, probably because it accepts any fetch implementation,
 * and the types wouldn't be accurate.
 *
 * This currently forwards ALL headers, there is potential that we are
 * forwarding something that could be misleading to clients (information
 * about the original response, rather than the proxy response).
 */
export const forwardHeadersMiddleware =
  (expressResponse: express.Response): GraphQLResponseMiddleware =>
    (graphResponse): void => {
      if (graphResponse instanceof Error && !(graphResponse instanceof ClientError)) {
        // expect there to not be headers, just return
        return;
      } else if (graphResponse instanceof ClientError) {
        // headers are not correctly documented on ClientError.response.
        // When they are present they may be accessed like this. Guarding
        // with optional chaining to provide best effort header forwarding.
        graphResponse.response?.headers?.forEach((value, key) => {
          if (doForwardHeader(key)) {
            expressResponse.set(key, value);
          }
        })
      } else if (graphResponse?.headers?.forEach) {
        // cannot use instanceof operator on Response, just check for headers
        // being a map type to check for this case
        graphResponse.headers.forEach((value, key) => {
          if (doForwardHeader(key)) {
            expressResponse.set(key, value);
          }
        });
      } else {
        // I think all expected types are documented above, emit warning log
        // and we'll know we need to dig for more if it shows up. Unfortunately
        // graphResponse is probably just an object, but outputting what we can.
        console.warn(`forwardHeadersMiddleware - encountered unexpected type: ${typeof graphResponse}`);
      }
    };
