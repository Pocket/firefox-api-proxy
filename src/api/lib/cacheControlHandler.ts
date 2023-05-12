import { NextFunction, Request, Response } from 'express';

import ConfigFile from '../../config';

/**
 * Sets the value of the 'Cache-Control' response header for all downstream
 * express handlers.
 *
 * This handler may be applied multiple times. The handler closest to the
 * route implementation takes precedence. See tests for examples.
 *
 * This handler skips setting the Cache-header if config.app.environment
 * is 'development'.
 *
 * @param cachePolicy string value to set CacheControl response header
 */
const CacheControlHandler = (
  cachePolicy: string,
  config: typeof ConfigFile
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (config.app.environment !== 'development') {
      res.set('Cache-control', cachePolicy);
    }
    return next();
  };
};

export default CacheControlHandler;
