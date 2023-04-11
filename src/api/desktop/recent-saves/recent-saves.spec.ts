import request from 'supertest';
import fetchMock from 'fetch-mock-jest';

import RecentSavesMock from '../../../graphql-proxy/recent-saves/__mocks__/recent-saves';

import config from '../../../config';
import { buildBFFFxServer } from '../../../bfffxServer';
import { WebAuth } from '../../../auth/types';

import { components } from '../../../generated/openapi/types';
type Save = components['schemas']['Save'];

/**
 * This covers some happy path testing for complete server
 * middleware composition. Unit test still catch the finer
 * details, this just ensures middleware is all working together.
 *
 * Fetch is mocked throughout this. Auth is the primary thing that
 * is not being exercised, as the responses are mocked.
 */

const { app } = buildBFFFxServer();

const CONSUMER_KEY = 'fakeConsumerKey';
const buildGraphUrl = () =>
  `${config.app.graphGatewayUrl}?consumer_key=${CONSUMER_KEY}&enable_cors=1`;

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

describe('recent-saves API server', () => {
  beforeEach(() => {
    // each test mocks its own responses in the test scope
    fetchMock.mockReset();
  });

  it('transforms graphql responses to server responses', async () => {
    const mockResponse = await RecentSavesMock({
      // auth components and middlewares are unimportant to mocks,
      // just mock them
      auth: { junk: 'junk' } as unknown as WebAuth,
      consumer_key: 'junkConsumerKey',
      forwardHeadersMiddleware: () => null,
      // provide real variables
      variables: { pagination: { first: 1 } },
    });

    fetchMock.mock(buildGraphUrl(), {
      status: 200,
      body: {
        data: mockResponse,
      },
    });

    const res = await request(app)
      .get(`/desktop/v1/recent-saves?consumer_key=${CONSUMER_KEY}&count=1`)
      .set(authHeaders)
      .send();

    expect(res.status).toEqual(200);
    // response is json
    const parsedRes = JSON.parse(res.text);
    expect(parsedRes.data?.length).toEqual(1);
    const save: Save = parsedRes.data[0];

    // not checking exhaustively, just some general mapping
    // response.spec.ts is responsible for keeping these in sync.
    expect(save.__typename).toEqual('Save');
    expect(save.id).toEqual(mockResponse.user.savedItems.edges[0].node.id);
  });
});
