import axios from 'axios';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';

// Configure api url.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const RETRY_DELAY_MS = 250;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Handle delay helper.
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore(pinia);
    const token = authStore.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Normalize API responses shaped as { success, data, error }
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

    const payload = error.response?.data;
    if (
      payload &&
      typeof payload === 'object' &&
      Object.prototype.hasOwnProperty.call(payload, 'success') &&
      Object.prototype.hasOwnProperty.call(payload, 'data') &&
      Object.prototype.hasOwnProperty.call(payload, 'error')
    ) {
      const normalizedMessage = payload.error?.message || 'Request failed';
      error.response.data = {
        ...payload,
        message: normalizedMessage
      };
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  listUsers: () => api.get('/auth/users'),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`)
};

// Procurement API
export const procurementAPI = {
  getAll: () => api.get('/procurement'),
  create: (data) => api.post('/procurement', data),
  update: (id, data) => api.put(`/procurement/${id}`, data),
  delete: (id) => api.delete(`/procurement/${id}`)
};

// Sales API
export const salesAPI = {
  getAll: () => api.get('/sales'),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  getAggregation: (params = {}) => api.get('/sales/aggregation', { params }),
  delete: (id) => api.delete(`/sales/${id}`)
};

// Credit Sales API
export const creditSalesAPI = {
  getAll: () => api.get('/credit-sales'),
  create: (data) => api.post('/credit-sales', data),
  update: (id, data) => api.put(`/credit-sales/${id}`, data),
  repay: (id, data) => api.post(`/credit-sales/${id}/repay`, data),
  delete: (id) => api.delete(`/credit-sales/${id}`)
};

// Inventory API
export const inventoryAPI = {
  get: () => api.get('/inventory')
};

// Stock Notifications API
export const notificationsAPI = {
  getAll: (params = {}) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`)
};

// Trusted Buyers API
export const trustedBuyersAPI = {
  getAll: () => api.get('/trusted-buyers'),
  create: (data) => api.post('/trusted-buyers', data),
  update: (id, data) => api.put(`/trusted-buyers/${id}`, data),
  delete: (id) => api.delete(`/trusted-buyers/${id}`)
};

// Price Management API
export const priceAPI = {
  getAll: () => api.get('/prices'),
  create: (data) => api.post('/prices', data),
  update: (id, data) => api.put(`/prices/${id}`, data),
  delete: (id) => api.delete(`/prices/${id}`)
};

export default api;
