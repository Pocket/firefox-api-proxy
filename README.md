# Firefox API Proxy

This service proxies Firefox browser API requests across multiple back end services.

## Application Overview

[Express](https://expressjs.com) is being used to receive requests.

[OpenAPI](https://swagger.io/specification/) is being used for documentation, request validation, response validation, and will be leveraged in the future for additional protections against breaking changes.

This initial implementation transforms requests against this proxy, into requests against the 'pocket-graph' via the Web graphql proxy, providing a subset of the V3 Web API's functionality specifically for firefox clients (desktop, and probably mobile in the future).

## File structure

- the infrastructure code is present in `.aws`
- the application code is in `src`
- `.circleci` contains circleCI setup
- `openapi.yml` contains api documentation

## Develop Locally

### First time setup

Clone the repo:

```bash
git clone git@github.com:Pocket/firefox-api-proxy.git
cd firefox-api-proxy
```

### Running tests

```bash
npm run test
```

### Testing locally

Start the server with:

```bash
npm ci
npm run start:dev
```

You will need authentication appropriate for the web V3 API deployment environment that is backing requests.

### E2E local testing with curl

Local E2E testing requires production Session Auth (cookie) authentication.

A helper script for generating authentication curl args can be found at [./scripts/scrapeCookie.js](./scripts/scrapeCookie.js).

Curl sample:

```bash
`curl 'http://localhost:4028/desktop/v1/recent-saves?count=1' <AUTH HEADERS GO HERE>`
```

### Leading with documentation, generated types

It is strongly suggested to lead implementation of features with changes to:

- `./openapi.yml`
- `./src/graphql-proxy/**/*.graphql`

These files are used to generate the types files in `./src/generated/*` with the following npm script:

```bash
npm run codegen
```

Upon changing these files and generating types, the compiler and unit tests should guide you through required changes to remain compatible with older versions of the APIs.

## About errors in this service

This service needs to provide an API for **every** version of Firefox that
ever gets deployed against this service. When a client receives a 5XX
error response, follow these guidelines:

- 500 Error
  - This service itself can have bugs, or may not be equipped to handle every error that can result from utilizing dependencies. In these cases, this service needs to protect itself and will redact errors. If you see one of these errors, please open a bug against this service.
- 502 Error
  - This service is equipped to handle the currently known GraphQL errors associated with its queries. When these errors are encountered, this service will forward the GraphQL error to Firefox for informational purposes, **however do not handle GraphQL errors directly in Firefox**. The graph internals may change without notice, and the names in error messages may also change without notice in turn. In this case, do one of the following:
    1. If the error includes all of the details needed to handle it, implement a new error handler in this service that transforms the error into an appropriate 4XX error. Add it to `defaultHandlers` in [GraphQLErrorHandler](./src/api/error/graphQLErrorHandler.ts) if it is an error all routes must handle. Otherwise, add it to a route specific error handler if not.
    2. If the error is too vague to handle it in this service, open a bug against the appropriate GraphQL server component. `#support-backend` can help identify the appropriate component if needed.
