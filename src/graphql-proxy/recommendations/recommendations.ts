import {
  NewTabRecommendationsDocument,
  NewTabRecommendationsQuery,
  NewTabRecommendationsQueryVariables,
} from '../../generated/graphql/types';
import { GraphQLClient } from 'graphql-request';
import config from '../../config';

/**
 * This client performs the query specified in Recommendations.graphql, utilizing
 * the generated types for type safe queries.
 *
 * This request may be performed without auth.
 *
 * This client does not validate inputs. It is expected that route handlers will
 * validate and transform any URL parameters, query parameters, and payloads.
 */
const Recommendations = async (
  variables: NewTabRecommendationsQueryVariables
) => {
  const client = new GraphQLClient(config.app.clientApiGraphGatewayUrl, {
    fetch,
    // baseline headers for all requests
    headers: {
      'apollographql-client-name': config.app.clientApiName,
    },
  });

  return client.request<
    NewTabRecommendationsQuery,
    NewTabRecommendationsQueryVariables
  >(NewTabRecommendationsDocument, variables);
};

export default Recommendations;
