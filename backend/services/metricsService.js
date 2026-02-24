const metricsState = {
  startedAt: new Date(),
  requestsTotal: 0,
  requestsByMethod: {},
  requestsByStatus: {},
  totalDurationMs: 0,
  maxDurationMs: 0
};

const observeRequest = ({ method, statusCode, durationMs }) => {
  metricsState.requestsTotal += 1;
  metricsState.requestsByMethod[method] = (metricsState.requestsByMethod[method] || 0) + 1;
  metricsState.requestsByStatus[statusCode] = (metricsState.requestsByStatus[statusCode] || 0) + 1;
  metricsState.totalDurationMs += durationMs;
  metricsState.maxDurationMs = Math.max(metricsState.maxDurationMs, durationMs);
};

const getMetricsSnapshot = () => {
  const averageDurationMs = metricsState.requestsTotal > 0
    ? Number((metricsState.totalDurationMs / metricsState.requestsTotal).toFixed(2))
    : 0;

  return {
    startedAt: metricsState.startedAt.toISOString(),
    uptimeSeconds: Math.floor((Date.now() - metricsState.startedAt.getTime()) / 1000),
    requests: {
      total: metricsState.requestsTotal,
      byMethod: metricsState.requestsByMethod,
      byStatus: metricsState.requestsByStatus
    },
    latencyMs: {
      average: averageDurationMs,
      max: Number(metricsState.maxDurationMs.toFixed(2))
    }
  };
};

export { observeRequest, getMetricsSnapshot };
