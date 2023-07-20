import { NewTabRecommendationsQuery } from '../../../generated/graphql/types';
import { components, paths } from '../../../generated/openapi/types';
import { Logger } from '../../../logger';
import { Unpack } from '../../../types';

// unpack GraphQL generated type for 'recommendations' from NewTabRecommendationsQuery
type GraphRecommendation = Unpack<
  NewTabRecommendationsQuery['newTabSlate']['recommendations']
>;

// unpack exact OpenAPI generated types for API response
export type RecommendationsResponse =
  paths['/desktop/v1/recommendations']['get']['responses']['200']['content']['application/json'];

type Recommendation = components['schemas']['Recommendation'];

export const appendUtmSource = (url: string, utmSource: string): string => {
  const urlObject = new URL(url);
  const searchParams = new URLSearchParams(urlObject.search);

  // set utm_source to what is received from the graph.
  // sets it to "pocket-newtab" if not received.
  searchParams.set('utm_source', utmSource);
  urlObject.search = searchParams.toString();

  return urlObject.toString();
};

/**
 * Validates the utmSource and logs error if falsey.
 */
export const validateAndSetDefaultUtmSource = (utmSource?: string): string => {
  if (!utmSource) {
    Logger(
      'utmSource is undefined or null. Setting it to pocket-newtab'
    ).error();

    utmSource = 'pocket-newtab';
  }
  return utmSource;
};

export const mapRecommendation = (
  recommendation: GraphRecommendation,
  utmSource: string
): Recommendation => {
  if (!utmSource) {
    // Log error if utmSource is not received and set it to a default value.
    Logger(
      'utmSource is undefined or null. Setting it to pocket-newtab'
    ).error();

    utmSource = 'pocket-newtab';
  }

  return {
    __typename: 'Recommendation',
    tileId: recommendation.tileId,
    url: appendUtmSource(recommendation.corpusItem.url, utmSource),
    title: recommendation.corpusItem.title,
    excerpt: recommendation.corpusItem.excerpt,
    publisher: recommendation.corpusItem.publisher,
    imageUrl: recommendation.corpusItem.imageUrl,
  };
};

export const responseTransformer = (
  recommendations: NewTabRecommendationsQuery
): RecommendationsResponse => {
  return {
    data: recommendations.newTabSlate.recommendations.map((recommendation) => {
      return mapRecommendation(
        recommendation,
        recommendations.newTabSlate.utmSource
      );
    }),
  };
};
