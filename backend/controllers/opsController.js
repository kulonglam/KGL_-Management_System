import mongoose from 'mongoose';
import { getMetricsSnapshot } from '../services/metricsService.js';

const getHealth = (req, res) => {
  res.json({
    status: 'ok',
    service: 'karibu-groceries-backend',
    timestamp: new Date().toISOString()
  });
};

const getReadiness = (req, res) => {
  const readyState = mongoose.connection.readyState;
  const isReady = readyState === 1;

  if (!isReady) {
    return res.status(503).json({
      status: 'not_ready',
      databaseReadyState: readyState
    });
  }

  return res.json({
    status: 'ready',
    databaseReadyState: readyState
  });
};

const getMetrics = (req, res) => {
  const token = process.env.METRICS_TOKEN;
  if (token && req.headers['x-metrics-token'] !== token) {
    return res.status(401).json({ message: 'Unauthorized metrics access' });
  }

  return res.json({
    status: 'ok',
    metrics: getMetricsSnapshot()
  });
};

export { getHealth, getReadiness, getMetrics };
