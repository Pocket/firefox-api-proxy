import request from 'supertest';
import fetchMock from 'fetch-mock-jest';

import RecommendationsMock from '../../../graphql-proxy/recommendations/__mocks__/recommendations';

import config from '../../../config';
import { buildBFFFxServer } from '../../../bfffxServer';

import { components } from '../../../generated/openapi/types';
type Recommendation = components['schemas']['Recommendation'];

/**
 * This covers some happy path testing for complete server
 * middleware composition. Unit tests still catch the finer
 * details, this just ensures middleware is all working together.
 *
 * Fetch is mocked throughout this. Auth is the primary thing that
 * is not being exercised, as the responses are mocked.
 */

const { app } = buildBFFFxServer();

const CONSUMER_KEY = 'fakeConsumerKey';

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

describe('recommendations API server', () => {
  beforeEach(() => {
    // each test mocks its own responses in the test scope
    fetchMock.mockReset();
  });

  it('transforms graphql responses to server responses', async () => {
    const mockResponse = await RecommendationsMock({
      count: 1,
      locale: 'it',
      region: 'IT',
    });

    fetchMock.mock(config.app.clientApiGraphGatewayUrl, {
      status: 200,
      body: {
        data: mockResponse,
      },
      headers: { ['Cache-control']: 'private,max-age=900' }, // This should be overwritten by the individual endpoint below
    });

    const params = new URLSearchParams();
    params.append('consumer_key', CONSUMER_KEY);
    params.append('count', '1');
    params.append('locale', 'it');
    params.append('region', 'IT');

    const res = await request(app)
      .get(`/desktop/v1/recommendations?${params.toString()}`)
      .set(authHeaders)
      .send()
      .expect('Cache-control', 'public, max-age=900'); // assert the Cache-control header is overwritten by the /v1/recommendations route

    expect(res.status).toEqual(200);

    // response ins json
    const parsedRes = JSON.parse(res.text);
    expect(parsedRes.data?.length).toEqual(1);
    const recommendation: Recommendation = parsedRes.data[0];

    // not checking exhaustively, just some general mapping
    // response.spec.ts is responsible for keeping these in sync.
    expect(recommendation.__typename).toEqual('Recommendation');
    expect(recommendation.tileId).toEqual(
      mockResponse.newTabSlate.recommendations[0].tileId
    );
    if (recommendation.timeToRead !== undefined) {
      expect(recommendation.timeToRead).toBeGreaterThanOrEqual(1);
    }
  });
});
