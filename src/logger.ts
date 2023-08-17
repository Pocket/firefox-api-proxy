import { Request } from 'express';
import { ServerOptions } from './server';
import { serverLogger } from './server';

/**
 * Helper for making logs more clean using pocket-ts-logger library
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

export const logErrorCallback: ServerOptions['errorHandlerOptions']['errorCallback'] =
  (err, req, res) => {
    // all server log errors will be aggregated to CloudWatch
    serverLogger.error(`logErrorCallback`, {
      error: err.message,
      tags: Object.assign({}, buildLogTags(req)),
    });
  };
