import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
  (error) => {
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
  getUser: (id) => api.get(`/auth/users/${id}`),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`)
};

// Procurement API
export const procurementAPI = {
  getAll: () => api.get('/procurement'),
  create: (data) => api.post('/procurement', data),
  getById: (id) => api.get(`/procurement/${id}`),
  update: (id, data) => api.put(`/procurement/${id}`, data),
  delete: (id) => api.delete(`/procurement/${id}`)
};

// Sales API
export const salesAPI = {
  getAll: () => api.get('/sales'),
  create: (data) => api.post('/sales', data),
  getAggregation: (params = {}) => api.get('/sales/aggregation', { params }),
  delete: (id) => api.delete(`/sales/${id}`)
};

// Credit Sales API
export const creditSalesAPI = {
  getAll: () => api.get('/credit-sales'),
  create: (data) => api.post('/credit-sales', data),
  updatePaymentStatus: (id, status) => api.put(`/credit-sales/${id}/payment`, status),
  repay: (id, data) => api.post(`/credit-sales/${id}/repay`, data),
  delete: (id) => api.delete(`/credit-sales/${id}`)
};

// Inventory API
export const inventoryAPI = {
  get: () => api.get('/inventory'),
  checkStock: (data) => api.post('/inventory/check-stock', data)
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
  getById: (id) => api.get(`/prices/${id}`),
  create: (data) => api.post('/prices', data),
  update: (id, data) => api.put(`/prices/${id}`, data),
  delete: (id) => api.delete(`/prices/${id}`),
  setPrice: (data) => api.post('/prices', data)
};

export default api;
