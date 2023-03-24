import { GraphQLClient } from 'graphql-request';

/**
 * Abstract class that all auth methods must implement.
 *
 * This is being implemented this way for two reasons:
 * 1) Different authentication methods will need to set different headers.
 * 2) Acting as a closure makes misuse more obvious.
 */
export abstract class WebAuth {
  /**
   * Attach a string containing the class name. Hopefully we avoid needing
   * to treat auth as a discriminated union often, but putting this in place to
   * make that easy if it's necessary.
   */
  abstract readonly __typename: string;
  /**
   * Generate an anonymized user / session identifier.
   *
   * These identifiers should only be sent to sentry or used internally.
   */
  abstract sentryTags(): Promise<Record<string, string>>;
  /**
   * Authenticates a GraphQLClient by mutating the client passed to this
   * method directly. Authenticated clients are sensitive and must be
   * handled with care.
   * @param client GraphQLClient
   * @returns void
   */
  abstract authenticateClient: (client: GraphQLClient) => void;
}

/**
 * consumer key is separate from auth as it is not sensitive, and is also
 * included with unauthenticated requests.
 */
export type consumer_key = string;

/**
 * Associate client identification and auth with the Express.Request type.
 *
 * Handlers will populate these interfaces, and they should be trusted as
 * available if their corresponding handler is included as middleware for
 * the request.
 */
declare module 'express' {
  export interface Request {
    consumer_key?: consumer_key;
    auth?: WebAuth;
  }
}
