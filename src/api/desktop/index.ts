import express from 'express';
const router = express.Router();

import RecentSaves from './recent-saves';

// register all /firefox routes
router.use('/', RecentSaves);

export default router;
