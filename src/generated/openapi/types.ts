// THIS FILE IS GENERATED, DO NOT EDIT!
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable prettier/prettier */
/* tslint:disable */
/* eslint:disable */

/** Type helpers */
type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
type OneOf<T extends any[]> = T extends [infer Only] ? Only : T extends [infer A, infer B, ...infer Rest] ? OneOf<[XOR<A, B>, ...Rest]> : never;

export interface paths {
  "/desktop/v1/recent-saves": {
    /** Gets a list of the most recent saves for a specific user */
    get: operations["getRecentSaves"];
  };
}

export interface components {
  schemas: {
    Error: {
      /** @description A unique identifier for this particular instance of the error */
      id?: string;
      /** @description HTTP status code string associated with the response */
      status?: string;
      /** @description A short human readable summary of the error */
      title?: string;
      /** @description An object containing references to the source of the error */
      source?: {
        /** @description String indicating which URI query parameter caused the error */
        parameters?: string;
      };
    };
    ErrorResponse: {
      /** @description An array of error objects */
      errors: (components["schemas"]["Error"])[];
    };
    Save: {
      /**
       * @description Constant identifier for Saves, allowing them to be differentiated when multiple types are returned together. 
       * @enum {string}
       */
      __typename: "Save";
      /** @description The Saved Item ID. */
      id: string;
      /** @description Resolved URL for a saved item. This includes following any redirects and any parser normalization. */
      resolvedUrl?: string | null;
      /** @description The URL the user saved to their list. */
      givenUrl: string;
      /** @description The title of the saved item as resolved by the parser. */
      title?: string | null;
      /** @description An excerpt from the saved item as resolved by the parser. */
      excerpt?: string | null;
      /** @description The Domain of the saved item */
      domain?: string | null;
      /** @description Numeric string, word count of the item. May be 0 if parsing fails */
      wordCount?: number | null;
      /** @description Approximate minutes to read the item, based on word_count */
      timeToRead?: number | null;
      /** @description Primary image from the saved item as resolved by the parser. */
      topImageUrl?: string | null;
    };
    PendingSave: {
      /**
       * @description Constant identifier for PendingSave, allowing them to be differentiated when multiple types are returned together. 
       * @enum {string}
       */
      __typename: "PendingSave";
      /** @description The Saved Item ID. */
      id: string;
      /** @description The URL the user saved to their list. */
      givenUrl: string;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}

export type external = Record<string, never>;

export interface operations {

  getRecentSaves: {
    /** Gets a list of the most recent saves for a specific user */
    parameters?: {
        /** @description The number of items to return. */
      query?: {
        count?: number;
      };
    };
    responses: {
      /** @description OK */
      200: {
        content: {
          "application/json": {
            data: (components["schemas"]["Save"] | components["schemas"]["PendingSave"])[];
          };
        };
      };
      /** @description Invalid request parameters */
      400: {
        content: {
          "application/json": components["schemas"]["ErrorResponse"];
        };
      };
      /** @description Authorization is missing or invalid. */
      401: {
        content: {
          "application/json": components["schemas"]["ErrorResponse"];
        };
      };
      /** @description This proxy service encountered an unexpected error. */
      500: never;
      /** @description Services downstream from this proxy encountered an unexpected error. Invalid (expired) auth returns a 500 error in downstream services, so unfortunately this is also currently a 502 response as it cannot be differentiated. */
      502: never;
      /** @description Requests to downstream services timed out. */
      504: never;
    };
  };
}
