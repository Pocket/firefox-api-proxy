import { webProxyClient } from '../lib/client';

import {
  RecentSavesDocument,
  RecentSavesQuery,
  RecentSavesQueryVariables,
} from '../../generated/graphql/types';
import { ClientParameters } from '../types';

/**
 * recent-saves.ts client request parameters
 */
export type RecentSavesParameters = ClientParameters<RecentSavesQueryVariables>;

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
const recentSaves = async ({
  auth,
  consumer_key,
  forwardHeadersMiddleware,
  variables,
}: RecentSavesParameters) => {
  const client = webProxyClient(consumer_key, forwardHeadersMiddleware);
  auth.authenticateClient(client);

  return client.request<RecentSavesQuery, RecentSavesQueryVariables>(
    RecentSavesDocument,
    variables
  );
};

export default recentSaves;
