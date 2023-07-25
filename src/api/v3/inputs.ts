/**
 * Input validators and transformers live here.
 *
 * Query validation is the one piece of this server that is not
 * paired with the OpenAPI specification. Any changes to this file
 * **MUST** have corresponding changes to the OpenAPI spec and vice
 * versa.
 */

import { paths } from '../../generated/openapi/types';
import { ToStringParams } from '../../types';
import { NewTabRecommendationsQueryVariables } from '../../generated/graphql/types';
import { BFFFxError, BFFFxErrorInstanceType } from '../../bfffxError';
import { validate } from '../desktop/recommendations/inputs';

export type GlobalRecsQueryParameters =
  paths['/v3/firefox/global-recs']['get']['parameters']['query'];

export type GlobalRecsQueryParameterStrings = Partial<
  ToStringParams<GlobalRecsQueryParameters>
>;

/**
 * Locale and region are required, however they do not have defaults,
 * and we do not know if they are present until `validate` is executed.
 * This type captures that uncertainty.
 */
type PreValidatedQueryParameters = {
  count: number;
  locale?: string;
  region?: string;
};

/**
 * Returns the set of query parameters with defaults filled in.
 *
 * Variables without defaults may not be present. None of these
 * values have been validated yet.
 *
 * @param stringParams - express.req.query
 */
export const setDefaultsAndCoerceTypes = (
  stringParams: GlobalRecsQueryParameterStrings
): PreValidatedQueryParameters => {
  return {
    count: parseInt(stringParams.count ?? '20', 10),
    region: stringParams.region,
    locale: stringParams.locale_lang,
  };
};

/**
 * Use this in the route handler.
 *
 * Parses query parameter strings as provided by express.req.query,
 * sets defaults, validates them, and transforms them into
 * NewTabRecommendationsQueryVariables for the GraphQL client.
 *
 * This returns a discriminated union that includes errors. Be sure
 * to check for them and return them to the client if present.
 * @param query
 */
export const handleQueryParameters = (
  query: GlobalRecsQueryParameterStrings
): NewTabRecommendationsQueryVariables | BFFFxErrorInstanceType => {
  const coerced = setDefaultsAndCoerceTypes(query);
  const maybeValid = validate(coerced);

  if (maybeValid instanceof BFFFxError) {
    return maybeValid;
  }

  return maybeValid as NewTabRecommendationsQueryVariables;
};
