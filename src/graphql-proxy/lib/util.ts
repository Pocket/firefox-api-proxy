import { GraphQLError } from 'graphql';

type GraphQLErrorResponse = {
  errors: GraphQLError[];
};

/**
 * Best effort attempt to parse a human readable error message
 * from a GraphQL error response.
 * @param err
 */
export const parseGraphQLErrorMessage = (err: Error | string): string => {
  if (err instanceof Error) {
    // if it's an error, just return the error message
    return err.message;
  } else if (typeof err === 'string') {
    // attempt to parse a GraphQL error
    const maybeGraphError: GraphQLErrorResponse = JSON.parse(err);
    // just return raw string if not expected format
    return maybeGraphError?.errors?.[0]?.message ?? err;
  }
  // how did we get here? who throws something else?
  throw new Error(
    `parseGraphQLErrorMessage received a non-error, non-string parameter: ${JSON.stringify}`
  );
};
