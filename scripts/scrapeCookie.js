/**
 * How to use:
 * 1) Open up your developer console on getpocket.com, and find a request that includes a `Cookie` request header.
 * 2) Right click this cookie, `Copy Value`, surround it in single quotes, and use that as an arg to this script.
 * 3) `node scrapeCookie.js '<cookie content>'`
 *
 * This script outputs the cookie in a human readable format (pretty printed JSON), and as curl headers parameters.
 * Fill in your consumer_key in the curl output if you want to make requests with that.
 */

const cookie = process.argv[2];

const names = new Set(['a95b4b6', 'd4a79ec', '159e76e']);

const parsed = cookie
  .split(';')
  .map((c) => c.trim())
  // filter to only relevant auth cookies
  .filter((c) => names.has(c.split('=')[0]));

// human readable output
console.log(parsed);

// curl args output
const j = parsed.join('; ');
const curlArgs = `-H 'Cookie: ${j}' -H 'consumer_key: YOUR_CONSUMER_KEY_HERE'`;

console.log(curlArgs);
