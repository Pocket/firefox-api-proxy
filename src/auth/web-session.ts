import { NextFunction, Request, Response } from 'express';

/**
 * This is an authentication middleware for the WebSession auth type.
 *
 * All authentication for this auth type is handled by the web API graphql
 * proxy. This middleware just ensures that all auth parameters are present.
 */

// internal utility types
type ExpectedCookies = {
  sess_guid?: string;
  a95b4b6?: string;
  d4a79ec?: string;
  '159e76e'?: string;
  [key: string]: string;
};
type ExpectedHeaders = {
  consumer_key?: string;
  cookie?: string;
};

// Add auth parameters to the express Request interface
type WebSessionAuth = {
  cookie: string;
  consumer_key: string;
};
declare module 'express' {
  export interface Request {
    auth?: WebSessionAuth;
  }
}

/**
 * Returns a 401 status code response to the client with a JSON:API style
 * error if a request does not have all of the auth parameters.
 *
 * Otherwise, populates a WebSessionAuth containing all of the parameters
 * necessary to authenticate with the web graphql proxy to the express
 * Request object.
 *
 * @param req
 * @param res
 * @param next
 * @returns void
 */
const WebSessionAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const cookies: ExpectedCookies = req.cookies;
  const headers: ExpectedHeaders = req.headers;
  // ensure expected headers and cookies are present and non-empty
  if (
    !headers.consumer_key ||
    !cookies.sess_guid ||
    !cookies.a95b4b6 ||
    !cookies.d4a79ec ||
    !cookies['159e76e'] ||
    !headers.cookie
  ) {
    // if not, return 401 response
    res.status(401).json({
      errors: [
        {
          id: 'cd7495a6-8223-4bb8-a0a9-408be68f7967',
          status: '401',
          title: 'Unauthorized',
        },
      ],
    });
    return;
  }

  // otherwise, package and pass through auth parameters
  const wsAuth: WebSessionAuth = {
    cookie: headers.cookie,
    consumer_key: headers.consumer_key,
  };
  req.auth = wsAuth;
  next();
};

export default WebSessionAuth;
