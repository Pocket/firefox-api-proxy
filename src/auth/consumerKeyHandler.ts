import { NextFunction, Request, Response } from 'express';

import { components } from '../generated/openapi/types';

type ErrorResponse = components['schemas']['ErrorResponse'];

/**
 * client_key is populated to the request separately from auth to support
 * this parameter on requests that are not authenticated.
 */

// internal utility types
type ExpectedHeaders = {
  consumer_key?: string;
};

const ConsumerKeyHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestHeaders: ExpectedHeaders = req.headers as ExpectedHeaders;

  if (!requestHeaders.consumer_key) {
    res.status(401).json({
      errors: [
        {
          // If you are finding this code via this ID, the request is
          // failing because it does not include a consumer_key
          id: '810b0a84-d01f-49f0-8f56-962ff390c1f3',
          status: '401',
          title: 'Unauthorized',
        },
      ],
    } as ErrorResponse);
    return;
  }

  req.consumer_key = requestHeaders.consumer_key;
  next();
};

export default ConsumerKeyHandler;
