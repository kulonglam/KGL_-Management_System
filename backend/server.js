import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/database.js';
import { validateEnv } from './config/env.js';
import createApp from './app.js';
import logger from './utils/logger.js';

dotenv.config();
validateEnv();

// Configure port.
const PORT = Number(process.env.PORT || 5000);

// Handle start server.
const startServer = async () => {
  await connectDB();

  const app = createApp();
  const server = app.listen(PORT, () => {
    logger.info('server.started', { port: PORT, env: process.env.NODE_ENV || 'development' });
  });

  server.requestTimeout = Number(process.env.SERVER_REQUEST_TIMEOUT_MS || 30000);
  server.headersTimeout = Number(process.env.SERVER_HEADERS_TIMEOUT_MS || 35000);

  // Handle shutdown.
  const shutdown = async (signal) => {
    logger.warn('server.shutdown.requested', { signal });

    server.close(async () => {
      try {
        await mongoose.disconnect();
        logger.info('server.shutdown.complete', { signal });
        process.exit(0);
      } catch (error) {
        logger.error('server.shutdown.failed', { signal, message: error.message });
        process.exit(1);
      }
    });

    setTimeout(
      () => {
        logger.error('server.shutdown.forced', { signal });
        process.exit(1);
      },
      Number(process.env.SERVER_SHUTDOWN_TIMEOUT_MS || 10000)
    ).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (error) => {
    logger.error('process.unhandledRejection', { message: error?.message || String(error) });
  });

  process.on('uncaughtException', (error) => {
    logger.error('process.uncaughtException', { message: error?.message || String(error) });
    shutdown('uncaughtException');
  });
};

startServer();
