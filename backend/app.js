import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import { apiLimiter } from './middleware/rateLimiter.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import { responseFormatter } from './middleware/responseFormatter.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import {
  sanitizeRequestPayload,
  rejectParameterPollution,
  enforceHttpsInProduction
} from './middleware/securityGuards.js';
import { requestContext, accessLogger } from './middleware/observability.js';
import swaggerSpec from './docs/swagger.js';

import authRoutes from './routes/authRoutes.js';
import procurementRoutes from './routes/procurementRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import creditSalesRoutes from './routes/creditSalesRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import trustedBuyerRoutes from './routes/trustedBuyerRoutes.js';
import priceRoutes from './routes/priceRoutes.js';
import stockNotificationRoutes from './routes/stockNotificationRoutes.js';
import opsRoutes from './routes/opsRoutes.js';

// Parse allowed origins.
const parseAllowedOrigins = () => {
  const fallbackOrigins = ['http://localhost:5173'];
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw) return fallbackOrigins;

  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : fallbackOrigins;
};

// Create app.
const createApp = () => {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  const allowedOrigins = parseAllowedOrigins();
  const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || '2mb';
  const enableSwagger =
    process.env.ENABLE_SWAGGER === 'true' ||
    (process.env.NODE_ENV !== 'production' && process.env.ENABLE_SWAGGER !== 'false');

  app.use(enforceHttpsInProduction);

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true
    })
  );

  app.use(express.json({ limit: requestBodyLimit }));
  app.use(express.urlencoded({ extended: false, limit: requestBodyLimit, parameterLimit: 100 }));
  app.use(sanitizeRequestPayload);
  app.use(rejectParameterPollution);
  app.use(requestContext);
  app.use(securityHeaders);
  app.use(apiLimiter);
  app.use(accessLogger);
  app.use(responseFormatter);

  // Swagger
  if (enableSwagger) {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }
  app.use('/', opsRoutes);

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/procurement', procurementRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/credit-sales', creditSalesRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/trusted-buyers', trustedBuyerRoutes);
  app.use('/api/prices', priceRoutes);
  app.use('/api/notifications', stockNotificationRoutes);

  app.get('/', (req, res) => {
    res.json({ message: 'Karibu Groceries LTD API' });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;
