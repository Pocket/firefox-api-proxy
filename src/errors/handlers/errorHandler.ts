import { NextFunction, Request, Response } from 'express';
import { RestResponseError } from '../restResponseError';

/**
 * Options type for ErrorHandler init.
 */
export type ErrorHandlerOptions = {
  /**
   * Specify an error to return in cases where errors need to be
   * redacted because they are not handled.
   */
  defaultError?: RestResponseError;
};

// default error, generic 500
const DEFAULT_ERROR = new RestResponseError('Internal Server Error', {});

// eslint / prettier config cannot cope with functions that return
// functions like this. Thrashes between 2 states.
// prettier-ignore

/**
 * ErrorHandler is a configurable express middleware.
 *
 * ErrorHandler(...args) returns another function that fulfills
 * express.ErrorRequestHandler.
 *
 * defaultError allows you to specify a specific error response
 * for any case where a vanilla node Error is provided to the handler.
 *
 * The current default express behavior is to return a 404 response
 * if a non-error type is passed to this handler via next(). I do
 * not know if that behavior will be consistent for sure.
 *
 * If no defaultError is specified, the default RestResponseError
 * will be returned, which is a generic 500 response.
 *
 * @param defaultError - a default error to return
 */
export const ErrorHandler =
  ({ defaultError = DEFAULT_ERROR }: ErrorHandlerOptions = { defaultError: DEFAULT_ERROR }) =>
    (
      err: any | Error | RestResponseError,
      req: Request,
      res: Response,
      next: NextFunction
    ): void => {
      const responseError = err instanceof RestResponseError ? err : defaultError;
      res.status(responseError.status);
      res.send(responseError.stringResponse);
      res.end();
      return;
    };
