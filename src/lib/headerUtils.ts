/**
 * This service forwards headers to and from the web repo
 * graph proxy. These utilities are common code, primarily
 * concerned with blocking the forwarding of some headers.
 */

/**
 * This is a central list for headers that either must be blocked
 * (hop-by-hop), and headers that are problematic to upstream
 * / downstream services.
 *
 * This may need to be separated into separate lists for request
 * forwarding and response forwarding, but starting with just one
 * list.
 */
const forwardHeaderBlockList = [
  // https://www.rfc-editor.org/rfc/rfc2616#section-13.5.1
  // hop-by-hop headers must not be forwarded in proxied requests
  'Connection',
  'Keep-Alive',
  'Proxy-Authenticate',
  'Proxy-Authorization',
  'TE',
  'Trailers',
  'Transfer-Encoding',
  'Upgrade',
  // additionally, there are some programmatic headers
  // we want to block.
  'Content-Length',
  'Content-Type',
  'Content-Encoding',
  'User-Agent',
  'Host',
  'Accept-Encoding',
  'Connection',
];

// to set for constant lookup
const forwardHeaderBlockSet = new Set(
  // all to lowercase to avoid case sensitivity issues
  forwardHeaderBlockList.map((h) => h.toLocaleLowerCase())
);

/**
 * Provided a header name, returns a boolean indicating
 * whether to forward the header on proxy requests or
 * responses.
 *
 * @param headerName
 */
export const doForwardHeader = (headerName: string): boolean =>
  !forwardHeaderBlockSet.has(headerName.toLowerCase());
