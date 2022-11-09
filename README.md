# Firefox API Proxy

This service proxies Firefox browser API requests across multiple back end services.

## Application Overview

[Express](https://expressjs.com) is being used to receive requests.

[OpenAPI](https://swagger.io/specification/) is being used for documentation, request validation, response validation, and will be leveraged in the future for additional protections against breaking changes.

This initial implementation transforms requests against this proxy, into requests against the web V3 API, providing a subset of the original service's functionality.

In the future this will be extended to include reaching out to GraphQL and possibly other services.

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

// TODO: instructions for manual testing from openapi docs
// TODO: instructions for manual testing from locally built client
