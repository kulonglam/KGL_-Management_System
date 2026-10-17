import express from 'express';
import {
  getPlatformStatus,
  listWebhooksHandler,
  createWebhookHandler,
  updateWebhookHandler,
  deleteWebhookHandler,
  listWebhookDeliveriesHandler,
  redeliverWebhookHandler,
  enqueueJobHandler,
  previewWeeklyReportHandler,
  runWeeklyReportHandler,
  testWebhookEmitHandler,
  listApiKeysHandler,
  createApiKeyHandler,
  revokeApiKeyHandler
} from '../controllers/platformController.js';
import { protect, authorize } from '../middleware/auth.js';
import { listLiveInstances } from '../services/instancePresenceService.js';
import { forwardControllerError } from '../utils/httpError.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validation.js';
import {
  mongoIdParamValidation,
  webhookCreateValidation,
  webhookUpdateValidation,
  webhookDeliveryListValidation,
  webhookTestEmitValidation,
  platformJobEnqueueValidation,
  apiKeyCreateValidation
} from '../validators/requestValidators.js';

const router = express.Router();

router.get('/status', protect, authorize('director', 'manager'), getPlatformStatus);
router.get('/instances', protect, authorize('director'), async (req, res, next) => {
  try {
    const instances = await listLiveInstances();
    res.json({
      instances,
      count: instances.length,
      note: 'Each API process reports itself. Run a second process against this database to add capacity. Scheduled jobs are claimed once.'
    });
  } catch (error) {
    return forwardControllerError(error, res, next);
  }
});

router.get('/webhooks', protect, authorize('director'), listWebhooksHandler);
router.post(
  '/webhooks',
  protect,
  authorize('director'),
  writeLimiter,
  webhookCreateValidation,
  validateRequest,
  createWebhookHandler
);
router.post(
  '/webhooks/test-emit',
  protect,
  authorize('director'),
  writeLimiter,
  webhookTestEmitValidation,
  validateRequest,
  testWebhookEmitHandler
);
router.put(
  '/webhooks/:id',
  protect,
  authorize('director'),
  writeLimiter,
  webhookUpdateValidation,
  validateRequest,
  updateWebhookHandler
);
router.delete(
  '/webhooks/:id',
  protect,
  authorize('director'),
  writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  deleteWebhookHandler
);
router.get(
  '/webhook-deliveries',
  protect,
  authorize('director'),
  webhookDeliveryListValidation,
  validateRequest,
  listWebhookDeliveriesHandler
);
router.post(
  '/webhook-deliveries/:id/redeliver',
  protect,
  authorize('director'),
  writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  redeliverWebhookHandler
);

router.post(
  '/jobs/enqueue',
  protect,
  authorize('director'),
  writeLimiter,
  platformJobEnqueueValidation,
  validateRequest,
  enqueueJobHandler
);
router.get('/api-keys', protect, authorize('director'), listApiKeysHandler);
router.post(
  '/api-keys',
  protect,
  authorize('director'),
  writeLimiter,
  apiKeyCreateValidation,
  validateRequest,
  createApiKeyHandler
);
router.post(
  '/api-keys/:id/revoke',
  protect,
  authorize('director'),
  writeLimiter,
  mongoIdParamValidation,
  validateRequest,
  revokeApiKeyHandler
);

router.get('/reports/weekly/preview', protect, authorize('director'), previewWeeklyReportHandler);
router.post('/reports/weekly/run', protect, authorize('director'), writeLimiter, runWeeklyReportHandler);

export default router;
