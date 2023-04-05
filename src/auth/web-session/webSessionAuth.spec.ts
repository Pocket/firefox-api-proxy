import { Request } from 'express';
import { GraphQLClient } from 'graphql-request';

import { WebSessionAuth } from './webSessionAuth';

describe('WebSessionAuth', () => {
  let mockRequest: Partial<Request>;

  const cookies = {
    a95b4b6: 'tag appropriate user identifier',
    d4a79ec: 'secret session identifier',
    '159e76e': 'secret lookup identifier',
  };
  const headers = {
    cookie: Object.entries(cookies)
      .reduce((acc, [key, value]) => {
        return acc + ` ${key}=${value};`;
      }, '')
      .trim(),
  };

  beforeEach(() => {
    mockRequest = {
      cookies: { ...cookies },
      headers: { ...headers },
    };
  });

  describe('fromRequest', () => {
    it('returns null if no a95b4b6', () => {
      delete mockRequest.cookies.a95b4b6;
      const wsAuth = WebSessionAuth.fromRequest(mockRequest as Request);

      expect(wsAuth).toBeNull();
    });

    it('returns null if no d4a79ec', () => {
      delete mockRequest.cookies.d4a79ec;
      const wsAuth = WebSessionAuth.fromRequest(mockRequest as Request);

      expect(wsAuth).toBeNull();
    });

    it('returns null if no 159e76e', () => {
      delete mockRequest.cookies['159e76e'];
      const wsAuth = WebSessionAuth.fromRequest(mockRequest as Request);

      expect(wsAuth).toBeNull();
    });

    it('returns WebSessionAuth if all auth cookies and headers are present', () => {
      const wsAuth = WebSessionAuth.fromRequest(mockRequest as Request);

      expect(wsAuth).toBeInstanceOf(WebSessionAuth);
    });
  });

  describe('__typename', () => {
    it('has expected __typename', () => {
      const wsAuth = WebSessionAuth.fromRequest(mockRequest as Request);

      expect(wsAuth).toBeInstanceOf(WebSessionAuth);
      expect(wsAuth.__typename).toEqual('WebSessionAuth');
    });
  });

  describe('sentryTags', () => {
    it('returns only data appropriate for sentry tags', () => {
      const wsAuth = WebSessionAuth.fromRequest(mockRequest as Request);

      expect(wsAuth).toBeInstanceOf(WebSessionAuth);
      const tags = wsAuth.sentryTags();
      // deep equality check, do not allow extras
      expect(tags).toEqual({
        user: 'tag appropriate user identifier',
      });
    });
  });

  describe('authenticateClient', () => {
    it('sets the cookie header from the request onto GraphQLClient', () => {
      const setHeaderMock = jest.fn();
      const mockGraphQLClient = {
        setHeader: setHeaderMock,
      } as Partial<GraphQLClient>;

      const wsAuth = WebSessionAuth.fromRequest(mockRequest as Request);

      expect(wsAuth).toBeInstanceOf(WebSessionAuth);
      wsAuth.authenticateClient(mockGraphQLClient as GraphQLClient);
      expect(setHeaderMock).toBeCalledTimes(1);
      expect(setHeaderMock).toBeCalledWith('cookie', headers.cookie);
    });
  });
});
