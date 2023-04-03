import { faker } from '@faker-js/faker';
import assert from 'assert';
import {
  APIError,
  APIErrorResponse,
  BFFFxError,
  BFFFxErrorInstanceType,
} from '../../../bfffxError';
import { RecentSavesQueryVariables } from '../../../generated/graphql/types';
import { paths } from '../../../generated/openapi/types';
import {
  handleQueryParameters,
  setDefaultsAndCoerceTypes,
  validate,
  transform,
} from './inputs';

type RecentSavesQueryParameters =
  paths['/desktop/v1/recent-saves']['get']['parameters']['query'];

describe('query', () => {
  describe('setDefaultsAndCoerceTypes', () => {
    it('converts count to an integer', () => {
      const res = setDefaultsAndCoerceTypes({ count: '3' });
      expect(res).toMatchObject<RecentSavesQueryParameters>({
        count: 3,
      });
    });

    it('sets count to 10 if no default is provided', () => {
      const res = setDefaultsAndCoerceTypes({});
      expect(res).toMatchObject<RecentSavesQueryParameters>({
        count: 10,
      });
    });
  });

  describe('validate', () => {
    it('returns no error with valid count', () => {
      const errors = validate({
        count: faker.datatype.number({ min: 1, max: 20 }),
      });
      expect(errors).toBeNull();
    });

    it('returns error with 0 count', () => {
      const error: BFFFxErrorInstanceType = validate({ count: 0 });
      const errors = JSON.parse(error.stringResponse);
      expect(errors).toEqual(
        expect.objectContaining<APIErrorResponse>({
          errors: expect.arrayContaining<Array<APIError>>([
            expect.objectContaining<APIError>({
              id: '3f262c60-c34d-4ea8-8a14-1012d2ef7953',
              status: '400',
              title: 'Bad Request',
              source: {
                parameters: 'count',
              },
            }),
          ]),
        })
      );
    });

    it('returns errors with negative count', () => {
      const error: BFFFxErrorInstanceType = validate({ count: -1 });
      const errors = JSON.parse(error.stringResponse);
      expect(errors).toEqual(
        expect.objectContaining<APIErrorResponse>({
          errors: expect.arrayContaining<Array<APIError>>([
            expect.objectContaining<APIError>({
              id: '3f262c60-c34d-4ea8-8a14-1012d2ef7953',
              status: '400',
              title: 'Bad Request',
              source: {
                parameters: 'count',
              },
            }),
          ]),
        })
      );
    });

    it('returns error with count > 20', () => {
      const error: BFFFxErrorInstanceType = validate({ count: 51 });
      const errors = JSON.parse(error.stringResponse);
      expect(errors).toEqual(
        expect.objectContaining<APIErrorResponse>({
          errors: expect.arrayContaining<Array<APIError>>([
            expect.objectContaining<APIError>({
              id: '3f262c60-c34d-4ea8-8a14-1012d2ef7953',
              status: '400',
              title: 'Bad Request',
              source: {
                parameters: 'count',
              },
            }),
          ]),
        })
      );
    });
  });

  describe('transform', () => {
    it('maps count to pagination.first', () => {
      const input = {
        count: faker.datatype.number({ min: 1, max: 20 }),
      };
      const variables = transform(input);

      expect(variables).toMatchObject<RecentSavesQueryVariables>({
        pagination: { first: input.count },
      });
    });
  });

  describe('handleQueryParameters', () => {
    it('returns errors if invalid query parameters', () => {
      const input = {
        count: '-1',
      };

      const error = handleQueryParameters(input);
      assert(error instanceof BFFFxError);
      const errors = JSON.parse(error.stringResponse);
      expect(errors).toEqual(
        expect.objectContaining<APIErrorResponse>({
          errors: expect.arrayContaining<Array<APIError>>([
            expect.objectContaining<APIError>({
              status: '400',
              title: 'Bad Request',
            }),
          ]),
        })
      );
    });

    it('returns GraphQL query variables on success', () => {
      const input = {
        count: faker.datatype.number({ min: 1, max: 20 }).toString(),
      };

      const variables = handleQueryParameters(input);
      expect(variables).toMatchObject<RecentSavesQueryVariables>({
        pagination: { first: parseInt(input.count, 10) },
      });
    });
  });
});
