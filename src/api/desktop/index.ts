import express from 'express';
const router = express.Router();

import RecentSaves from './recent-saves';
import Recommendations from './recommendations';

// register all /firefox routes
router.use('/', RecentSaves);
router.use('/', Recommendations);

export default router;
