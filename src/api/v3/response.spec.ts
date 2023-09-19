import Ajv, { DefinedError } from 'ajv';

import OpenApiSpec from '../OpenAPISpec';
import Recommendations from '../../graphql-proxy/recommendations/recommendations';
import { responseTransformer } from './response';

jest.mock('../../graphql-proxy/recommendations/recommendations');

// initialize ajv for validation
const ajv = new Ajv();
const schema =
  OpenApiSpec['paths']['/v3/firefox/global-recs']['get']['responses']['200'][
    'content'
  ]['application/json']['schema'];
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
        expect(res.recommendations.length).toEqual(30);
        expect(
          res.recommendations[0].url.endsWith(
            `utm_source=${graphResponse.newTabSlate.utmSource}`
          )
        ).toBeTruthy();
        // Even recommendations have timeToRead mocked to [1, 9].
        expect(res.recommendations[0].time_to_read).toBeGreaterThanOrEqual(1);
        expect(res.recommendations[0].time_to_read).toBeLessThanOrEqual(9);
        // Odd recommendations have timeToRead mocked to undefined.
        expect(res.recommendations[1].time_to_read).toBeUndefined();
      } else {
        throw validate.errors;
      }
    });
  });
});
