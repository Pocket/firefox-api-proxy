import { webProxyClient } from '../lib/client';

import {
  NewTabRecommendationsDocument,
  NewTabRecommendationsQuery,
  NewTabRecommendationsQueryVariables,
} from '../../generated/graphql/types';
import { ClientParameters } from '../types';

/**
 * recommendations.ts GraphQL client request parameters
 */
export type RecommendationsParameters =
  ClientParameters<NewTabRecommendationsQueryVariables>;

/**
 * This client performs the query specified in Recommendations.graphql, utilizing
 * the generated types for type safe queries.
 *
 * This request may be performed without auth.
 *
 * This client does not validate inputs. It is expected that route handlers will
 * validate and transform any URL parameters, query parameters, and payloads.
 */
const Recommendations = async ({
  auth,
  consumer_key,
  forwardHeadersMiddleware,
  variables,
}: RecommendationsParameters) => {
  const client = webProxyClient(consumer_key, forwardHeadersMiddleware);
  auth.authenticateClient(client);

  return client.request<
    NewTabRecommendationsQuery,
    NewTabRecommendationsQueryVariables
  >(NewTabRecommendationsDocument, variables);
};

export default Recommendations;
