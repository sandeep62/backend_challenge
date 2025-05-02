import express from 'express';
import { getAddressDetails } from '../controllers/address';
const router = express.Router();
router.get('/:address', getAddressDetails);
export default router;
