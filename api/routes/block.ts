import express from 'express';
import { getBlock, getLatestBlock } from '../controllers/block';
const router = express.Router();
router.get('/', getLatestBlock);
router.get('/:number', getBlock);
export default router;
