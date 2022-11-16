import express from 'express';
const router = express.Router();

import config from '../config';

import Desktop from './desktop';

// register all /firefox routes
router
  // set Cache-control headers on all routes
  // move this further down the chain if we need control per-route.
  .use((req, res, next) => {
    if (config.app.environment !== 'development') {
      // 30 minutes client side cache
      res.set('Cache-control', 'private, max-age=1800');
    }
    next();
  })
  .use('/desktop', Desktop);

export default router;
