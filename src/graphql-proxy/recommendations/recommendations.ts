import { webProxyClient } from '../lib/client';
import { consumer_key } from '../../auth/types';

import {
  RecommendationsDocument,
  RecommendationsQuery,
  RecommendationsQueryVariables,
} from '../../generated/graphql/types';

/**
 * This client performs the query specified in Recommendations.graphql, utilizing
 * the generated types for type safe queries.
 *
 * This request may be performed without auth.
 *
 * This client does not validate inputs. It is expected that route handlers will
 * validate and transform any URL parameters, query parameters, and payloads.
 */
const recommendations = async (
  variables: RecommendationsQueryVariables,
  consumerKey: consumer_key
): Promise<RecommendationsQuery> => {
  const client = webProxyClient(consumerKey);

  /*
    TODO: potential improvements:
    - Error handling. Errors that are not 500 errors specific to this request
      should be handled here as they are implemented in the graph and discovered
      via sentry.
  */
  return client.request<RecommendationsQuery, RecommendationsQueryVariables>(
    RecommendationsDocument,
    variables
  );
};

export default recommendations;
