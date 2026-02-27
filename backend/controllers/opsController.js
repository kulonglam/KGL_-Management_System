import mongoose from 'mongoose';

// Retrieve health.
const getHealth = (req, res) => {
  res.json({
    status: 'ok',
    service: 'karibu-groceries-backend',
    timestamp: new Date().toISOString()
  });
};

// Retrieve readiness.
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
