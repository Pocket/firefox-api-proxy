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

export const mapRecommendation = (
  recommendation: GraphRecommendation
): Recommendation => {
  return {
    __typename: 'Recommendation',
    tileId: recommendation.tileId,
    url: recommendation.corpusItem.url,
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
