import { Request } from 'express';

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
export const buildLogTags = (req: Request): Record<string, string> => {
  const authTags: Record<string, string> | undefined = req.auth?.sentryTags();
  const expressTags: Record<string, string> = {
    method: req.method,
    path: req.path,
    query: JSON.stringify(req.query),
  };

  return {
    ...authTags,
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
     * @param tags flat object, tags will be attached to log for search purposes
     */
    addTags: (tags: Record<string, string>) => {
      Object.assign(logTags, tags);
    },
    /**
     * originalError will be appended to the end of the log.
     * along with its stack trace if available.
     *
     * @param error error or error string
     */
    addOriginalError: (error: Error | string) => {
      // may be a graphql error string, or an error, attach error
      // components if available, otherwise just JSON.stringify to
      // try to capture whatever is available.
      const message = (error as Error)?.message ?? JSON.stringify(error);
      const name = (error as Error)?.name;
      const stack = (error as Error)?.stack;

      originalError = {
        message,
        name,
        stack,
      };
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
