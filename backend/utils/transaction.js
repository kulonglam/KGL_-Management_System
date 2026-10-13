import mongoose from 'mongoose';
import { isProduction } from '../config/security.js';

const replicaSetReady = () => {
  if (mongoose.connection?.readyState !== 1) return false;
  const type = mongoose.connection.client?.topology?.description?.type;
  return type === 'ReplicaSetWithPrimary' || type === 'Sharded' || type === 'LoadBalanced';
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
      const error = new Error('MongoDB replica set is required before this change can be saved.');
      error.statusCode = 503;
      throw error;
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
      const failure = new Error('MongoDB replica set is required before this change can be saved.');
      failure.statusCode = 503;
      throw failure;
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
