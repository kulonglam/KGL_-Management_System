/**
 * Coordinates request handling: reads HTTP input, invokes domain services, and returns response payloads.
 * File: backend/controllers/opsController.js
 */

import mongoose from 'mongoose';

// GET /healthz: lightweight liveness endpoint showing service heartbeat metadata.
const getHealth = (req, res) => {
  res.json({
    status: 'ok',
    service: 'karibu-groceries-backend',
    timestamp: new Date().toISOString()
  });
};

// GET /readyz: readiness probe that returns 503 until MongoDB is connected.
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

export { getHealth, getReadiness };





