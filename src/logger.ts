import { Request } from 'express';
import { ServerOptions } from './server';
import { BFFFxError } from './bfffxError';

/**
 * This is a placeholder. It sounds like people have been looking into
 * logging libraries, and this service should migrate to whatever solution
 * comes from that. This service needs a little bit more right now to tide
 * it over though.
 */

/**
 * log helper, extracts tags from express request.
 * @param req express request
 */
export const buildLogTags = (req: Request) => {
  const authTags: Record<string, string> | undefined = req.auth?.userTags();
  const expressTags: Record<string, string> = {
    method: req.method,
    path: req.path,
    query: JSON.stringify(req.query),
  };

  return {
    user: {
      ...authTags,
    },
    ...expressTags,
  };
};

/**
 * Going with a builder pattern here to hopefully keep adding tags readable.
 */
export const Logger = (message) => {
  const logTags: Record<string, string> = {};
  let originalError: { message: string; name?: string; stack?: string };

  /**
   * build a JSON object format log
   */
  const buildLog = () => {
    const log = {
      logTags,
      message,
      originalError,
    };
    return JSON.stringify(log);
  };

  return {
    /**
     * Adds a set of tags to the log. Repeated tag names will overwrite existing
     * tags if provided multiple times.
     *
     * @param tags
     */
    addTags: (tags: Record<string, any>) => {
      Object.assign(logTags, tags);
    },
    /**
     * originalError will be appended to the end of the log.
     * along with its stack trace if available.
     *
     * @param error error or error string
     */
    addOriginalError: (error: Error) => {
      if (error instanceof BFFFxError) {
        // just log the string response, all details are marked up there
        // stack has no meaningful context as error is not produced in this
        // service
        const message = error.stringResponse;
        const name = error.name;

        originalError = {
          message,
          name,
        };
      } else {
        // otherwise capture message, name, and stack opportunistically
        const message = error?.message;
        const name = error?.name;
        const stack = error?.stack;

        originalError = {
          message,
          name,
          stack,
        };
      }
    },

    /** emit log at error level */
    error: () => {
      console.error(buildLog());
    },
    /** emit log at log level */
    log: () => {
      console.log(buildLog());
    },
    /** emit log at warn level */
    warn: () => {
      console.warn(buildLog());
    },
    /** emit log at debug level */
    debug: () => {
      console.debug(buildLog());
    },
  };
};

export const logErrorCallback: ServerOptions['errorHandlerOptions']['errorCallback'] =
  (err, req, res) => {
    // log all errors to cloudwatch
    // we may need to get more selective with this, but casting
    // a wide net for now.
    const log = Logger(err.message);
    log.addTags(buildLogTags(req));
    log.addOriginalError(err);
    log.error();
  };
