import { Request } from 'express';

import { WebAuth } from '../types';
import { GraphQLClient } from 'graphql-request';

// internal utility types
type ExpectedCookies = {
  a95b4b6?: string;
  d4a79ec?: string;
  '159e76e'?: string;
};
type ExpectedHeaders = {
  cookie?: string;
};

export class WebSessionAuth implements WebAuth {
  /**
   * All of the cookie content below is required to authenticate.
   */
  private cookie: string;
  /**
   * derived user identifier, this is not sensitive and is logged in sentry
   */
  private encodedUserIdentifier: string;
  /**
   * cookie content, no other auth content may be used directly
   * for lookups. This facilitates that lookup. Do not expose this
   * unless being used for auth.
   */
  private lookupId: string;
  /**
   * direct session identifier, Do not expose this unless being used for auth.
   */
  private sessionIdentifier: string;

  readonly __typename = 'WebSessionAuth';

  /**
   * May be exposed via reflection for testing, but honestly
   * just prefer fromRequest below.
   */
  private constructor(
    cookies: NonNullable<ExpectedCookies>,
    headers: NonNullable<ExpectedHeaders>
  ) {
    this.encodedUserIdentifier = cookies.a95b4b6;
    this.sessionIdentifier = cookies.d4a79ec;
    this.lookupId = cookies['159e76e'];
    this.cookie = headers.cookie;
  }

  /**
   * Constructs a WebSessionAuth from an Express Request.
   *
   * This returns an instance of WebSessionAuth on success or
   * returns null on failure.
   */
  static fromRequest(req: Request): WebSessionAuth | null {
    const requestCookies: ExpectedCookies = req.cookies;
    const requestHeaders: ExpectedHeaders = req.headers;
    // ensure expected headers and cookies are present and non-empty
    if (
      !requestHeaders.cookie ||
      !requestCookies.a95b4b6 ||
      !requestCookies.d4a79ec ||
      !requestCookies['159e76e']
    ) {
      return null;
    }

    // otherwise populate class properties with private constructor
    return new this(requestCookies, requestHeaders);
  }

  /**
   * TODO: will fill this in as a part of observability work for closer review
   */
  async sentryTags(): Promise<Record<string, string>> {
    // just throw unimplemented error
    throw Error('not implemented');
  }

  /**
   * Authenticates a GraphQLClient instance.
   *
   * Requests utilizing WebSessionAuth are authenticated via cookies
   * that are passed through this service.
   *
   * This method attaches cookies from the original firefox-api-proxy
   * request onto the GraphQL Request.
   *
   * Authenticated clients must be treated as sensitive data, and their
   * lifecycle should be kept as short as possible.
   */
  authenticateClient(client: GraphQLClient): void {
    client.setHeader('cookie', this.cookie);
    return;
  }
}
