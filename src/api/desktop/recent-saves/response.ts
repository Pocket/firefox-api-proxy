/**
 * Response transformers live here.
 *
 * These functions take responses from graphql and transform them
 * into objects defined in the openapi specification.
 */

import { RecentSavesQuery } from '../../../generated/graphql/types';
import { components, paths } from '../../../generated/openapi/types';
import { Unpack } from '../../../types';

// unpack exact GraphQL generated types from RecentSavesQuery
type GraphSavedItemEdge = Unpack<
  RecentSavesQuery['user']['savedItems']['edges']
>;
type GraphSavedItem = GraphSavedItemEdge['node'];
type GraphItem = Extract<GraphSavedItem['item'], { __typename: 'Item' }>;

// unpack exact OpenAPI generated types for API response
type RecentSavesResponse =
  paths['/desktop/v1/recent-saves']['get']['responses']['200']['content']['application/json'];
type Save = components['schemas']['Save'];
type PendingSave = components['schemas']['PendingSave'];

type ValidReducerResponse = Save | PendingSave | null;

const reduceGraphItem = (savedItem: GraphSavedItem): Save => {
  const nestedItem: GraphItem = savedItem.item as GraphItem;
  return {
    __typename: 'Save',
    id: savedItem.id,
    resolvedUrl: nestedItem.resolvedUrl,
    givenUrl: nestedItem.givenUrl,
    title: nestedItem.title,
    excerpt: nestedItem.excerpt,
    domain: nestedItem.domain,
    wordCount: nestedItem.wordCount,
    topImageUrl: nestedItem?.topImage?.url ?? null,
  };
};

const reduceGraphPendingItem = (savedItem: GraphSavedItem): PendingSave => {
  return {
    __typename: 'PendingSave',
    id: savedItem.id,
    givenUrl: savedItem.url,
  };
};

/**
 * Pattern matching to select the correct reducer for each SavedItem,
 * or to just return null if some unrecognized type is provided.
 *
 * @param savedItem
 */
const reduceItem = (savedItem: GraphSavedItemEdge): ValidReducerResponse => {
  switch (savedItem.node.item.__typename) {
    case 'Item':
      return reduceGraphItem(savedItem.node);
    case 'PendingItem':
      return reduceGraphPendingItem(savedItem.node);
    // handle unknown types
    default:
      return null;
  }
};

/**
 * This function transforms the GraphQL RecentSavesQuery type
 * into a OpenAPI RecentSavesResponse.
 * @param saves
 */
export const responseTransformer = (
  saves: RecentSavesQuery
): RecentSavesResponse => {
  return {
    data: saves.user.savedItems.edges
      .map((s) => reduceItem(s))
      // filter all unknown types from response
      .filter((s) => s !== null),
  };
};
