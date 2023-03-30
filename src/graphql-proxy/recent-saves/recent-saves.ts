import { webProxyClient } from '../lib/client';
import { consumer_key, WebAuth } from '../../auth/types';

import {
  RecentSavesDocument,
  RecentSavesQuery,
  RecentSavesQueryVariables,
} from '../../generated/graphql/types';

/**
 * This client performs the query specified in RecentSaves.graphql, utilizing
 * the generated types for type safe queries.
 *
 * This request requires WebAuth.
 *
 * The MVP of this service does not include integration testing of this client.
 * The authentication portions of the GraphQL proxy are in a "Will not change"
 * state due to deprecations, and rover validation should ensure that we don't
 * prematurely break or deprecate any graph properties being consumed by this
 * client.
 *
 * This client does not validate inputs. It is expected that route handlers will
 * validate and transform any URL parameters, query parameters, and payloads.
 *
 * @param auth
 * @param variables
 */
const recentSaves = async (
  auth: WebAuth,
  consumerKey: consumer_key,
  variables: RecentSavesQueryVariables
): Promise<RecentSavesQuery> => {
  const client = webProxyClient(consumerKey);
  auth.authenticateClient(client);

  /*
    TODO: potential improvements:
    - Error handling. Errors that are not 500 errors specific to this request
      should be handled here as they are implemented in the graph and discovered
      via sentry.
  */
  return client.request<RecentSavesQuery, RecentSavesQueryVariables>(
    RecentSavesDocument,
    variables
  );
};

export default recentSaves;
