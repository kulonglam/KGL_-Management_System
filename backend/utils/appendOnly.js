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

export { APPEND_ONLY_MESSAGE, protectAppendOnly };
