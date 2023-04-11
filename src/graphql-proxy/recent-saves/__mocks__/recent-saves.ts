/**
 * Provides a default useful mock for recent-saves.
 *
 * Keep this up to date with the query.
 */

import { faker } from '@faker-js/faker';

import common from '../../__mocks__/common';

import {
  RecentSavesQuery,
  SavedItemStatus,
} from '../../../generated/graphql/types';
import { RecentSavesParameters } from '../recent-saves';

const fakeSaves = (count): RecentSavesQuery['user']['savedItems']['edges'] => {
  return Array(count)
    .fill(0)
    .map(() => ({
      cursor: faker.datatype.uuid(), // close enough, opaque id string
      node: {
        __typename: 'SavedItem',
        id: common.pocketID(),
        status: 'UNREAD' as SavedItemStatus,
        url: common.itemUrl(),
        item: {
          __typename: 'Item',
          wordCount: faker.datatype.number({ max: 1000 }),
          topImage: {
            url: common.itemImage(),
          },
          title: common.itemTitle(),
          timeToRead: faker.datatype.number({ max: 15 }),
          resolvedUrl: common.itemUrl(),
          givenUrl: common.itemUrl(),
          excerpt: common.itemExcerpt(),
          domain: common.itemDomain(),
        },
      },
    }));
};

const recentSaves = async ({
  auth,
  consumer_key,
  forwardHeadersMiddleware,
  variables,
}: RecentSavesParameters): Promise<RecentSavesQuery> => {
  const count =
    (variables?.pagination?.first || variables?.pagination?.last) ?? 10;
  return Promise.resolve({
    user: {
      savedItems: {
        edges: fakeSaves(count),
      },
    },
  });
};

export default recentSaves;
