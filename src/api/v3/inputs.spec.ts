import { faker } from '@faker-js/faker';
import assert from 'assert';

import { NewTabRecommendationsQueryVariables } from '../../generated/graphql/types';
import {
  GlobalRecsQueryParameterStrings,
  handleQueryParameters,
  setDefaultsAndCoerceTypes,
} from './inputs';

import { APIError, APIErrorResponse, BFFFxError } from '../../bfffxError';

describe('input.ts recommendations query parameters', () => {
  describe('setDefaultsAndCoerceTypes', () => {
    it('converts count to an integer and passes through others', () => {
      const res = setDefaultsAndCoerceTypes({
        count: '3',
        locale_lang: 'preValidatedLocale',
        region: 'preValidatedRegion',
      });
      expect(res).toMatchObject({
        count: 3,
        locale: 'preValidatedLocale',
        region: 'preValidatedRegion',
      });
    });

    it('sets count to 20 if no default is provided, values without defaults are undefined', () => {
      const res = setDefaultsAndCoerceTypes({});
      // validation should return an error in this case, validating defaults though
      expect(res).toMatchObject({
        count: 20,
      });
    });
  });

  describe('handleQueryParameters', () => {
    it('returns errors if invalid query parameters', () => {
      const params: GlobalRecsQueryParameterStrings = {
        count: '-1',
      };

      const error = handleQueryParameters(params);
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
      const params: GlobalRecsQueryParameterStrings = {
        count: faker.datatype.number({ min: 1, max: 30 }).toString(),
        locale_lang: 'fr',
        region: 'FR',
      };

      const variables = handleQueryParameters(params);
      expect(variables).toStrictEqual(
        expect.objectContaining<NewTabRecommendationsQueryVariables>({
          count: parseInt(params.count, 10),
          locale: params.locale_lang,
          region: params.region,
        })
      );
    });
  });
});
