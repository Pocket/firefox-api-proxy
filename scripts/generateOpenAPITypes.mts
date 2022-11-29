import * as fs from 'fs';
import openapiTS, { OpenAPITSOptions } from 'openapi-typescript';
import { URL } from 'node:url';

const OPTIONS: OpenAPITSOptions = {
  // generated types do not conform to ts/lint rules, disable them for these files
  commentHeader: `// THIS FILE IS GENERATED, DO NOT EDIT!
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable prettier/prettier */
/* tslint:disable */
/* eslint:disable */
`,
};

const main = async () => {
  const localPath = new URL('../openapi.yml', import.meta.url);
  const output = await openapiTS(localPath, OPTIONS);
  fs.writeFileSync('./src/generated/openapi/types.ts', output);
};

(async () => {
  await main();
})();
