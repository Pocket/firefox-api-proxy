import Ajv, { DefinedError } from 'ajv';

import OpenApiSpec from '../../OpenAPISpec';
import Recommendations from '../../../graphql-proxy/recommendations/recommendations';
import { appendUtmSource, responseTransformer } from './response';

jest.mock('../../../graphql-proxy/recommendations/recommendations');

// initialize ajv for validation
const ajv = new Ajv();
const schema =
  OpenApiSpec['paths']['/desktop/v1/recommendations']['get']['responses'][
    '200'
  ]['content']['application/json']['schema'];
const validate = ajv.compile(schema);

describe('response', () => {
  it('ajv returns errors when bad objects', () => {
    const valid = validate({});
    expect(valid).toBeFalsy();
    // uncomment if you want info about how errors look
    // throw validate.errors
    expect((validate.errors as DefinedError[]).length).toBeGreaterThan(0);
  });

  describe('responseTransformer', () => {
    // all fields are non-nullable, not much to test other than happy path
    it('handles happy path results', async () => {
      // the default mock is happy path, ensure this is handled
      const graphResponse = await Recommendations({
        count: 30,
        locale: 'fr',
        region: 'FR',
      });

      const res = responseTransformer(graphResponse);
      const valid = validate(res);
      if (valid) {
        // any additional expectations can be defined here
        expect(res.data.length).toEqual(30);
        expect(
          res.data[0].url.endsWith(
            `utm_source=${graphResponse.newTabSlate.utmSource}`
          )
        ).toBeTruthy();
        // Even recommendations have timeToRead mocked to [1, 9].
        //expect(res.data[0].timeToRead).toBeGreaterThanOrEqual(1);
        //expect(res.data[0].timeToRead).toBeLessThanOrEqual(9);
        expect(res.data[0].timeToRead).toBeUndefined();
        // Odd recommendations have timeToRead mocked to undefined.
        expect(res.data[1].timeToRead).toBeUndefined();
      } else {
        throw validate.errors;
      }
    });
  });

  describe('appendUtmSource', () => {
    it('should add a utm_source query parameter when input URL does not have any query parameters', () => {
      const url = 'https://example.com';
      const expected = 'https://example.com/?utm_source=pocket-test-utm';
      expect(appendUtmSource(url, 'pocket-test-utm')).toBe(expected);
    });

    it('should add a utm_source query parameter when the input URL already has a query parameter', () => {
      const url = 'https://example.com?foo=bar';
      const expected =
        'https://example.com/?foo=bar&utm_source=pocket-test-utm';
      expect(appendUtmSource(url, 'pocket-test-utm')).toBe(expected);
    });

    it('should add utm_source query parameter when the input URL ends with a fragment', () => {
      const url = 'https://example.com#my-fragment';
      const expected =
        'https://example.com/?utm_source=pocket-test-utm#my-fragment';
      expect(appendUtmSource(url, 'pocket-test-utm')).toBe(expected);
    });

    it('should override utm_source query parameter if the url already contains utm_source', () => {
      const url = 'https://example.com/?utm_source=fgfeed';
      const expected = 'https://example.com/?utm_source=pocket-test-utm';
      expect(appendUtmSource(url, 'pocket-test-utm')).toBe(expected);
    });
  });
});
