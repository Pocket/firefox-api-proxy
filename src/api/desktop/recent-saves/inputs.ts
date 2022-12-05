/**
 * Input validators and transformers live here.
 *
 * Inputs for this route are currently only query parameters.
 *
 * Query validation is the one piece of this server that is not
 * paired with the OpenAPI specification. Any changes to this file
 * **MUST** have corresponding changes to the OpenAPI spec and vice
 * versa.
 */

import { components, paths } from '../../../generated/openapi/types';
import { ToStringParams } from '../../../types';
import { RecentSavesQueryVariables } from '../../../generated/graphql/types';

// unpack exact OpenAPI generated types for API parameters
type RecentSavesQueryParameters =
  paths['/desktop/v1/recent-saves']['get']['parameters']['query'];

type RecentSavesQueryParameterStrings =
  ToStringParams<RecentSavesQueryParameters>;

type APIErrorResponse = components['schemas']['ErrorResponse'];

/**
 * Internal function.
 *
 * All express query parameters are provided as strings.
 *
 * Sets defaults for any parameters with default values, coerces to
 * non-string types when required, and passes through all other string
 * properties unmodified.
 */
export const setDefaultsAndCoerceTypes = (
  stringParams: RecentSavesQueryParameterStrings
): RecentSavesQueryParameters => {
  const withDefaults = {
    // specify any defaults here
    count: '10',
    // spread follows, so provided values will be used if present
    ...stringParams,
  };

  return {
    count: parseInt(withDefaults.count, 10),
  };
};

/**
 * Internal function.
 *
 * Validates query parameters against the OpenAPI provided JSONSchema.
 *
 * Returns APIErrorResponse that should be sent to the client along with
 * a non-200 status code if the parameters are invalid.
 */
export const validate = (
  query: RecentSavesQueryParameters
): APIErrorResponse | null => {
  const valid = query?.count >= 1 && query?.count <= 20;

  if (!valid) {
    // only one error is possible here, just build it manually
    // detail and source must be built procedurally if we introduce more
    // parameters here
    return {
      errors: [
        {
          id: '3f262c60-c34d-4ea8-8a14-1012d2ef7953',
          status: '400',
          title: 'Bad Request',
          detail: 'The count query parameter must be >0 and <=20',
          source: {
            parameters: 'count',
          },
        },
      ],
    };
  }

  return null;
};

/**
 * Internal function.
 *
 * Converts a set of RecentSavesQueryParameters to a corresponding
 * set of RecentSavesQueryVariables for the GraphQL client.
 *
 * @param query
 */
export const transform = (
  query: RecentSavesQueryParameters
): RecentSavesQueryVariables => {
  return {
    pagination: {
      first: query.count,
    },
  };
};

/**
 * Use this in the route handler.
 *
 * Parses query parameter strings as provided by express.req.query,
 * sets defaults, validates them, and transforms them into
 * RecentSavesQueryVariables for the GraphQL client.
 *
 * This returns a discriminated union that includes errors. Be sure
 * to check for them and return them to the client if present.
 * @param query
 */
export const handleQueryParameters = (
  query: RecentSavesQueryParameterStrings
): RecentSavesQueryVariables | APIErrorResponse => {
  const coerced = setDefaultsAndCoerceTypes(query);
  const errors = validate(coerced);

  if (errors) {
    return errors;
  }

  return transform(coerced);
};
