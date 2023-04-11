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
    // `x-*` application specific headers get forwarded
    'x-forward-application-header': 'forwardMe',
    // programmatic headers do not
    'content-type': 'application/json; charset=UTF-8',
  };

  beforeEach(() => {
    mockRequest = {
      cookies: { ...cookies },
      headers: { ...headers },
    };
  });

  describe('fromRequest', () => {
    it('returns WebSessionAuth if all auth cookies and headers are present', () => {
      const wsAuth = WebSessionAuth.fromRequest(mockRequest as Request);

      expect(wsAuth).toBeInstanceOf(WebSessionAuth);
    });

    it('does not throw an error with empty headers and cookies', () => {
      mockRequest.headers = {};
      mockRequest.cookies = {};
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

  describe('userTags', () => {
    it('returns only data appropriate for sentry tags', () => {
      const wsAuth = WebSessionAuth.fromRequest(mockRequest as Request);

      expect(wsAuth).toBeInstanceOf(WebSessionAuth);
      const tags = wsAuth.userTags();
      // deep equality check, do not allow extras
      expect(tags).toEqual({
        id: 'tag appropriate user identifier',
      });
    });

    it('user.id is anonymous for unauthenticated requests', () => {
      delete mockRequest.cookies.a95b4b6;
      delete mockRequest.cookies.d4a79ec;
      delete mockRequest.cookies['159e76e'];
      const wsAuth = WebSessionAuth.fromRequest(mockRequest as Request);

      expect(wsAuth).toBeInstanceOf(WebSessionAuth);
      const tags = wsAuth.userTags();
      // deep equality check, do not allow extras
      expect(tags).toEqual({
        id: 'unauthenticated',
      });
    });
  });

  describe('authenticateClient', () => {
    it('sets cookie and application specific headers from the request onto GraphQLClient', () => {
      const setHeaderMock = jest.fn();
      const mockGraphQLClient = {
        setHeader: setHeaderMock,
      } as Partial<GraphQLClient>;

      const wsAuth = WebSessionAuth.fromRequest(mockRequest as Request);

      expect(wsAuth).toBeInstanceOf(WebSessionAuth);
      wsAuth.authenticateClient(mockGraphQLClient as GraphQLClient);
      expect(setHeaderMock).toBeCalledTimes(2);
      expect(setHeaderMock).toBeCalledWith('cookie', headers.cookie);
      expect(setHeaderMock).toBeCalledWith(
        'x-forward-application-header',
        headers['x-forward-application-header']
      );
    });
  });
});
