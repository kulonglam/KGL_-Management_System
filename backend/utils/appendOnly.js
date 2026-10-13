import mongoose from 'mongoose';

const APPEND_ONLY_MESSAGE = 'Append-only records cannot be changed';

const rejectAppendOnlyChange = function rejectAppendOnlyChange() {
  throw new Error(APPEND_ONLY_MESSAGE);
};

const APPEND_ONLY_HOOKS = [
  'updateOne',
  'updateMany',
  'replaceOne',
  'deleteOne',
  'deleteMany',
  'findOneAndUpdate',
  'findOneAndDelete',
  'findOneAndReplace'
];

const NATIVE_MUTATIONS = [
  ...APPEND_ONLY_HOOKS,
  'bulkWrite'
];

let nativeWriteDepth = 0;
const guardedCollections = new WeakSet();
const guardedModels = new Set();

const allowAppendOnlyNativeWrite = async (fn) => {
  nativeWriteDepth += 1;
  try {
    return await fn();
  } finally {
    nativeWriteDepth -= 1;
  }
};

const applyCollectionGuard = (model) => {
  const collection = model?.collection;
  if (!collection || guardedCollections.has(collection)) return;

  for (const name of NATIVE_MUTATIONS) {
    const original = collection[name];
    if (typeof original !== 'function') continue;
    collection[name] = function guardedNativeWrite(...args) {
      if (nativeWriteDepth === 0) {
        return Promise.reject(new Error(APPEND_ONLY_MESSAGE));
      }
      return original.apply(collection, args);
    };
  }
  guardedCollections.add(collection);
};

const guardAppendOnlyCollection = (model) => {
  guardedModels.add(model);
  applyCollectionGuard(model);
};

mongoose.connection.on('connected', () => {
  for (const model of guardedModels) {
    applyCollectionGuard(model);
  }
});

const protectAppendOnly = (schema) => {
  for (const hook of APPEND_ONLY_HOOKS) {
    schema.pre(hook, rejectAppendOnlyChange);
  }

  schema.pre('save', function protectExisting(next) {
    if (!this.isNew) {
      next(new Error(APPEND_ONLY_MESSAGE));
      return;
    }
    next();
  });
};

export {
  APPEND_ONLY_MESSAGE,
  allowAppendOnlyNativeWrite,
  guardAppendOnlyCollection,
  protectAppendOnly
};
