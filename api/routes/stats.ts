import express from 'express';
import { getStats, getStatsInRange } from '../controllers/stats';

const router = express.Router();
router.get('/', getStats);
router.get('/:range', getStatsInRange);
export default router;
