import { GraphQLError } from 'graphql';
import { ClientError } from 'graphql-request';
import { GraphQLRequestContext } from 'graphql-request/dist/types';
import {
  APIErrorResponse,
  BFFFxError,
  BFFFxErrorInstanceType,
} from '../../bfffxError';

import {
  ClientErrorHandler,
  GraphQLErrorHandler,
  unauthenticatedErrorHandler,
  unhandledErrorHandler,
} from './graphQLErrorHandler';

const graphQLErrorCodes = {
  unauthenticated: 'UNAUTHENTICATED',
  internalServerError: 'INTERNAL_SERVER_ERROR',
  // not real errors, just for testing route specific extensibility here
  extension1: 'EXTENSION_1',
  extension2: 'EXTENSION_2',
};

// sample route specific extensions
const extension1Handler1: ClientErrorHandler = (error) => {
  if (
    error.response?.errors?.[0]?.extensions?.code ===
    graphQLErrorCodes.extension1
  ) {
    return new BFFFxError('extension1Handler1 error', {
      // just for testing, mock data doesn't matter
      jsonResponse: { errors: [] },
    });
  }
  return null;
};
// duplicate for testing order
const extension1Handler2: ClientErrorHandler = (error) => {
  if (
    error.response?.errors?.[0]?.extensions?.code ===
    graphQLErrorCodes.extension1
  ) {
    return new BFFFxError('extension1Handler2 error', {
      // just for testing, mock data doesn't matter
      jsonResponse: { errors: [] },
    });
  }
  return null;
};
const extension2Handler1: ClientErrorHandler = (error) => {
  if (
    error.response?.errors?.[0]?.extensions?.code ===
    graphQLErrorCodes.extension2
  ) {
    return new BFFFxError('extension2Handler1 error', {
      // just for testing, mock data doesn't matter
      jsonResponse: { errors: [] },
    });
  }
  return null;
};

// mock errors, only concerned with fields used in test impl
// for use with extension handlers above
const extension1Error = new ClientError(
  {
    status: 500,
    errors: [
      {
        message: 'some graph error',
        extensions: {
          code: graphQLErrorCodes.extension1,
        },
        // other error fields aren't important
      } as Partial<GraphQLError> as GraphQLError,
    ],
  },
  // handler doesn't care about request
  {} as Partial<GraphQLRequestContext> as GraphQLRequestContext
);
const extension2Error = new ClientError(
  {
    status: 500,
    errors: [
      {
        message: 'some graph error',
        extensions: {
          code: graphQLErrorCodes.extension2,
        },
        // other error fields aren't important
      } as Partial<GraphQLError> as GraphQLError,
    ],
  },
  // handler doesn't care about request
  {} as Partial<GraphQLRequestContext> as GraphQLRequestContext
);

// sample auth error for use in multiple tests
// hypothetical error where is is not nested in the future
const flatAuthError = new ClientError(
  {
    errors: [
      {
        message: 'You must be logged in to use this service',
        extensions: {
          code: 'UNAUTHENTICATED',
        },
        // does not conform to type validation, but this is a direct server
        // response, just coerce
      } as Partial<GraphQLError> as GraphQLError,
    ],
    data: {
      user: {
        savedItems: null,
      },
    },
    status: 200,
    headers: {},
  },
  {} as Partial<GraphQLRequestContext> as GraphQLRequestContext
);

// sample 500 error that should never be handled outside unhandledErrorHandler
const unhandledError = new ClientError(
  {
    status: 500,
    errors: [
      {
        message: 'something went very wrong!',
        extensions: {
          code: graphQLErrorCodes.internalServerError,
        },
        // other error fields aren't important
      } as Partial<GraphQLError> as GraphQLError,
    ],
  },
  // handler doesn't care about request
  {
    variables: {
      someVar: 'variables are included in human readable response!',
    },
  } as Partial<GraphQLRequestContext> as GraphQLRequestContext
);

describe('GraphQLErrorHandler', () => {
  describe('extensionHandlers', () => {
    it('each returns unique BFFFx error on match', () => {
      // match all to errors they are expected to handle
      const res1 = extension1Handler1(extension1Error);
      expect(res1.message).toEqual('extension1Handler1 error');

      const res2 = extension1Handler2(extension1Error);
      expect(res2.message).toEqual('extension1Handler2 error');

      const res3 = extension2Handler1(extension2Error);
      expect(res3.message).toEqual('extension2Handler1 error');
    });

    it('each returns null on no match', () => {
      // match all to errors they are expected to return null
      const res1 = extension1Handler1(unhandledError);
      expect(res1).toBeNull();

      const res2 = extension1Handler2(unhandledError);
      expect(res2).toBeNull();

      const res3 = extension2Handler1(unhandledError);
      expect(res3).toBeNull();
    });
  });
  describe('unauthenticatedErrorHandler', () => {
    const nestedAuthError = new ClientError(
      {
        errors: [
          {
            message: '500: Internal Server Error',
            extensions: {
              response: {
                url: 'https://list-api.readitlater.com/',
                status: 500,
                statusText: 'Internal Server Error',
                body: {
                  errors: [
                    {
                      message: 'You must be logged in to use this service',
                      extensions: {
                        code: 'UNAUTHENTICATED',
                      },
                    },
                  ],
                },
              },
              code: 'INTERNAL_SERVER_ERROR',
            },
            // does not conform to type validation, but this is a direct server
            // response, just coerce
          } as Partial<GraphQLError> as GraphQLError,
        ],
        data: {
          user: {
            savedItems: null,
          },
        },
        status: 200,
        headers: {},
      },
      {} as Partial<GraphQLRequestContext> as GraphQLRequestContext
    );

    it('handles nested authentication error', () => {
      const res = unauthenticatedErrorHandler(nestedAuthError);
      expect(res.message).toEqual('encountered UNAUTHENTICATED error upstream');
      expect(res.status).toEqual(401);

      const apiRes = JSON.parse(res.stringResponse) as APIErrorResponse;
      const error = apiRes.errors[0];
      expect(error.status).toEqual('401');
      expect(error.title).toEqual('Unauthorized');
      // source graph error is passed through as string
      expect(
        error.source.graphQLError.indexOf('"code":"UNAUTHENTICATED"') >= 0
      ).toBeTruthy();
    });

    it('handles flat authentication error', () => {
      const res = unauthenticatedErrorHandler(flatAuthError);
      expect(res.message).toEqual('encountered UNAUTHENTICATED error upstream');
      expect(res.status).toEqual(401);

      const apiRes = JSON.parse(res.stringResponse) as APIErrorResponse;
      const error = apiRes.errors[0];
      expect(error.status).toEqual('401');
      expect(error.title).toEqual('Unauthorized');
      // source graph error is passed through as string
      expect(
        error.source.graphQLError.indexOf('"code":"UNAUTHENTICATED"') >= 0
      ).toBeTruthy();
    });

    it('returns null on no match', () => {
      const res = unauthenticatedErrorHandler(unhandledError);
      expect(res).toBeNull();
    });
  });

  describe('unhandledErrorHandler', () => {
    it('handles any error, returning 502 response with original error passed through', () => {
      const res = unhandledErrorHandler(unhandledError);
      expect(res.message).toEqual('Encountered unknown error upstream');
      expect(res.status).toEqual(502);

      const apiRes = JSON.parse(res.stringResponse) as APIErrorResponse;
      const error = apiRes.errors[0];
      expect(error.status).toEqual('502');
      expect(error.title).toEqual('Bad Gateway');
      // source graph error is passed through as string
      // error is included
      expect(
        error.source.graphQLError.indexOf('"code":"INTERNAL_SERVER_ERROR"') >= 0
      ).toBeTruthy();
      expect(
        error.source.graphQLError.indexOf('something went very wrong!') >= 0
      ).toBeTruthy();
      // variables are included
      expect(
        error.source.graphQLError.indexOf(
          'variables are included in human readable response!'
        ) >= 0
      ).toBeTruthy();
    });
  });

  describe('GraphQLErrorHandler', () => {
    it('returns non ClientErrors directly', () => {
      // upstream error handling will report these, redact them,
      // and return as 500 errors. Things like network errors or
      // unexpected library errors only.
      const exceptionalError = new Error('maybe a network error');
      const res1 = GraphQLErrorHandler(exceptionalError);
      expect(exceptionalError).toEqual(res1);
    });

    it('executes route specific handlers in provided order', () => {
      // 1 before 2
      const res1 = GraphQLErrorHandler(extension1Error, [
        extension1Handler1,
        extension1Handler2,
        extension2Handler1,
      ]);
      expect(res1.message).toEqual('extension1Handler1 error');

      // 2 before 1
      const res2 = GraphQLErrorHandler(extension1Error, [
        extension1Handler2,
        extension1Handler1,
        extension2Handler1,
      ]);
      expect(res2.message).toEqual('extension1Handler2 error');

      // test extension2 for good measure, back to 1 before 2
      const res3 = GraphQLErrorHandler(extension2Error, [
        extension1Handler1,
        extension1Handler2,
        extension2Handler1,
      ]);
      expect(res3.message).toEqual('extension2Handler1 error');
    });

    it('always handles auth errors', () => {
      const res = GraphQLErrorHandler(flatAuthError);
      expect(res.message).toEqual('encountered UNAUTHENTICATED error upstream');
    });

    it('always returns 502 for otherwise unhandled errors', () => {
      const res = GraphQLErrorHandler(unhandledError);
      expect((res as BFFFxErrorInstanceType).status).toEqual(502);
      expect(res.message).toEqual('Encountered unknown error upstream');
    });
  });
});
