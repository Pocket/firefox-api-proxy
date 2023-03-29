import { GraphQLClient } from 'graphql-request';
import { consumer_key } from '../../auth/types';

import {
  RecommendationsDocument,
  RecommendationsQuery,
  RecommendationsQueryVariables,
} from '../../generated/graphql/types';

/**
 * This client initializes a `graphql-request` client, performing the query
 * specified in Recommendations.graphql. This relies on types generated from
 * this file.
 *
 * This client does not validate inputs. It is expected that route handlers will
 * validate and transform any URL parameters, query parameters, and payloads.
 */
const recommendations = async (
  variables: RecommendationsQueryVariables,
  consumerKey: consumer_key
): Promise<RecommendationsQuery> => {
  const client = new GraphQLClient(
    `https://getpocket.com/graphql?consumer_key=${consumerKey}&enable_cors=1`,
    {
      fetch,
    }
  );

  return client.request<RecommendationsQuery, RecommendationsQueryVariables>(
    RecommendationsDocument,
    variables
  );
};

export default recommendations;
