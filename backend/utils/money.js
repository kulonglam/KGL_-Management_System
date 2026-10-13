// UGX has no minor units. Persist and return whole shillings.

const roundUgx = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount);
};

const assertWholeUgx = (value, label = 'Amount') => {
  const amount = Number(value);
  if (!Number.isInteger(amount)) {
    return `${label} must be a whole number of UGX`;
  }
  return null;
};

export { assertWholeUgx, roundUgx };
