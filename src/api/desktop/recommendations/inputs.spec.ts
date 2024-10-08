import { faker } from '@faker-js/faker';
import assert from 'assert';

import { NewTabRecommendationsQueryVariables } from '../../../generated/graphql/types';
import {
  handleQueryParameters,
  setDefaultsAndCoerceTypes,
  validate,
  RecommendationsQueryParameterStrings,
} from './inputs';

import { APIError, APIErrorResponse, BFFFxError } from '../../../bfffxError';

const randomLocale = () =>
  faker.helpers.arrayElement([
    'fr',
    'fr-FR',
    'es',
    'es-ES',
    'it',
    'it-IT',
    'en',
    'en-CA',
    'de',
    'de-CH',
  ]);

const randomRegion = () =>
  faker.helpers.arrayElement(['FR', 'ES', 'IT', 'DE', 'US', 'CA', 'IN']);

describe('input.ts recommendations query parameters', () => {
  describe('setDefaultsAndCoerceTypes', () => {
    it('converts count to an integer and passes through others', () => {
      const res = setDefaultsAndCoerceTypes({
        count: '3',
        locale: 'preValidatedLocale',
        region: 'preValidatedRegion',
      });
      expect(res).toMatchObject({
        count: 3,
        locale: 'preValidatedLocale',
        region: 'preValidatedRegion',
      });
    });

    it('sets count to 30 if no default is provided, values without defaults are undefined', () => {
      const res = setDefaultsAndCoerceTypes({});
      // validation should return an error in this case, validating defaults though
      expect(res).toMatchObject({
        count: 30,
      });
    });
  });

  describe('validate', () => {
    it('returns validated parameters when provided valid parameters', () => {
      const params = {
        count: faker.datatype.number({ min: 1, max: 30 }),
        locale: randomLocale(),
        region: randomRegion(),
      };
      const res = validate(params);
      expect(res instanceof BFFFxError).toBeFalsy();

      expect(res).toEqual(
        expect.objectContaining({
          ...params,
        })
      );
    });

    it('locale is case insensitive', () => {
      const params = {
        count: faker.datatype.number({ min: 1, max: 30 }),
        locale: faker.helpers.arrayElement([
          randomLocale().toLowerCase(),
          randomLocale().toUpperCase(),
        ]),
        region: randomRegion(),
      };
      const res = validate(params);
      expect(res instanceof BFFFxError).toBeFalsy();

      expect(res).toEqual(
        expect.objectContaining({
          ...params,
        })
      );
    });

    it('sets region to null if no default is provided', () => {
      const res = setDefaultsAndCoerceTypes({});
      // validation should return an error in this case, validating defaults though
      expect(res.region).toStrictEqual(null);
    });

    it('region is case insensitive', () => {
      const params = {
        count: faker.datatype.number({ min: 1, max: 30 }),
        locale: randomLocale(),
        region: faker.helpers.arrayElement([
          randomRegion().toLowerCase(),
          randomRegion().toUpperCase(),
        ]),
      };
      const res = validate(params);
      expect(res instanceof BFFFxError).toBeFalsy();

      expect(res).toEqual(
        expect.objectContaining({
          ...params,
        })
      );
    });

    it('returns array of errors detailing invalid parameters if invalid', () => {
      const res = validate({
        count: 31,
        locale: 'outer-space',
        region: 'andromeda',
      });
      assert(res instanceof BFFFxError);
      const errors = JSON.parse(res.stringResponse);
      expect(errors).toEqual(
        expect.objectContaining<APIErrorResponse>({
          // array contains multiple errors, check for each
          errors: expect.arrayContaining<Array<APIError>>([
            expect.objectContaining<APIError>({
              status: '404',
              title: 'Bad Request',
              detail: 'The count query parameter must be >0 and <=30',
              source: {
                parameters: 'count',
              },
            }),
            expect.objectContaining<APIError>({
              status: '404',
              title: 'Bad Request',
              detail:
                'Locale must be provided. Valid locales include: [' +
                '"fr","fr-FR","es","es-ES","it","it-IT","en","en-CA",' +
                '"en-GB","en-US","de","de-DE","de-AT","de-CH"]',
              source: {
                parameters: 'locale',
              },
            }),
          ]),
        })
      );
    });

    it('locale is required', () => {
      const res = validate({
        count: 30,
        // region and locale are missing
      });
      assert(res instanceof BFFFxError);
      const errors = JSON.parse(res.stringResponse);
      expect(errors).toEqual(
        expect.objectContaining<APIErrorResponse>({
          // array contains multiple errors, check for each
          errors: expect.arrayContaining<Array<APIError>>([
            expect.objectContaining<APIError>({
              status: '404',
              title: 'Bad Request',
              detail:
                'Locale must be provided. Valid locales include: [' +
                '"fr","fr-FR","es","es-ES","it","it-IT","en","en-CA",' +
                '"en-GB","en-US","de","de-DE","de-AT","de-CH"]',
              source: {
                parameters: 'locale',
              },
            }),
          ]),
        })
      );
    });
  });

  it('sets enableRankingByRegion to false if no default is provided', () => {
    const res = setDefaultsAndCoerceTypes({});
    // validation should return an error in this case, validating defaults though
    expect(res.enableRankingByRegion).toStrictEqual(false);
  });

  describe('handleQueryParameters', () => {
    it('returns errors if invalid query parameters', () => {
      const params: RecommendationsQueryParameterStrings = {
        count: '-1',
      };

      const error = handleQueryParameters(params);
      assert(error instanceof BFFFxError);
      const errors = JSON.parse(error.stringResponse);
      expect(errors).toEqual(
        expect.objectContaining<APIErrorResponse>({
          errors: expect.arrayContaining<Array<APIError>>([
            expect.objectContaining<APIError>({
              status: '404',
              title: 'Bad Request',
            }),
          ]),
        })
      );
    });

    it('returns enableRankingByRegion as true when set to 1', () => {
      const params: RecommendationsQueryParameterStrings = {
        count: faker.datatype.number({ min: 1, max: 30 }).toString(),
        locale: 'fr',
        region: 'FR',
        enableRankingByRegion: '1',
      };

      const variables = handleQueryParameters(params);
      expect(variables).toStrictEqual(
        expect.objectContaining<NewTabRecommendationsQueryVariables>({
          count: parseInt(params.count, 10),
          locale: params.locale,
          region: params.region,
          enableRankingByRegion: true,
        })
      );
    });

    it('returns enableRankingByRegion as false when set to 0', () => {
      const params: RecommendationsQueryParameterStrings = {
        count: faker.datatype.number({ min: 1, max: 30 }).toString(),
        locale: 'fr',
        region: 'FR',
        enableRankingByRegion: '0',
      };

      const variables = handleQueryParameters(params);
      expect(variables).toStrictEqual(
        expect.objectContaining<NewTabRecommendationsQueryVariables>({
          count: parseInt(params.count, 10),
          locale: params.locale,
          region: params.region,
          enableRankingByRegion: false,
        })
      );
    });

    it('returns GraphQL query variables on success', () => {
      const params: RecommendationsQueryParameterStrings = {
        count: faker.datatype.number({ min: 1, max: 30 }).toString(),
        locale: 'fr',
        region: 'FR',
      };

      const variables = handleQueryParameters(params);
      expect(variables).toStrictEqual(
        expect.objectContaining<NewTabRecommendationsQueryVariables>({
          count: parseInt(params.count, 10),
          locale: params.locale,
          region: params.region,
          enableRankingByRegion: false,
        })
      );
    });
  });
});
