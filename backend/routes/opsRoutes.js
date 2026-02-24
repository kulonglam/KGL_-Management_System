import express from 'express';
import { getHealth, getReadiness, getMetrics } from '../controllers/opsController.js';

const router = express.Router();

router.get('/healthz', getHealth);
router.get('/readyz', getReadiness);
router.get('/metrics', getMetrics);

export default router;
