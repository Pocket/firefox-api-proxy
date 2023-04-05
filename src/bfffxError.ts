import { RestJsonResponseError } from './errors/restJsonResponseError';

import { components } from './generated/openapi/types';
import { Unpack } from './types';

/**
 * expose OpenAPI error types for re-use without repeated extraction
 */
export type APIErrorResponse = components['schemas']['ErrorResponse'];
export type APIError = Unpack<APIErrorResponse['errors']>;

/**
 * BFFFxError is an Error that includes all of the information
 * server.ts requires to build a response for clients.
 *
 * This service uses structured errors, and this constructor
 * provides type safety for building those structured error
 * responses.
 */
export const BFFFxError = RestJsonResponseError<APIErrorResponse>;

/**
 * expose instance of BFFFxError type for use in function signatures.
 */
type BFFFxErrorType = typeof BFFFxError;
export type BFFFxErrorInstanceType = InstanceType<BFFFxErrorType>;
