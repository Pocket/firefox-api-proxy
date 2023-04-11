import fetchMock from 'fetch-mock-jest';
import { Response } from 'express';

import config from '../../config';
import {
  RecentSavesDocument,
  RecentSavesQuery,
  RecentSavesQueryVariables,
} from '../../generated/graphql/types';
import { forwardHeadersMiddleware, webProxyClient } from './client';

describe('GraphQL Client', () => {
  // mock express response to see headers being set
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockResponse = {
      set: jest.fn().mockReturnThis(),
    };
  });

  const expectedHeaders = {
    passthrough: 'I get forwarded to the end client',
    multiple: 'all headers get forwarded',
  };

  // mock fetch to simulate a few cases:
  fetchMock.mock(
    'http://example.com/graph-response?consumer_key=fakeConsumerKey&enable_cors=1',
    {
      status: 200,
      headers: { ...expectedHeaders },
      body: {
        data: {
          user: {
            savedItems: null,
          },
        },
      },
    }
  );

  fetchMock.mock(
    'http://example.com/throws?consumer_key=fakeConsumerKey&enable_cors=1',
    {
      throws: new Error('I do not have headers!'),
    }
  );

  describe('forwardHeadersMiddleware', () => {
    it('forwards headers on graph response', async () => {
      config.app.graphGatewayUrl = 'http://example.com/graph-response';
      const client = webProxyClient(
        'fakeConsumerKey',
        forwardHeadersMiddleware(mockResponse as Response)
      );

      await client.request<RecentSavesQuery, RecentSavesQueryVariables>(
        RecentSavesDocument,
        {}
      );

      // for this case, it is the Map interface, so 4 separate set calls due to forEach
      // the extra 2 are content-length and content-type, which are automatic
      expect(mockResponse.set).toBeCalledTimes(4);
      expect(mockResponse.set).toBeCalledWith(
        'multiple',
        'all headers get forwarded'
      );
      expect(mockResponse.set).toBeCalledWith(
        'passthrough',
        'I get forwarded to the end client'
      );
    });

    it('handles objects without errors gracefully', async () => {
      config.app.graphGatewayUrl = 'http://example.com/throws';
      const client = webProxyClient(
        'fakeConsumerKey',
        forwardHeadersMiddleware(mockResponse as Response)
      );

      await expect(
        client.request<RecentSavesQuery, RecentSavesQueryVariables>(
          RecentSavesDocument,
          {}
        )
      ).rejects.toThrow('I do not have headers!');

      expect(mockResponse.set).toBeCalledTimes(0);
    });
  });
});
