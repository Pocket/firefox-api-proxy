/**
 * Input validators and transformers live here.
 *
 * Inputs for this route are currently only query parameters.
 */

import Ajv from 'ajv';

import OpenApiSpec from '../../OpenAPISpec';
import { components, paths } from '../../../generated/openapi/types';
import { ToStringParams } from '../../../types';
import { RecentSavesQueryVariables } from '../../../generated/graphql/types';

// unpack exact OpenAPI generated types for API parameters
type RecentSavesQueryParameters =
  paths['/desktop/v1/recent-saves']['get']['parameters']['query'];

type RecentSavesQueryParameterStrings =
  ToStringParams<RecentSavesQueryParameters>;

type APIErrorResponse = components['schemas']['ErrorResponse'];

// initialize ajv for validation
const ajv = new Ajv();
const parametersArray =
  OpenApiSpec['paths']['/desktop/v1/recent-saves']['get']['parameters'];

enum PARAMETER_TYPES {
  QUERY = 'query',
}

/**
 * query, path, header, and cookie parameters are all co-located isolate
 * just query parameters into a JSON schema that matches the express query
 * parameter object.
 *
 * Build this programmatically so that added properties are valid after
 * being documented.
 */
const buildParameterSchema = (type: PARAMETER_TYPES) => {
  return (
    parametersArray
      // filter to only a specific type of parameters
      .filter((p) => p.in === 'query')
      // reduce all query parameters into a JSONSchema object
      .reduce(
        (schema, qp) => {
          schema.properties[qp.name] = qp.schema;
          if (qp.required) {
            schema.required.push(qp.name);
          }
          return schema;
        },
        {
          type: 'object',
          required: [],
          properties: {},
        }
      )
  );
};

const queryParametersSchema = buildParameterSchema(PARAMETER_TYPES.QUERY);

const validateQP = ajv.compile(queryParametersSchema);

/**
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
 * Validates query parameters against the OpenAPI provided JSONSchema.
 */
export const validate = (
  query: RecentSavesQueryParameters
): APIErrorResponse | null => {
  const valid = validateQP(query);

  if (!valid) {
    // TODO: this should be a transformation from a validateQP error
    // only one error is possible here, just build it manually
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

export const transform = (
  query: RecentSavesQueryParameters
): RecentSavesQueryVariables => {
  return {
    pagination: {
      first: query.count,
    },
  };
};

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
