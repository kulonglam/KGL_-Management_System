/**
 * Centralizes HTTP client configuration, auth token injection, response normalization,
 * retry behavior, and typed endpoint groups used across the frontend.
 * File: frontend/src/services/api.js
 */

import axios from 'axios';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';

const sanitizeApiUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const withoutPrefix = raw.startsWith('VITE_API_URL=') ? raw.slice('VITE_API_URL='.length) : raw;
  return withoutPrefix.replace(/^['"]|['"]$/g, '').trim();
};

const API_URL = sanitizeApiUrl(import.meta.env.VITE_API_URL) || '/api/v1';
const RETRY_DELAY_MS = 250;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let refreshPromise = null;

const isAuthRefreshUrl = (url = '') =>
  String(url).includes('/auth/refresh') ||
  String(url).includes('/auth/login') ||
  String(url).includes('/auth/password-reset');

api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore(pinia);
    const token = authStore.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const normalizeErrorPayload = (error) => {
  const payload = error.response?.data;
  if (
    payload &&
    typeof payload === 'object' &&
    Object.prototype.hasOwnProperty.call(payload, 'success') &&
    Object.prototype.hasOwnProperty.call(payload, 'data') &&
    Object.prototype.hasOwnProperty.call(payload, 'error')
  ) {
    const detailMessages = Array.isArray(payload.error?.details)
      ? payload.error.details.map((detail) => detail?.message).filter(Boolean)
      : [];
    error.response.data = {
      ...payload,
      message: detailMessages[0] || payload.error?.message || 'Request failed'
    };
  }
};

api.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (
      payload &&
      typeof payload === 'object' &&
      Object.prototype.hasOwnProperty.call(payload, 'success') &&
      Object.prototype.hasOwnProperty.call(payload, 'data') &&
      Object.prototype.hasOwnProperty.call(payload, 'error')
    ) {
      response.data = payload.data;
    }
    return response;
  },
  async (error) => {
    const config = error.config || {};
    const method = String(config.method || '').toLowerCase();
    const statusCode = error.response?.status;
    const isRetriableGet = method === 'get' && (!statusCode || statusCode >= 500);

    if (isRetriableGet && !config.__retryAttempted) {
      config.__retryAttempted = true;
      await delay(RETRY_DELAY_MS);
      return api(config);
    }

    if (statusCode === 401 && !config.__authRetryAttempted && !isAuthRefreshUrl(config.url)) {
      config.__authRetryAttempted = true;
      const authStore = useAuthStore(pinia);
      try {
        if (!refreshPromise) {
          refreshPromise = api.post('/auth/refresh').finally(() => {
            refreshPromise = null;
          });
        }
        const refreshed = await refreshPromise;
        const payload = refreshed.data || {};
        if (payload.token) {
          authStore.setSession(payload.token, payload);
          return api(config);
        }
      } catch {
        authStore.clearSession();
        if (typeof window !== 'undefined' && window.location.pathname !== '/') {
          window.location.assign('/');
        }
      }
    }

    normalizeErrorPayload(error);
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  verifyMfa: (data) => api.post('/auth/login/mfa', data),
  refresh: () => api.post('/auth/refresh'),
  resetPassword: (data) => api.post('/auth/password-reset', data),
  logout: () => api.post('/auth/logout'),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  issueRecoveryCodes: () => api.post('/auth/recovery-codes'),
  setupMfa: () => api.post('/auth/mfa/setup'),
  enableMfa: (data) => api.post('/auth/mfa/enable', data),
  disableMfa: (data) => api.post('/auth/mfa/disable', data),
  listUsers: (params = {}) => api.get('/auth/users', { params }),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  issueUserRecoveryCodes: (id) => api.post(`/auth/users/${id}/recovery-codes`)
};

export const procurementAPI = {
  getAll: (params = {}) => api.get('/procurement', { params }),
  create: (data) => api.post('/procurement', data),
  update: (id, data) => api.put(`/procurement/${id}`, data),
  delete: (id) => api.delete(`/procurement/${id}`)
};

export const salesAPI = {
  getAll: (params = {}) => api.get('/sales', { params }),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  getAggregation: (params = {}) => api.get('/sales/aggregation', { params }),
  delete: (id) => api.delete(`/sales/${id}`)
};

export const creditSalesAPI = {
  getAll: (params = {}) => api.get('/credit-sales', { params }),
  create: (data) => api.post('/credit-sales', data),
  update: (id, data) => api.put(`/credit-sales/${id}`, data),
  repay: (id, data) => api.post(`/credit-sales/${id}/repay`, data),
  delete: (id) => api.delete(`/credit-sales/${id}`)
};

export const inventoryAPI = {
  get: () => api.get('/inventory')
};

export const notificationsAPI = {
  getAll: (params = {}) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all')
};

export const trustedBuyersAPI = {
  getAll: (params = {}) => api.get('/trusted-buyers', { params }),
  create: (data) => api.post('/trusted-buyers', data),
  update: (id, data) => api.put(`/trusted-buyers/${id}`, data),
  delete: (id) => api.delete(`/trusted-buyers/${id}`)
};

export const priceAPI = {
  getAll: () => api.get('/prices'),
  getHistory: (id) => api.get(`/prices/${id}/history`),
  create: (data) => api.post('/prices', data),
  update: (id, data) => api.put(`/prices/${id}`, data),
  delete: (id) => api.delete(`/prices/${id}`)
};

export const branchAPI = {
  list: () => api.get('/branches'),
  create: (data) => api.post('/branches', data),
  update: (id, data) => api.put(`/branches/${id}`, data)
};

export const auditAPI = {
  list: (params = {}) => api.get('/audit-logs', { params })
};
