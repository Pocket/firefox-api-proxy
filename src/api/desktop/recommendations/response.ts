import { NewTabRecommendationsQuery } from '../../../generated/graphql/types';
import { components, paths } from '../../../generated/openapi/types';
import { serverLogger } from '../../../server';
import { Unpack } from '../../../types';

// unpack GraphQL generated type for 'recommendations' from NewTabRecommendationsQuery
export type GraphRecommendation = Unpack<
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
 * Validates the utmSource. logs error if falsey and sets it to a default value.
 */
export const validateAndSetUtmSource = (utmSource?: string): string => {
  if (!utmSource) {
    serverLogger.error(
      'utmSource is undefined or null. Setting it to pocket-newtab'
    );

    utmSource = 'pocket-newtab';
  }
  return utmSource;
};

export const mapRecommendation = (
  recommendation: GraphRecommendation,
  utmSource: string
): Recommendation => {
  const recommendationToReturn: Recommendation = {
    __typename: 'Recommendation',
    recommendationId: recommendation.id,
    tileId: recommendation.tileId,
    url: appendUtmSource(
      recommendation.corpusItem.url,
      validateAndSetUtmSource(utmSource)
    ),
    title: recommendation.corpusItem.title,
    excerpt: recommendation.corpusItem.excerpt,
    publisher: recommendation.corpusItem.publisher,
    imageUrl: recommendation.corpusItem.imageUrl,
  };

  if (recommendation.corpusItem.timeToRead) {
    return {
      ...recommendationToReturn,
      timeToRead: recommendation.corpusItem.timeToRead,
    };
  }

  return recommendationToReturn;
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
