/**
 * Input validators and transformers live here.
 *
 * Query validation is the one piece of this server that is not
 * paired with the OpenAPI specification. Any changes to this file
 * **MUST** have corresponding changes to the OpenAPI spec and vice
 * versa.
 */

import { paths } from '../../../generated/openapi/types';
import { ToStringParams } from '../../../types';
import { RecommendationsQueryVariables } from '../../../generated/graphql/types';
import { BFFFxError, BFFFxErrorInstanceType } from '../../../bfffxError';

export type RecommendationsQueryParameters =
  paths['/desktop/v1/recommendations']['get']['parameters']['query'];

export type RecommendationsQueryParameterStrings = Partial<
  ToStringParams<RecommendationsQueryParameters>
>;

type PreValidatedQueryParameters = {
  count: number;
  locale?: string;
  region?: string;
};

// validator responses include everything needed to build an error response
type ValidatorFunction = (value: any) => {
  propertyName: string;
  errorDetail: string;
};

// all valid locales
const validLocales = ['fr', 'fr-FR', 'es', 'es-ES', 'it', 'it-IT'];
// copy to set for fast lookup, all lowercase
const validLocalesSet = new Set(
  validLocales.map((locale) => locale.toLowerCase())
);

// prettier config thrashes here
// prettier-ignore
// returns details to build error response if invalid, case insensitive
const isValidLocale: ValidatorFunction = (locale: any) =>
  !validLocalesSet.has(locale?.toLowerCase())
    ? {
      propertyName: 'locale',
      errorDetail: `Locale must be provided. Valid locales include: ${JSON.stringify(validLocales)}`,
    }
    : null;

// all valid regions
const validRegions = ['FR', 'ES', 'IT'];
// copy to set for fast lookup, all lowercase
const validRegionsSet = new Set(
  validRegions.map((region) => region.toLowerCase())
);

// prettier config thrashes here
// prettier-ignore
// returns details to build error response if invalid, case insensitive
const isValidRegion: ValidatorFunction = (region: any) =>
  !validRegionsSet.has(region?.toLowerCase())
    ? {
      propertyName: 'region',
      errorDetail: `Region must be provided. Valid regions include ${JSON.stringify(validRegions)}`,
    }
    : null;

// prettier config thrashes here
// prettier-ignore
// returns details to build error response if invalid
const isValidCount: ValidatorFunction = (count: any) =>
  !(count > 0 && count <= 30)
    ? {
      propertyName: 'count',
      errorDetail: 'The count query parameter must be >0 and <=30',
    }
    : null;

/**
 * Returns the set of query parameters with defaults filled in.
 *
 * Variables without defaults may not be present. None of these
 * values have been validated yet.
 *
 * @param stringParams - express.req.query
 */
export const setDefaultsAndCoerceTypes = (
  stringParams: RecommendationsQueryParameterStrings
): PreValidatedQueryParameters => {
  const withDefaults = {
    // specify defaults here
    count: '30',
    // spread to overwrite defaults with provided values
    ...stringParams,
  };

  return {
    ...withDefaults,
    count: parseInt(withDefaults.count, 10),
  };
};

/**
 * Internal function.
 *
 * Validates query parameters.
 *
 * Returns a BFFFxError if input validation fails.
 */
export const validate = (
  query: PreValidatedQueryParameters
): BFFFxErrorInstanceType | RecommendationsQueryParameters => {
  // errorDetails is empty if all fields are valid
  const errorDetails = [
    isValidCount(query.count),
    isValidLocale(query.locale),
    isValidRegion(query.region),
  ].filter((ed) => ed !== null);

  if (errorDetails.length > 0) {
    // return an error result including each failed validation
    const error = new BFFFxError('input validation failure', {
      status: 400,
      jsonResponse: {
        errors: errorDetails.map((ed) => ({
          id: '82868c64-41f1-4efe-b936-cef5261d0d87',
          status: '400',
          title: 'Bad Request',
          detail: ed.errorDetail,
          source: {
            parameters: ed.propertyName,
          },
        })),
      },
    });
    return error;
  }

  return query as RecommendationsQueryParameters;
};

/**
 * Rest query params and GraphQL variables are the same,
 * just return same data with new type.
 */
export const transform = (
  query: RecommendationsQueryParameters
): RecommendationsQueryVariables => {
  return {
    ...query,
  };
};

/**
 * Use this in the route handler.
 *
 * Parses query parameter strings as provided by express.req.query,
 * sets defaults, validates them, and transforms them into
 * RecommendationsQueryVariables for the GraphQL client.
 *
 * This returns a discriminated union that includes errors. Be sure
 * to check for them and return them to the client if present.
 * @param query
 */
export const handleQueryParameters = (
  query: RecommendationsQueryParameterStrings
): RecommendationsQueryVariables | BFFFxErrorInstanceType => {
  const coerced = setDefaultsAndCoerceTypes(query);
  const maybeValid = validate(coerced);

  if (maybeValid instanceof BFFFxError) {
    return maybeValid;
  }

  return transform(maybeValid);
};
