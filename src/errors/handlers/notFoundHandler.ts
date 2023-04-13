import { NextFunction, Request, Response } from 'express';
import { RestResponseError, SENTRY_BEHAVIOR } from '../restResponseError';

// suppress 404 errors, not worth digging into
const DEFAULT_ERROR = new RestResponseError('Not Found', {
  status: 404,
  stringResponse: 'Not Found',
  sentryBehavior: SENTRY_BEHAVIOR.SUPPRESS,
});

/**
 * Options type for NotFoundHandler init.
 */
export type NotFoundHandlerOptions = {
  /**
   * Specify an error to return in cases where users try to access
   * a route that doesn't exist.
   */
  defaultError: RestResponseError;
};

// eslint / prettier config cannot cope with functions that return
// functions like this. Thrashes between 2 states.
// prettier-ignore

/**
 * NotFoundHandler is a configurable express middleware.
 *
 * NotFoundHandler(...args) returns another function that fulfills
 * express.ErrorRequestHandler.
 *
 * defaultError allows you to specify a different error response for
 * cases where routes do not exist.
 *
 * If no defaultError is specified, the default RestResponseError
 * is a generic 404 response.
 *
 * This is meant to be used in conjunction with ErrorHandler.
 *
 * @param defaultError - the default error to return
 */
export const NotFoundHandler =
  ({ defaultError = DEFAULT_ERROR }: NotFoundHandlerOptions = { defaultError: DEFAULT_ERROR }) =>
    (
      req: Request,
      res: Response,
      next: NextFunction
    ): void => {
      // we only arrive here if the route doesn't exist,
      // just next the configured error
      return next(defaultError);
    };
