/**
 * Provides a default useful mock for recent-saves.
 *
 * Keep this up to date with the query.
 */

import { faker } from '@faker-js/faker';
import { consumer_key, WebAuth } from '../../../auth/types';

import {
  RecentSavesQuery,
  RecentSavesQueryVariables,
  SavedItemStatus,
} from '../../../generated/graphql/types';

const fakeSaves = (count): RecentSavesQuery['user']['savedItems']['edges'] => {
  return Array(count)
    .fill(0)
    .map(() => ({
      cursor: faker.datatype.uuid(), // close enough, opaque id string
      node: {
        __typename: 'SavedItem',
        id: faker.datatype.number().toString(),
        status: 'UNREAD' as SavedItemStatus,
        url: faker.internet.url(),
        item: {
          __typename: 'Item',
          wordCount: faker.datatype.number({ max: 1000 }),
          topImage: {
            url: faker.image.imageUrl(),
          },
          title: faker.lorem.lines(1),
          timeToRead: faker.datatype.number({ max: 15 }),
          resolvedUrl: faker.internet.url(),
          givenUrl: faker.internet.url(),
          excerpt: faker.lorem.paragraph(),
          // I haven't actually seen a domain in any of my saves, don't know
          // what this is supposed to look like
          domain: null,
        },
      },
    }));
};

const recentSaves = async (
  auth: WebAuth,
  consumerKey: consumer_key,
  variables: RecentSavesQueryVariables
): Promise<RecentSavesQuery> => {
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
