import { RecommendationsQuery } from '../../generated/graphql/types';
import { components, paths } from '../../generated/openapi/types';
import { Unpack } from '../../types';
import { appendUtmSource } from '../desktop/recommendations/response';

// unpack GraphQL generated types from RecommendationsQuery
type GraphRecommendation = Unpack<
  RecommendationsQuery['newTabSlate']['recommendations']
>;

// unpack exact OpenAPI generated types for API response
export type GlobalRecsResponse =
  paths['/v3/firefox/global-recs']['get']['responses']['200']['content']['application/json'];
type LegacyFeedItem = components['schemas']['LegacyFeedItem'];

export const mapRecommendation = (
  recommendation: GraphRecommendation
): LegacyFeedItem => {
  const encodedImageUrl = encodeURIComponent(
    recommendation.corpusItem.imageUrl
  );

  return {
    id: recommendation.tileId,
    url: appendUtmSource(recommendation.corpusItem.url),
    title: recommendation.corpusItem.title,
    excerpt: recommendation.corpusItem.excerpt,
    domain: recommendation.corpusItem.publisher,
    raw_image_src: recommendation.corpusItem.imageUrl,
    image_src: `https://img-getpocket.cdn.mozilla.net/direct?url=${encodedImageUrl}&resize=w450`,
  };
};

export const responseTransformer = (
  recommendations: RecommendationsQuery
): GlobalRecsResponse => {
  return {
    status: 1,
    spocs: [],
    settings: {
      domainAffinityParameterSets: {},
      timeSegments: [
        {
          id: 'week',
          startTime: 604800,
          endTime: 0,
          weightPosition: 1,
        },
        {
          id: 'month',
          startTime: 2592000,
          endTime: 604800,
          weightPosition: 0.5,
        },
      ],
      recsExpireTime: 5400,
      spocsPerNewTabs: 0.5,
      // version is a static, arbitrary hash to mimic the legacy response schema
      version: '6f605b0212069b4b8d3d040faf55742061a25c16',
    },
    recommendations:
      recommendations.newTabSlate.recommendations.map(mapRecommendation),
  };
};
