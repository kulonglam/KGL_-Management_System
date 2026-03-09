// Declares endpoint URLs and wires middleware/validators/controllers for this API surface.

import express from 'express';
import { getHealth, getReadiness } from '../controllers/opsController.js';

// Configure router.
const router = express.Router();

// GET /healthz: liveness probe for process health checks.
router.get('/healthz', getHealth);
// GET /readyz: readiness probe for dependency/startup checks.
router.get('/readyz', getReadiness);

export default router;
