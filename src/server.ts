import express, { NextFunction, Request, Response } from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import xrayExpress from 'aws-xray-sdk-express';
import * as Sentry from '@sentry/node';

import { RestResponseError, SENTRY_BEHAVIOR } from './errors/restResponseError';
import {
  NotFoundHandler,
  NotFoundHandlerOptions,
} from './errors/handlers/notFoundHandler';
import {
  ErrorHandler,
  ErrorHandlerOptions,
} from './errors/handlers/errorHandler';

/**
 * This may be a good candidate for a shared library.
 *
 * All consumers would have to write their APIs as plugins for express
 * as they are in this repo, but parts of this are useful if we want to
 * avoid boilerplate.
 */

/**
 * extend express.Request with sentryTags.
 */
declare module 'express' {
  export interface Request {
    /**
     * sentryTags is a container for tags to associate with a sentry
     * event. This type is added by `server.ts`, and all tags included
     * in this flat object will be automatically be attached to sentry
     * events when created.
     *
     * Make this more explicit as we discover what tags we like! Specify
     * specific names of tags, and describe the data you expect them to provide.
     * For now, just restrict this to a flat object.
     *
     * `Object.assign(req.sentryTags, object2)` where object2 is an Object
     * with multiple tags is encouraged to be used when adding multiple
     * tags.
     */
    sentryTags: Record<string, string>;
  }
}

/**
 * list of mount point / express.Router pairs
 */
type ExpressRouters = {
  /**
   * The route to mount the corresponding express.Router.
   */
  route: string;
  /**
   * An express.Router serving all routes and middleware you
   * wish to serve at the corresponding route.
   */
  router: express.Router;
}[];

type ServerOptions = {
  notFoundHandlerOptions?: NotFoundHandlerOptions;
  errorHandlerOptions?: ErrorHandlerOptions;
  sentryRequestHandlerOptions?: Sentry.Handlers.RequestHandlerOptions;
  /**
   * I wish sentry exported this type, we'll have to keep it manually
   * glued and write unit tests -_-
   *
   * Error handler options, shouldHandleError can be used to control
   * whether errors will be reported to sentry or not.
   */
  sentryErrorHandlerOptions?: {
    /**
     * create a function that returns a boolean. This boolean indicates
     * whether the error will be reported to sentry or not.
     */
    shouldHandleError?(this: void, error: Error | RestResponseError): boolean;
  };
};

const DEFAULT_SERVER_OPTIONS: ServerOptions = {
  sentryRequestHandlerOptions: {
    // keys to extract from req, add sentryTags and avoid cookies
    // that sentry probably doesn't know how to reliably redact
    request: ['headers', 'method', 'query_string', 'url', 'data', 'sentryTags'],
  },
  sentryErrorHandlerOptions: {
    shouldHandleError: (error) => {
      if (error instanceof RestResponseError) {
        // if the error is a 5XX error and not suppressed, report it
        if (
          error.status >= 500 &&
          error.sentryBehavior !== SENTRY_BEHAVIOR.SUPPRESS
        ) {
          return true;
        }
        // if the error is marked FORCE behavior, report it
        if (error.sentryBehavior === SENTRY_BEHAVIOR.FORCE) {
          return true;
        }

        return false;
      }
      // any other error that is not RestResponseError gets reported.
      return true;
    },
  },
};

/**
 * Mounts the provided routers at the specified routes. Routers are mounted in the
 * order provided.
 *
 * Provides a set of error handling and observability tools. By default this implements:
 * - cookie parsing
 * - JSON payload parsing
 * - health checks at /.well-known/server-health
 * - aws xray support via xrayExpress (you should configure this in your project main!)
 * - A configurable 404 error, returns a non-default error for routes that don't exist.
 *   This is an API server, and the default behavior in express returns an HTML document.
 * - Sentry error reporting, attach custom tags to req.sentryTags
 * - A configurable default error handler, redacts all node Errors, and
 *
 * Servers returned by this are not started. GraphQL servers require
 * access to httpServer for lifecycle management. The raw express server is returned as
 * well. Either option is fine to use, just don't use both.
 *
 * starting with app:
 *   app.listen({ port: config.app.port }, () =>
 *     console.log(
 *       `🚀 Firefox API Proxy ready at http://localhost:${config.app.port}`
 *     )
 *   );
 *
 * starting with httpServer:
 *   (async () => {
 *     await new Promise<void>((resolve) =>
 *       httpServer.listen({ port: config.app.port }, resolve)
 *     );
 *   })();
 *
 * @param serviceName serviceName to attach to xray segments
 */
export const buildServer = (
  serviceName: string,
  routers: ExpressRouters,
  {
    notFoundHandlerOptions,
    errorHandlerOptions,
    sentryRequestHandlerOptions = DEFAULT_SERVER_OPTIONS.sentryRequestHandlerOptions,
    sentryErrorHandlerOptions = DEFAULT_SERVER_OPTIONS.sentryErrorHandlerOptions,
  }: ServerOptions = DEFAULT_SERVER_OPTIONS
) => {
  const app = express();
  const httpServer = http.createServer(app);

  //If there is no host header (really there always should be..) then use parser-wrapper as the name
  app.use(xrayExpress.openSegment(serviceName));

  // sentry middleware must be declared early
  app.use(
    Sentry.Handlers.requestHandler(
      sentryRequestHandlerOptions
    ) as express.RequestHandler
  );

  // populate sentryTags with baseline tags
  app.use((req: Request, res: Response, next: NextFunction): void => {
    // just empty for now, but room to grab anything from express here
    // move this to an external library if it needs customization.
    req.sentryTags = {};
    next();
  });

  app.use(cookieParser());
  app.use(express.json());

  app.get('/.well-known/server-health', (req, res) => {
    res.status(200).send('ok');
  });

  // register API routes
  routers.forEach((r) => {
    app.use(r.route, r.router);
  });

  // return a 404 error for routes that do not exist
  app.use(NotFoundHandler(notFoundHandlerOptions) as express.RequestHandler);

  // The error handler must be before any other error middleware and after all controllers
  app.use(
    Sentry.Handlers.errorHandler(
      sentryErrorHandlerOptions
    ) as express.ErrorRequestHandler
  );

  // default error handler, redacts unhandled errors
  app.use(ErrorHandler(errorHandlerOptions) as express.ErrorRequestHandler);

  //Make sure the express app has the xray close segment handler
  app.use(xrayExpress.closeSegment());

  return { app, httpServer };
};
