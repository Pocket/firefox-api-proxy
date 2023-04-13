import { NextFunction, Request, Response } from 'express';

import { WebSessionAuth } from './webSessionAuth';
import { BFFFxError } from '../../bfffxError';

/**
 * This is an authentication middleware for the WebSession auth type.
 *
 * All authentication for this auth type is handled by the web API graphql
 * proxy. This middleware just ensures that all auth parameters are present,
 * and builds an WebSessionAuth auth container to associate with the Express
 * Request.
 *
 * Returns a 401 status code response to the client with a JSON:API style
 * error if a request does not have all of the auth parameters.
 *
 * @param req
 * @param res
 * @param next
 * @returns void
 */
const WebSessionAuthHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const wsAuth = WebSessionAuth.fromRequest(req);

  // if wsAuth is null, build an error response
  if (!wsAuth) {
    const error = new BFFFxError(
      'request rejected, could not initialize auth',
      {
        status: 401,
        jsonResponse: {
          errors: [
            {
              // If you are finding this code via this ID, the request is
              // failing because it is not completely authenticated.
              id: 'cd7495a6-8223-4bb8-a0a9-408be68f7967',
              status: '401',
              title: 'Unauthorized',
            },
          ],
        },
      }
    );

    return next(error);
  }

  // attach auth an auth sentry tags to request
  req.auth = wsAuth as WebSessionAuth;
  Object.assign(req.user, wsAuth.userTags());
  return next();
};

export default WebSessionAuthHandler;
