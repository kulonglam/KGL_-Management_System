// Client errors stay on the response. Unexpected failures go to the error handler.

const forwardControllerError = (error, res, next) => {
  const statusCode = Number(error?.statusCode || error?.status || 0);

  if ((error?.expose === true && statusCode >= 400 && statusCode <= 599) || (statusCode >= 400 && statusCode < 500)) {
    return res.status(statusCode).json({ message: error.message });
  }

  if (error?.name === 'ValidationError') {
    return res.status(400).json({ message: error.message });
  }

  if (error?.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier' });
  }

  if (error?.code === 11000) {
    return res.status(409).json({ message: 'A matching record already exists' });
  }

  if (typeof next === 'function') {
    return next(error);
  }

  return res.status(500).json({ message: 'Internal Server Error' });
};

export { forwardControllerError };
