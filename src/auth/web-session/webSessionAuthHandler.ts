import { NextFunction, Request, Response } from 'express';

import { WebSessionAuth } from './webSessionAuth';
import { components } from '../../generated/openapi/types';

type ErrorResponse = components['schemas']['ErrorResponse'];

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

  // if wsAuth is null, construct an unauthenticated ErrorResponse.
  if (!wsAuth) {
    res.status(401).json({
      errors: [
        {
          // If you are finding this code via this ID, the request is
          // failing because it is not completely authenticated.
          id: 'cd7495a6-8223-4bb8-a0a9-408be68f7967',
          status: '401',
          title: 'Unauthorized',
        },
      ],
    } as ErrorResponse);
    return;
  }

  req.auth = wsAuth as WebSessionAuth;
  next();
};

export default WebSessionAuthHandler;
