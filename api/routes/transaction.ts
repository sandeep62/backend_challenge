import express from 'express';
import { getLatestTx, getTxByHash } from '../controllers/transaction';
const router = express.Router();
router.get('/', getLatestTx);
router.get('/:hash', getTxByHash);
export default router;
