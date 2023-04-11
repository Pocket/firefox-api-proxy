import { WebAuth, consumer_key } from '../auth/types';
import { GraphQLResponseMiddleware } from './lib/client';

/**
 * Helper for client implementation variables.
 *
 * T is used to specify the Variables type. Requests without
 * variables should use ClientParameters<undefined>.
 */
export type ClientParameters<T> = {
  auth: WebAuth;
  consumer_key: consumer_key;
  forwardHeadersMiddleware: GraphQLResponseMiddleware;
  variables?: T;
};
