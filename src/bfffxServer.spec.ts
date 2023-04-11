import request from 'supertest';
import fetchMock from 'fetch-mock-jest';

import { GraphQLError } from 'graphql';

import config from './config';
import { buildBFFFxServer } from './bfffxServer';
import { APIErrorResponse } from './bfffxError';

/**
 * The intent of this test file is mostly to test error handling
 * functionality of BFFFxServer, its middleware stack, and the
 * server default error handlers.
 *
 * Server-wide happy path testing is in API specific tests.
 *
 * Fetch is mocked throughout this test file to simulate error
 * cases.
 */

const { app } = buildBFFFxServer();

// lots of log output here, mock console.error to suppress log
// messages, and test what is logged in log tests below
const consoleErrorMock = jest
  .spyOn(console, 'error')
  .mockImplementation(() => null);

const CONSUMER_KEY = 'fakeConsumerKey';
const buildGraphUrl = () =>
  `${config.app.graphGatewayUrl}?consumer_key=${CONSUMER_KEY}&enable_cors=1`;

// generic unhandled GraphQL error response
const errorFetchResponse = {
  errors: [
    {
      message: 'Internal Server Error',
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
      },
    } as Partial<GraphQLError>,
  ],
};

// generic auth cookies
const cookies = {
  a95b4b6: 'tag appropriate user identifier',
  d4a79ec: 'secret session identifier',
  '159e76e': 'secret lookup identifier',
};
const authHeaders = {
  cookie: Object.entries(cookies)
    .reduce((acc, [key, value]) => {
      return acc + ` ${key}=${value};`;
    }, '')
    .trim(),
};

describe('BFFFxServer', () => {
  beforeEach(() => {
    // each test mocks its own responses in the test scope
    fetchMock.mockReset();
    consoleErrorMock.mockReset();
  });

  describe('request headers', () => {
    it('forwards request headers to graphql proxy', async () => {
      // not testing response in this test, just generic 500 response
      fetchMock.mock(buildGraphUrl(), {
        status: 500,
        body: errorFetchResponse,
      });

      const headers = {
        cookie: 'key=value',
        'x-application-header': 'value',
      };

      await request(app)
        .get(`/desktop/v1/recent-saves?consumer_key=${CONSUMER_KEY}`)
        .set(headers)
        .send();

      // get all fetch calls
      const calls = fetchMock.calls();
      expect(calls.length).toEqual(1);
      // only one, so this is the request to inspect
      const call = calls[0][1];
      // programmatic headers are also set, so do not check exclusively
      expect(call.headers).toEqual(
        expect.objectContaining({
          'apollographql-client-name': 'firefox-api-proxy',
          ...headers,
        })
      );
    });
  });

  describe('response headers', () => {
    it('forwards response headers from graphql proxy to clients', async () => {
      const responseHeaders = {
        'set-cookie': 'key=value',
        'x-limit-user-remaining': '992',
      };

      // not testing response in this test, just generic 500 response
      fetchMock.mock(buildGraphUrl(), {
        status: 500,
        body: errorFetchResponse,
        headers: {
          ...responseHeaders,
        },
      });

      const res = await request(app)
        .get(`/desktop/v1/recent-saves?consumer_key=${CONSUMER_KEY}`)
        .send();

      expect(res.headers).toEqual(
        expect.objectContaining({
          'x-limit-user-remaining': responseHeaders['x-limit-user-remaining'],
          'set-cookie': expect.arrayContaining([responseHeaders['set-cookie']]),
        })
      );
    });
  });

  describe('error handling', () => {
    it('error handling transforms auth errors to 401 error template response', async () => {
      fetchMock.mock(buildGraphUrl(), {
        status: 500,
        body: {
          errors: [
            {
              message: 'You must be logged in to use this service',
              extensions: {
                code: 'UNAUTHENTICATED',
              },
            } as Partial<GraphQLError>,
          ],
        },
      });

      const res = await request(app)
        .get(`/desktop/v1/recent-saves?consumer_key=${CONSUMER_KEY}&count=19`)
        .send();

      expect(res.status).toEqual(401);
      const parseResult: APIErrorResponse = JSON.parse(res.text);

      expect(parseResult.errors.length).toEqual(1);
      const err = parseResult.errors[0];
      expect(err.status).toEqual('401');
      expect(err.title).toEqual('Unauthorized');
      // these point to code locations, just ensure it exists
      expect(err.id).toBeTruthy();
      // check for general contents of GraphQLError
      // human readable, check for string matches
      expect(err.source?.graphQLError).toBeTruthy();
      const graphQLError = err.source.graphQLError;
      // includes original error
      expect(
        graphQLError.includes('You must be logged in to use this service')
      ).toBeTruthy();
      expect(graphQLError.includes('UNAUTHENTICATED')).toBeTruthy();
      // includes query variables
      expect(graphQLError.includes('{"pagination":{"first":19}}'));
    });

    it('error handling transforms unhandled GraphQLError responses to 502 error template response', async () => {
      fetchMock.mock(buildGraphUrl(), {
        status: 500,
        body: errorFetchResponse,
      });

      const res = await request(app)
        .get(`/desktop/v1/recent-saves?consumer_key=${CONSUMER_KEY}&count=19`)
        .send();

      expect(res.status).toEqual(502);
      const parseResult: APIErrorResponse = JSON.parse(res.text);

      expect(parseResult.errors.length).toEqual(1);
      const err = parseResult.errors[0];
      expect(err.status).toEqual('502');
      expect(err.title).toEqual('Bad Gateway');
      // these point to code locations, just ensure it exists
      expect(err.id).toBeTruthy();
      // check for general contents of GraphQLError
      // human readable, check for string matches
      expect(err.source?.graphQLError).toBeTruthy();
      const graphQLError = err.source.graphQLError;
      // includes original error
      expect(graphQLError.includes('Internal Server Error')).toBeTruthy();
      expect(graphQLError.includes('INTERNAL_SERVER_ERROR')).toBeTruthy();
      // includes query variables
      expect(graphQLError.includes('{"pagination":{"first":19}}'));
    });

    it('error handling transforms internal service errors into redacted 500 error template response', async () => {
      fetchMock.mock(buildGraphUrl(), {
        throws: new Error('I might reveal library misuse'),
      });

      const res = await request(app)
        .get(`/desktop/v1/recent-saves?consumer_key=${CONSUMER_KEY}&count=19`)
        .send();

      expect(res.status).toEqual(500);
      // ensure entire error text doesn't contain original error
      expect(res.text.includes('I might reveal library misuse')).toBeFalsy();
      const parseResult: APIErrorResponse = JSON.parse(res.text);

      expect(parseResult.errors.length).toEqual(1);
      const err = parseResult.errors[0];
      expect(err.status).toEqual('500');
      expect(err.title).toEqual('Internal Server Error');
      // these point to code locations, just ensure it exists
      expect(err.id).toBeTruthy();
      // no graphql response to include
      expect(err.source?.graphQLError).toBeFalsy();
    });
  });

  describe('error logging', () => {
    it('logs errors as a structure JSON log, including tags to cross reference with sentry', async () => {
      fetchMock.mock(buildGraphUrl(), {
        throws: new Error('I might reveal library misuse'),
      });

      await request(app)
        .get(`/desktop/v1/recent-saves?consumer_key=${CONSUMER_KEY}&count=19`)
        .set(authHeaders)
        .send();

      // redacted errors get logged
      expect(consoleErrorMock).toBeCalledTimes(1);
      const call = consoleErrorMock.mock.calls[0][0];
      // is a JSON document
      const parsedLog: any = JSON.parse(call);
      // log tags include request info
      expect(parsedLog.logTags?.method).toEqual('GET');
      expect(parsedLog.logTags?.path).toEqual('/desktop/v1/recent-saves');
      expect(parsedLog.logTags?.query.includes(CONSUMER_KEY)).toBeTruthy();
      expect(parsedLog.logTags?.query.includes('count')).toBeTruthy();
      expect(parsedLog.logTags?.user?.id).toEqual(cookies.a95b4b6);
      expect(parsedLog.message).toEqual('I might reveal library misuse');
      expect(parsedLog.originalError?.message).toEqual(
        'I might reveal library misuse'
      );
      // error class
      expect(parsedLog.originalError?.name).toEqual('Error');
      // includes stack trace
      expect(parsedLog.originalError?.stack).toBeTruthy();
    });
  });
});
