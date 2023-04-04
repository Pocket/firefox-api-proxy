import { GraphQLError } from 'graphql';
import { ClientError } from 'graphql-request';

type GraphQLErrorResponse = {
  errors: GraphQLError[];
};

/**
 * Best effort attempt to parse a human readable error message
 * from a GraphQL error response.
 *
 * Full graphql error messages are too long and get truncated in
 * sentry. Attempt to get a shorter human readable error message.
 * @param err
 */
export const parseGraphQLErrorMessage = (
  err: ClientError | Error | string
): string => {
  if (err instanceof ClientError) {
    // attempt to get internal message
    return err.response?.errors?.[0]?.message ?? err.message;
  } else if (err instanceof Error) {
    // if it's a generic error, just return the error message
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
