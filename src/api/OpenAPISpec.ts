/**
 * Portions of the openapi spec are utilized within controllers
 * and tests.
 *
 * Load this YAML file as a JSON document for re-use throughout
 * this code-base.
 *
 * Properties in the document are currently accessed via string
 * constants. Compilation will actually fail first, as type names will
 * also no longer exist if things are renamed in the openapi specification.
 *
 * Imports of this module will need to be audited if existing routes
 * must be removed or renamed.
 */
import RefParser from '@apidevtools/json-schema-ref-parser';
import _dereference from '@apidevtools/json-schema-ref-parser/lib/dereference';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Dereferences a jsonschema synchronously.
 *
 * RefParser doesn't offer a synchronous method by default. This is a little
 * hacky, but it works and is endorsed by the author:
 * https://github.com/APIDevTools/json-schema-ref-parser/issues/14#issuecomment-845806169
 * @param schema
 */
const dereference = (schema) => {
  const parser = new RefParser();
  parser.parse(schema);
  parser.schema = schema;
  _dereference(parser, { dereference: { excludedPathMatcher: () => false } }); // NOTE: mutates schema
  return schema;
};

const schema: Record<string, any> = dereference(
  yaml.load(
    fs.readFileSync(path.join(__dirname, '..', '..', 'openapi.yml'), 'utf-8')
  )
);

export default schema;
