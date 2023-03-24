import { GraphQLClient } from 'graphql-request';
import { consumer_key, WebAuth } from '../../auth/types';

import {
  RecentSavesDocument,
  RecentSavesQuery,
  RecentSavesQueryVariables,
} from '../../generated/graphql/types';

/**
 * This client initializes a `graphql-request` client, performing the query
 * specified in RecentSaves.graphql. This relies on the types generated from
 * this file.
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
  /*
    TODO: potential improvements:
    - Initialization of this client could be moved outside this function scope
      if we start restricting to specific consumer_keys for each API.
    - Incorporate AbortController for timeouts (map to 504 status in controller),
      I'm not sure what the default timeouts are for node js fetch, but they're
      probably too long.
    - Error handling. All rejected promises returned by this client should be
      logged to sentry and returned as 500 errors until we have data on real
      errors encountered and have samples for implementing error handlers.
  */
  const client = new GraphQLClient(
    `https://getpocket.com/graphql?consumer_key=${consumerKey}&enable_cors=1`,
    {
      fetch,
    }
  );
  auth.authenticateClient(client);

  return client.request<RecentSavesQuery, RecentSavesQueryVariables>(
    RecentSavesDocument,
    variables
  );
};

export default recentSaves;
