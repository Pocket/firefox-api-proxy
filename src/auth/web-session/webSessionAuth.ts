import { Request } from 'express';

import { WebAuth } from '../types';
import { GraphQLClient } from 'graphql-request';
import { doForwardHeader } from '../../lib/headerUtils';

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
   * Capture request headers for forwarding and logging.
   */
  private headers: Request['headers'];
  /**
   * All of the cookie content below is required to authenticate.
   */
  private cookie: string;
  /**
   * a95b4b6 cookie
   *
   * derived user identifier, this is not sensitive and is logged in sentry
   */
  private encodedUserIdentifier?: string;
  /**
   * 159e76e cookie
   *
   * cookie content, no other auth content may be used directly
   * for lookups. This facilitates that lookup. Do not expose this
   * unless being used for auth.
   */
  private lookupId?: string;
  /**
   * d4a79ec cookie
   *
   * direct session identifier, Do not expose this unless being used for auth.
   */
  private sessionIdentifier?: string;

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
    this.headers = headers;
  }

  /**
   * Constructs a WebSessionAuth from an Express Request.
   *
   * This returns an instance of WebSessionAuth on success or
   * returns null on failure.
   */
  static fromRequest(req: Request): WebSessionAuth {
    const requestCookies: ExpectedCookies = req.cookies;
    const requestHeaders: ExpectedHeaders = req.headers;

    // otherwise populate class properties with private constructor
    return new this(requestCookies, requestHeaders);
  }

  /**
   * Extracts user and session identifiers from this auth, and returns
   * them as a flat objects for use as sentry or log tags.
   */
  userTags(): Record<string, string> {
    return {
      id: this.encodedUserIdentifier ?? 'unauthenticated',
    };
  }

  /**
   * Authenticates a GraphQLClient instance.
   *
   * Requests utilizing WebSessionAuth are authenticated via cookies
   * that are passed through this service.
   *
   * This attaches all permitted headers to the request. See doForwardHeader
   * for more details about "permitted".
   *
   * Authenticated clients must be treated as sensitive data, and their
   * lifecycle should be kept as short as possible.
   */
  authenticateClient(client: GraphQLClient): void {
    Object.entries(this.headers).forEach(([key, value]) => {
      if (doForwardHeader(key)) {
        // express supports duplicated headers for some values, and fetch does not.
        // for cases where the client has duplicated headers (array), just grab the
        // first value, or pass through string if not
        const singleValue = Array.isArray(value) ? value[0] : value;
        client.setHeader(key, singleValue);
      }
    });
    return;
  }
}
