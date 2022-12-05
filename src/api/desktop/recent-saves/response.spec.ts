import Ajv, { DefinedError } from 'ajv';
import { faker } from '@faker-js/faker';

import OpenApiSpec from '../../OpenAPISpec';
import RecentSaves from '../../../graphql-proxy/recent-saves/recent-saves';
import { responseTransformer } from './response';
import {
  RecentSavesQuery,
  SavedItemStatus,
} from '../../../generated/graphql/types';

jest.mock('../../../graphql-proxy/recent-saves/recent-saves');

// initialize ajv for validation
const ajv = new Ajv();
const schema =
  OpenApiSpec['paths']['/desktop/v1/recent-saves']['get']['responses']['200'][
    'content'
  ]['application/json']['schema'];
const validate = ajv.compile(schema);

describe('response', () => {
  // quick test to show ajv behavior, may not be familiar
  it('ajv returns errors when bad objects', () => {
    const valid = validate({});
    expect(!valid).toBeTruthy();
    // uncomment if you want info about how errors look
    // throw validate.errors
    expect((validate.errors as DefinedError[]).length).toBeGreaterThan(0);
  });

  describe('responseTransformer', () => {
    it('handles happy path results', async () => {
      // the default mock is happy path, ensure this is handled.
      const graphResponse = await RecentSaves(
        { consumer_key: 'junk', cookie: 'junk' }, // junk auth for mock
        { pagination: { first: 20 } } // all default params are fine
      );
      const res = responseTransformer(graphResponse);
      const valid = validate(res);
      if (valid) {
        // any additional expectations can be defined here
        expect(res.data.length).toEqual(20);
      } else {
        throw validate.errors;
      }
    });

    it('handles pending items', () => {
      const graphResponse: RecentSavesQuery = {
        user: {
          savedItems: {
            edges: [
              {
                cursor: faker.datatype.uuid(), // close enough, opaque id string
                node: {
                  __typename: 'SavedItem',
                  id: faker.datatype.number().toString(),
                  status: 'UNREAD' as SavedItemStatus,
                  url: faker.internet.url(),
                  item: {
                    __typename: 'PendingItem',
                  },
                },
              },
            ],
          },
        },
      };
      const res = responseTransformer(graphResponse);
      const valid = validate(res);
      if (valid) {
        // any additional expectations can be defined here
        expect(res.data.length).toEqual(1);
      } else {
        throw validate.errors;
      }
    });

    it('handles parser failures', () => {
      const graphResponse: RecentSavesQuery = {
        user: {
          savedItems: {
            edges: [
              {
                // all non-required fields null or undefined
                cursor: faker.datatype.uuid(), // close enough, opaque id string
                node: {
                  __typename: 'SavedItem',
                  id: faker.datatype.number().toString(),
                  url: faker.internet.url(),
                  item: {
                    __typename: 'Item',
                    givenUrl: faker.internet.url(),
                  },
                },
              },
            ],
          },
        },
      };
      const res = responseTransformer(graphResponse);
      const valid = validate(res);
      if (valid) {
        // any additional expectations can be defined here
        expect(res.data.length).toEqual(1);
      } else {
        throw validate.errors;
      }
    });

    it('removes unknown types from the response', () => {
      // this really shouldn't happen, but defining the expected behavior
      const graphResponse: RecentSavesQuery = {
        user: {
          savedItems: {
            edges: [
              {
                cursor: faker.datatype.uuid(), // close enough, opaque id string
                node: {
                  __typename: 'SavedItem',
                  id: faker.datatype.number().toString(),
                  url: faker.internet.url(),
                  item: {
                    __typename: '***UNKNOWN ITEM TYPE***',
                    givenUrl: faker.internet.url(),
                  } as any,
                },
              },
            ],
          },
        },
      };
      const res = responseTransformer(graphResponse);
      const valid = validate(res);
      if (valid) {
        // any additional expectations can be defined here
        expect(res.data.length).toEqual(0);
      } else {
        throw validate.errors;
      }
    });
  });
});
