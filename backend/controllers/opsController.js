// Coordinates request handling: reads HTTP input, invokes domain services, and returns response payloads.
 

import mongoose from 'mongoose';
import os from 'node:os';
import { isProduction } from '../config/security.js';

// GET /healthz: lightweight liveness endpoint showing service heartbeat metadata.
const getHealth = (req, res) => {
  res.json({
    status: 'ok',
    service: 'karibu-groceries-backend',
    timestamp: new Date().toISOString()
  });
};

// GET /readyz: readiness probe that returns 503 until MongoDB is connected.
const getReadiness = async (req, res) => {
  const readyState = mongoose.connection.readyState;
  const isReady = readyState === 1;

  if (!isReady) {
    return res.status(503).json({
      status: 'not_ready',
      databaseReadyState: readyState
    });
  }

  let topology = 'unknown';
  let replicaSet = '';
  try {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    topology = hello.setName ? 'replica_set' : 'standalone';
    replicaSet = hello.setName || '';
  } catch {
    topology = 'unknown';
  }

  if (isProduction() && topology === 'standalone') {
    return res.status(503).json({
      status: 'not_ready',
      databaseReadyState: readyState,
      topology,
      reason: 'A replica set is required before this API can take live writes.'
    });
  }

  return res.json({
    status: 'ready',
    databaseReadyState: readyState,
    topology,
    replicaSet,
    hostname: os.hostname(),
    pid: process.pid
  });
};

export { getHealth, getReadiness };
