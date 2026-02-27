// Handle is unified shape.
const isUnifiedShape = (payload) =>
  payload &&
  typeof payload === 'object' &&
  Object.prototype.hasOwnProperty.call(payload, 'success') &&
  Object.prototype.hasOwnProperty.call(payload, 'data') &&
  Object.prototype.hasOwnProperty.call(payload, 'error');

// Handle normalize error.
const normalizeError = (payload, statusCode) => {
  if (payload && typeof payload === 'object') {
    if (payload.error && typeof payload.error === 'object') {
      return payload.error;
    }
    if (payload.message) {
      return { message: payload.message, details: payload.details ?? null, statusCode };
    }
    return { message: 'Request failed', details: payload, statusCode };
  }

  if (typeof payload === 'string') {
    return { message: payload, details: null, statusCode };
  }

  return { message: 'Request failed', details: null, statusCode };
};

// Handle response formatter.
const responseFormatter = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (payload) => {
    if (isUnifiedShape(payload)) {
      return originalJson(payload);
    }

    const statusCode = res.statusCode || 200;
    if (statusCode >= 400) {
      return originalJson({
        success: false,
        data: null,
        error: normalizeError(payload, statusCode)
      });
    }

    return originalJson({
      success: true,
      data: payload,
      error: null
    });
  };

  next();
};

export { responseFormatter };
