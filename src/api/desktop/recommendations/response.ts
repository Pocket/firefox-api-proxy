import { RecommendationsQuery } from '../../../generated/graphql/types';
import { components, paths } from '../../../generated/openapi/types';
import { Unpack } from '../../../types';

// unpack GraphQL generated types from RecommendationsQuery
type GraphRecommendation = Unpack<
  RecommendationsQuery['newTabSlate']['recommendations']
>;

// unpack exact OpenAPI generated types for API response
export type RecommendationsResponse =
  paths['/desktop/v1/recommendations']['get']['responses']['200']['content']['application/json'];
type Recommendation = components['schemas']['Recommendation'];

export const appendUtmSource = (url: string): string => {
  const urlObject = new URL(url);
  const searchParams = new URLSearchParams(urlObject.search);

  // Set a static utm_source to attribute traffic to the new NewTab markets.
  // TODO: [DIS-803] Make utm_source unique per ScheduledSurface,
  //  before migrating Firefox Release en-US to this API.
  searchParams.set('utm_source', 'pocket-newtab-bff');
  urlObject.search = searchParams.toString();

  return urlObject.toString();
};

export const mapRecommendation = (
  recommendation: GraphRecommendation
): Recommendation => {
  return {
    __typename: 'Recommendation',
    tileId: recommendation.tileId,
    url: appendUtmSource(recommendation.corpusItem.url),
    title: recommendation.corpusItem.title,
    excerpt: recommendation.corpusItem.excerpt,
    publisher: recommendation.corpusItem.publisher,
    imageUrl: recommendation.corpusItem.imageUrl,
  };
};

export const responseTransformer = (
  recommendations: RecommendationsQuery
): RecommendationsResponse => {
  return {
    data: recommendations.newTabSlate.recommendations.map(mapRecommendation),
  };
};
