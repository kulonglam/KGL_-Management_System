import express from 'express';
import { getHealth, getReadiness } from '../controllers/opsController.js';

// Configure router.
const router = express.Router();

router.get('/healthz', getHealth);
router.get('/readyz', getReadiness);

export default router;
