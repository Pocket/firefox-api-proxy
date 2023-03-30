import { GraphQLClient } from 'graphql-request';

/**
 * Initializes a GraphQLClient for making requests to the web repo GraphQL
 * proxy.
 * @param consumerKey
 * @returns GraphQLClient
 */
export const webProxyClient = (consumerKey): GraphQLClient => {
  /*
    TODO: potential improvements:
    - Incorporate AbortController for timeouts (map to 504 status in controller),
      I'm not sure what the default timeouts are for node js fetch, but they're
      probably too long.
  */
  return new GraphQLClient(
    `https://getpocket.com/graphql?consumer_key=${consumerKey}&enable_cors=1`,
    {
      fetch,
    }
  );
};
