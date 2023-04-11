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
  /**
   * Any errors that reach this handler will also be forwarded to
   * a callback function if provided. This is intended to be used
   * for any server specific observability needs (logging)
   */
  errorCallback?: (err: Error, req: Request, res: Response) => void;
};

// default error, generic 500
const DEFAULT_ERROR = new RestResponseError('Internal Server Error', {});

// default callback, do nothing
const DEFAULT_ERROR_CALLBACK: ErrorHandlerOptions['errorCallback'] = (
  err,
  req,
  res
) => null;

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
 * errorCallback enables programmatic extension, primarily for logging
 * purposes, but could be used to modify the response as well. Ensure you
 * do not flush the response (`res.end()`) in this callback. as it is
 * executed before the error handling behavior. This does nothing if not
 * provided.
 *
 * @param defaultError - a default error to return
 * @param errorCallback - a callback function, called with the same middleware args
 */
export const ErrorHandler =
  ({
    defaultError = DEFAULT_ERROR,
    errorCallback = DEFAULT_ERROR_CALLBACK,
  }: ErrorHandlerOptions = {
    defaultError: DEFAULT_ERROR,
    errorCallback: DEFAULT_ERROR_CALLBACK,
  }) =>
    (
      err: any | Error | RestResponseError,
      req: Request,
      res: Response,
      next: NextFunction
    ): void => {
      // execute error callback
      errorCallback(err, req, res);

      // build client response
      const responseError = err instanceof RestResponseError ? err : defaultError;
      res.status(responseError.status);
      res.send(responseError.stringResponse);
      res.end();
    };
