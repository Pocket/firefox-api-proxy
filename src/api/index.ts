import express from 'express';
const router = express.Router();

import config from '../config';
import Desktop from './desktop';
import V3 from './v3';
import CacheControlHandler from './lib/cacheControlHandler';
import WebSessionAuthHandler from '../auth/web-session/webSessionAuthHandler';

// register all /desktop routes
router.use(
  '/desktop',
  // include auth if available
  WebSessionAuthHandler,
  // set Cache-control headers on all routes
  // this can be overwritten on downstream routes with another handler
  CacheControlHandler('private, max-age=900', config),
  // register Desktop sub-router
  Desktop
);

// register all /desktop routes
router.use(
  '/v3',
  // include auth if available
  WebSessionAuthHandler,
  // set Cache-control headers on all routes
  // this can be overwritten on downstream routes with another handler
  CacheControlHandler('private, max-age=900', config),
  // register legacy v3 sub-router
  V3
);

export default router;
