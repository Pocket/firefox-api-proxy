import express from 'express';
const router = express.Router();

import config from '../config';
import Desktop from './desktop';
import CacheControlHandler from './lib/cacheControlHandler';

// register all /desktop routes
router.use(
  '/desktop',
  // set Cache-control headers on all routes
  // this can be overwritten on downstream routes with another handler
  CacheControlHandler('private, max-age=1800', config),
  // register Desktop sub-router
  Desktop
);

export default router;
