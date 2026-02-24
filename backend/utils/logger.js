const maskSensitiveValue = (key, value) => {
  if (value === undefined || value === null) return value;

  const sensitiveKeys = ['password', 'token', 'authorization', 'nationalId', 'contact', 'dealerContact'];
  if (sensitiveKeys.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey.toLowerCase()))) {
    return '[REDACTED]';
  }

  return value;
};

const sanitizeObject = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeObject(entry));
  }

  if (value && typeof value === 'object') {
    const sanitized = {};
    Object.entries(value).forEach(([key, entry]) => {
      if (entry && typeof entry === 'object') {
        sanitized[key] = sanitizeObject(entry);
      } else {
        sanitized[key] = maskSensitiveValue(key, entry);
      }
    });
    return sanitized;
  }

  return value;
};

const writeLog = (level, message, metadata = {}) => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...sanitizeObject(metadata)
  };
  const serialized = JSON.stringify(payload);

  if (level === 'error') {
    console.error(serialized);
    return;
  }
  console.log(serialized);
};

const logger = {
  info(message, metadata = {}) {
    writeLog('info', message, metadata);
  },
  warn(message, metadata = {}) {
    writeLog('warn', message, metadata);
  },
  error(message, metadata = {}) {
    writeLog('error', message, metadata);
  }
};

export default logger;
