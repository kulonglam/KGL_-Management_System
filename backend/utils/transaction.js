import mongoose from 'mongoose';
import { isProduction } from '../config/security.js';

const topologyType = () => {
  if (mongoose.connection?.readyState !== 1) return 'disconnected';
  return mongoose.connection.client?.topology?.description?.type || 'Unknown';
};

const replicaSetReady = () => {
  const type = topologyType();
  return type === 'ReplicaSetWithPrimary' || type === 'Sharded' || type === 'LoadBalanced';
};

const replicaSetRequiredError = () => {
  const type = topologyType();
  const error = new Error(
    `MongoDB replica set is required before this change can be saved. The API is connected to "${type}", so branch and price updates cannot be stored atomically. Use a replica set (ReplicaSetWithPrimary, Sharded, or LoadBalanced) and restart the API.`
  );
  error.statusCode = 503;
  error.expose = true;
  return error;
};

const transactionsUnsupported = (error) => {
  const message = String(error?.message || '');
  return (
    error?.code === 20 ||
    error?.codeName === 'IllegalOperation' ||
    message.includes('Transaction numbers are only allowed') ||
    message.includes('replica set member')
  );
};

// Run multi-document work atomically when the server is a replica set.
// Standalone MongoDB (local dev and some test binaries) runs the same work once, without a session.
const runInTransaction = async (work) => {
  if (!replicaSetReady()) {
    if (isProduction()) {
      throw replicaSetRequiredError();
    }
    return work(null);
  }

  let session;
  try {
    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (error) {
    if (!transactionsUnsupported(error)) {
      throw error;
    }
    if (isProduction()) {
      throw replicaSetRequiredError();
    }
  } finally {
    if (session) {
      await session.endSession();
    }
  }

  return work(null);
};

const withSession = (session) => (session ? { session } : undefined);

export { runInTransaction, withSession };
