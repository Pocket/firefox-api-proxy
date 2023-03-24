import express, { NextFunction, Request, Response } from 'express';
const router = express.Router();

import config from '../config';
import Desktop from './desktop';
import ConsumerKeyHandler from '../auth/consumerKeyHandler';

// register all /firefox routes
router
  // ConsumerKeyHandler ensures all requests contain a consumer
  // key, even anonymous requests, and populates req.consumer_key
  .use(ConsumerKeyHandler)
  // set Cache-control headers on all routes
  // move this further down the chain if we need control per-route.
  .use((req: Request, res: Response, next: NextFunction) => {
    if (config.app.environment !== 'development') {
      // 30 minutes client side cache
      res.set('Cache-control', 'private, max-age=1800');
    }
    next();
  })
  .use('/desktop', Desktop);

export default router;
