/**
 * Provides a default useful mock for recommendations.
 *
 * Keep this up to date with the query.
 */

import { faker } from '@faker-js/faker';

import common from '../../__mocks__/common';

import {
  NewTabRecommendationsQuery,
  NewTabRecommendationsQueryVariables,
} from '../../../generated/graphql/types';
import { GraphRecommendation } from '../../../api/desktop/recommendations/response';

/**
 * faker locales do not match our own, map ours to faker locales
 *
 * extend me as this service supports more locales.
 */
const fakerLocales = {
  es_es: 'es',
  es: 'es',
  fr_fr: 'fr',
  fr: 'fr',
  it_it: 'it',
  it: 'it',
};

/**
 *
 * @param hasTimeToRead If true, timeToRead is set to [1, 9], otherwise it's undefined.
 */
const fakeRecommendation = (hasTimeToRead = true): GraphRecommendation => {
  const recommendationWithoutTimeToRead: GraphRecommendation = {
    __typename: 'CorpusRecommendation',
    id: faker.datatype.uuid(),
    tileId: faker.datatype.number(),
    corpusItem: {
      excerpt: common.itemExcerpt(),
      imageUrl: common.itemUrl(),
      publisher: common.itemDomain(),
      title: common.itemTitle(),
      url: common.itemUrl(),
    },
  };

  return recommendationWithoutTimeToRead;
};

const fakeRecommendations = (
  count
): NewTabRecommendationsQuery['newTabSlate']['recommendations'] => {
  return Array(count)
    .fill(0)
    .map((value, index) =>
      // Add timeToRead only for even numbered recommendations.
      fakeRecommendation(index % 2 === 0)
    );
};

const recommendations = async (
  variables: NewTabRecommendationsQueryVariables
): Promise<NewTabRecommendationsQuery> => {
  // set faker locale based on variables
  // default to english if unrecognized, roughly matches graph behavior selecting locale.
  const fakerLocale = fakerLocales[variables.locale.toLowerCase()] ?? 'en';
  faker.setLocale(fakerLocale);

  const response = {
    newTabSlate: {
      recommendations: fakeRecommendations(variables.count),
      utmSource: `pocket-newtab-${fakerLocale}`,
    },
  };

  // revert faker locale to english
  faker.setLocale('en');
  return Promise.resolve(response);
};

export default recommendations;
