import request from 'supertest';
import fetchMock from 'fetch-mock-jest';

import RecommendationsMock from '../../graphql-proxy/recommendations/__mocks__/recommendations';

import config from '../../config';
import { buildBFFFxServer } from '../../bfffxServer';

import { components } from '../../generated/openapi/types';
type LegacyFeedItem = components['schemas']['LegacyFeedItem'];

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

describe('v3 legacy recommendations API server', () => {
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
    params.append('consumer_key', CONSUMER_KEY); // No longer used for auth
    params.append('version', '3');
    params.append('count', '1');
    params.append('locale_lang', 'it');
    params.append('region', 'IT');

    const res = await request(app)
      .get(`/v3/firefox/global-recs?${params.toString()}`)
      .send()
      .expect('Cache-control', 'public, max-age=1800'); // assert the Cache-control header is overwritten by the global-recs route

    expect(res.status).toEqual(200);

    // response is json
    const parsedRes = JSON.parse(res.text);
    expect(parsedRes.recommendations?.length).toEqual(1);
    const recommendation: LegacyFeedItem = parsedRes.recommendations[0];

    // not checking exhaustively, just some general mapping
    // response.spec.ts is responsible for keeping these in sync.
    expect(recommendation.id).toEqual(
      mockResponse.newTabSlate.recommendations[0].tileId
    );
    if (recommendation.time_to_read !== undefined) {
      expect(recommendation.time_to_read).toBeGreaterThanOrEqual(1);
    }
  });
});
