# Scripts

These files are scripts intended to be run during local development, or during CI/CD.

These are not transpiled into `dist`, and cannot be executed in production environments.

## generateOpenAPITypes.mts

To execute this script:

```bash
npm run codegen
```

This script generates `src/generated/openapi/types.ts`.  This requires a separate tsconfig that permits the usage of ESModules, which lives in `tsconfig.openapi-typescript.json`.

This script does not validate `openapi.yml`.  It is recommended to lint that file after changing its contents.
