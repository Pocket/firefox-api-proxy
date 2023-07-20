/**
 * Provides a default useful mock for recommendations.
 *
 * Keep this up to date with the query.
 */

import { faker } from '@faker-js/faker';

import common from '../../__mocks__/common';

import { NewTabRecommendationsQuery } from '../../../generated/graphql/types';
import { RecommendationsParameters } from '../recommendations';

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

const fakeRecommendations = (
  count
): NewTabRecommendationsQuery['newTabSlate']['recommendations'] => {
  return Array(count)
    .fill(0)
    .map(() => ({
      __typename: 'CorpusRecommendation',
      tileId: faker.datatype.number(),
      corpusItem: {
        excerpt: common.itemExcerpt(),
        imageUrl: common.itemUrl(),
        publisher: common.itemDomain(),
        title: common.itemTitle(),
        url: common.itemUrl(),
      },
    }));
};

const recommendations = async ({
  auth,
  consumer_key,
  forwardHeadersMiddleware,
  variables,
}: RecommendationsParameters): Promise<NewTabRecommendationsQuery> => {
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
