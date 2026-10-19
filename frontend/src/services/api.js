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

const resolveApiUrl = () => {
  const fromEnv = sanitizeApiUrl(import.meta.env.VITE_API_URL);
  const fallbackPath = '/api/v1';
  const origin =
    typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '';

  if (fromEnv) {
    if (/^https?:\/\//i.test(fromEnv)) {
      return fromEnv.replace(/\/$/, '');
    }
    if (origin) {
      return new URL(fromEnv, origin).toString().replace(/\/$/, '');
    }
    return fromEnv;
  }

  if (origin) {
    return new URL(fallbackPath, origin).toString().replace(/\/$/, '');
  }

  return fallbackPath;
};

const API_URL = resolveApiUrl();
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
const REFRESH_LOCK_NAME = 'kgl-refresh-session';

const runRefresh = async () => {
  const refreshed = await api.post('/auth/refresh');
  const payload = refreshed.data || {};
  if (payload.token) {
    useAuthStore(pinia).setSession(payload.token, payload);
  }
  return refreshed;
};

// One refresh at a time in this tab, and one across tabs in this browser.
// The waiting tab then sends the replacement cookie instead of the spent one.
export const refreshAccessSession = () => {
  if (!refreshPromise) {
    const locked =
      typeof navigator !== 'undefined' && navigator.locks?.request
        ? navigator.locks.request(REFRESH_LOCK_NAME, runRefresh)
        : runRefresh();
    refreshPromise = locked.finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

const isAuthRefreshUrl = (url = '') =>
  String(url).includes('/auth/refresh') ||
  String(url).includes('/auth/login') ||
  String(url).includes('/auth/remembered') ||
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
        const refreshed = await refreshAccessSession();
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
  getRememberedUsername: () => api.get('/auth/remembered'),
  oidcStatus: () => api.get('/auth/oidc/status'),
  // Full-page navigation so the API can set its state cookie and redirect to the IdP.
  oidcLoginUrl: () => `${API_URL}/auth/oidc/login?redirect=1`,
  verifyMfa: (data) => api.post('/auth/login/mfa', data),
  refresh: () => api.post('/auth/refresh'),
  resetPassword: (data) => api.post('/auth/password-reset', data),
  logout: () => api.post('/auth/logout'),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  updateMe: (data, config) => api.put('/auth/me', data, config),
  issueRecoveryCodes: () => api.post('/auth/recovery-codes'),
  setupMfa: (config) => api.post('/auth/mfa/setup', {}, config),
  enableMfa: (data, config) => api.post('/auth/mfa/enable', data, config),
  disableMfa: (data) => api.post('/auth/mfa/disable', data),
  listUsers: (params = {}) => api.get('/auth/users', { params }),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  restoreUser: (id) => api.post(`/auth/users/${id}/restore`),
  issueUserRecoveryCodes: (id) => api.post(`/auth/users/${id}/recovery-codes`)
};

export const platformAPI = {
  status: () => api.get('/platform/status'),
  listWebhooks: () => api.get('/platform/webhooks'),
  createWebhook: (data) => api.post('/platform/webhooks', data),
  updateWebhook: (id, data) => api.put(`/platform/webhooks/${id}`, data),
  deleteWebhook: (id) => api.delete(`/platform/webhooks/${id}`),
  listDeliveries: (params = {}) => api.get('/platform/webhook-deliveries', { params }),
  redeliver: (id) => api.post(`/platform/webhook-deliveries/${id}/redeliver`),
  testEmit: (data) => api.post('/platform/webhooks/test-emit', data),
  enqueueJob: (data) => api.post('/platform/jobs/enqueue', data),
  previewWeeklyReport: () => api.get('/platform/reports/weekly/preview'),
  runWeeklyReport: () => api.post('/platform/reports/weekly/run'),
  listApiKeys: () => api.get('/platform/api-keys'),
  createApiKey: (data) => api.post('/platform/api-keys', data),
  revokeApiKey: (id) => api.post(`/platform/api-keys/${id}/revoke`),
  listInstances: () => api.get('/platform/instances')
};

export const procurementAPI = {
  getAll: (params = {}) => api.get('/procurement', { params }),
  create: (data) => api.post('/procurement', data),
  update: (id, data) => api.put(`/procurement/${id}`, data),
  delete: (id) => api.delete(`/procurement/${id}`),
  restore: (id) => api.post(`/procurement/${id}/restore`),
  listOrders: () => api.get('/procurement/orders'),
  createOrder: (data) => api.post('/procurement/orders', data),
  approveOrder: (id) => api.post(`/procurement/orders/${id}/approve`),
  receiveOrder: (id, data) => api.post(`/procurement/orders/${id}/receive`, data),
  matchOrder: (id) => api.get(`/procurement/orders/${id}/match`)
};

export const salesAPI = {
  getAll: (params = {}) => api.get('/sales', { params }),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  getAggregation: (params = {}) => api.get('/sales/aggregation', { params }),
  getDashboard: (params = {}) => api.get('/sales/dashboard', { params }),
  getAgentDashboard: () => api.get('/sales/agent-dashboard'),
  delete: (id) => api.delete(`/sales/${id}`),
  restore: (id) => api.post(`/sales/${id}/restore`),
  void: (id, data) => api.post(`/sales/${id}/void`, data)
};

export const creditSalesAPI = {
  getAll: (params = {}) => api.get('/credit-sales', { params }),
  create: (data) => api.post('/credit-sales', data),
  update: (id, data) => api.put(`/credit-sales/${id}`, data),
  repay: (id, data) => api.post(`/credit-sales/${id}/repay`, data),
  delete: (id) => api.delete(`/credit-sales/${id}`),
  restore: (id) => api.post(`/credit-sales/${id}/restore`),
  void: (id, data) => api.post(`/credit-sales/${id}/void`, data),
  requestWriteOff: (id, data) => api.post(`/credit-sales/${id}/write-off`, data)
};

export const inventoryAPI = {
  get: () => api.get('/inventory')
};

export const financeAPI = {
  getTaxConfig: () => api.get('/finance/tax-config'),
  updateTaxConfig: (data) => api.put('/finance/tax-config', data),
  listInvoices: (params = {}) => api.get('/finance/invoices', { params }),
  getInvoice: (id) => api.get(`/finance/invoices/${id}`),
  getInvoiceDocument: (id) =>
    api.get(`/finance/invoices/${id}/document`, { responseType: 'text', transformResponse: [(d) => d] }),
  getInvoicePdf: (id) =>
    api.get(`/finance/invoices/${id}/document`, { params: { format: 'pdf' }, responseType: 'blob' }),
  issueInvoiceFromSale: (saleId) => api.post(`/finance/invoices/from-sale/${saleId}`),
  listCashUps: (params = {}) => api.get('/finance/cash-up', { params }),
  openCashUp: (data) => api.post('/finance/cash-up/open', data),
  closeCashUp: (id, data) => api.post(`/finance/cash-up/${id}/close`, data),
  glExport: (params = {}) =>
    api.get('/finance/gl-export', {
      params,
      responseType: String(params.format || '').toLowerCase() === 'csv' ? 'text' : 'json',
      transformResponse:
        String(params.format || '').toLowerCase() === 'csv' ? [(data) => data] : undefined
    }),
  glMappings: () => api.get('/finance/gl-mappings'),
  getRetention: () => api.get('/finance/retention'),
  updateRetention: (data) => api.put('/finance/retention', data),
  runRetention: () => api.post('/finance/retention/run'),
  downloadAuditPack: (params = {}) =>
    api.get('/finance/retention/audit-pack', { params, responseType: 'blob' }),
  listWriteOffs: (params = {}) => api.get('/finance/write-offs', { params }),
  approveWriteOff: (id, data = {}) => api.post(`/finance/write-offs/${id}/approve`, data),
  rejectWriteOff: (id, data = {}) => api.post(`/finance/write-offs/${id}/reject`, data),
  listPeriodLocks: () => api.get('/finance/period-locks'),
  setPeriodLock: (data) => api.put('/finance/period-locks', data),
  getStatement: (buyerId, params = {}) => api.get(`/finance/statements/${buyerId}`, { params }),
  getStatementPdf: (buyerId, params = {}) =>
    api.get(`/finance/statements/${buyerId}`, { params: { ...params, format: 'pdf' }, responseType: 'blob' }),
  emailStatement: (buyerId, data = {}) => api.post(`/finance/statements/${buyerId}/email`, data),
  exportBuyerData: (buyerId) => api.get(`/finance/personal-data/trusted-buyers/${buyerId}`),
  exportUserData: (userId) => api.get(`/finance/personal-data/users/${userId}`),
  getAging: (params = {}) => api.get('/finance/aging', { params }),
  postJournal: (data) => api.post('/finance/gl-journal', data),
  trialBalance: (params = {}) => api.get('/finance/trial-balance', { params }),
  listBankLines: (params = {}) => api.get('/finance/bank-lines', { params }),
  importBankLines: (data) => api.post('/finance/bank-lines', data),
  matchBankLine: (id, data) => api.post(`/finance/bank-lines/${id}/match`, data),
  listExchangeRates: () => api.get('/finance/exchange-rates'),
  setExchangeRate: (data) => api.post('/finance/exchange-rates', data)
};

export const organizationAPI = {
  listEntities: () => api.get('/organization/entities'),
  createEntity: (data) => api.post('/organization/entities', data),
  assignBranch: (entityId, branchId) => api.post(`/organization/entities/${entityId}/branches`, { branchId }),
  consolidation: (entityId) => api.get(`/organization/entities/${entityId}/consolidation`)
};

export const catalogAPI = {
  listBarcodes: () => api.get('/catalog/barcodes'),
  lookupBarcode: (code) => api.get(`/catalog/barcodes/${encodeURIComponent(code)}`),
  registerBarcode: (data) => api.post('/catalog/barcodes', data)
};

export const inventoryOpsAPI = {
  listMovements: (params = {}) => api.get('/inventory/movements', { params }),
  listTransfers: (params = {}) => api.get('/inventory/transfers', { params }),
  createTransfer: (data) => api.post('/inventory/transfers', data),
  shipTransfer: (id) => api.post(`/inventory/transfers/${id}/ship`),
  receiveTransfer: (id) => api.post(`/inventory/transfers/${id}/receive`),
  cancelTransfer: (id) => api.post(`/inventory/transfers/${id}/cancel`),
  listAdjustments: (params = {}) => api.get('/inventory/adjustments', { params }),
  createAdjustment: (data) => api.post('/inventory/adjustments', data),
  approveAdjustment: (id) => api.post(`/inventory/adjustments/${id}/approve`),
  rejectAdjustment: (id) => api.post(`/inventory/adjustments/${id}/reject`),
  listStocktakes: (params = {}) => api.get('/inventory/stocktakes', { params }),
  getStocktake: (id) => api.get(`/inventory/stocktakes/${id}`),
  getStocktakeCountSheet: (id, params = {}) =>
    api.get(`/inventory/stocktakes/${id}/count-sheet`, {
      params,
      responseType: 'text',
      transformResponse: [(data) => data]
    }),
  createStocktake: (data = {}) => api.post('/inventory/stocktakes', data),
  updateStocktake: (id, data) => api.put(`/inventory/stocktakes/${id}`, data),
  postStocktake: (id) => api.post(`/inventory/stocktakes/${id}/post`)
};

export const notificationsAPI = {
  getAll: (params = {}) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all')
};

export const messagesAPI = {
  getAll: (params = {}) => api.get('/messages', { params }),
  unreadCount: () => api.get('/messages/unread-count'),
  markAsRead: (id) => api.put(`/messages/${id}/read`),
  markAllRead: () => api.put('/messages/read-all'),
  listOutbox: (params = {}) => api.get('/messages/outbox', { params }),
  retryOutbox: (id) => api.post(`/messages/outbox/${id}/retry`)
};

export const suppliersAPI = {
  getAll: (params = {}) => api.get('/suppliers', { params }),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  restore: (id) => api.post(`/suppliers/${id}/restore`)
};

export const trustedBuyersAPI = {
  getAll: (params = {}) => api.get('/trusted-buyers', { params }),
  create: (data) => api.post('/trusted-buyers', data),
  update: (id, data) => api.put(`/trusted-buyers/${id}`, data),
  delete: (id) => api.delete(`/trusted-buyers/${id}`),
  restore: (id) => api.post(`/trusted-buyers/${id}/restore`)
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

const portalApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

portalApi.interceptors.request.use((config) => {
  const token = window.sessionStorage.getItem('kgl.portalToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

portalApi.interceptors.response.use(
  (response) => {
    const payload = response.data;
    if (
      payload &&
      typeof payload === 'object' &&
      Object.prototype.hasOwnProperty.call(payload, 'success') &&
      Object.prototype.hasOwnProperty.call(payload, 'data')
    ) {
      response.data = payload.data;
    }
    return response;
  },
  (error) => {
    normalizeErrorPayload(error);
    return Promise.reject(error);
  }
);

export const operationsAPI = {
  listEmployees: () => api.get('/operations/employees'),
  createEmployee: (data) => api.post('/operations/employees', data),
  markAttendance: (data) => api.post('/operations/attendance', data),
  listLeave: () => api.get('/operations/leave'),
  requestLeave: (data) => api.post('/operations/leave', data),
  decideLeave: (id, data) => api.post(`/operations/leave/${id}/decision`, data),
  runPayroll: (data) => api.post('/operations/payroll', data),
  listBills: () => api.get('/operations/bills'),
  createBill: (data) => api.post('/operations/bills', data),
  payBill: (id, data) => api.post(`/operations/bills/${id}/payments`, data),
  listBins: () => api.get('/operations/bins'),
  createBin: (data) => api.post('/operations/bins', data),
  putaway: (data) => api.post('/operations/putaway', data),
  createPickList: (data) => api.post('/operations/pick-lists', data),
  latestWeighing: () => api.get('/operations/weighings/latest'),
  recordWeighing: (data) => api.post('/operations/weighings', data),
  listFiscal: () => api.get('/operations/fiscal'),
  listAssets: () => api.get('/operations/assets'),
  createAsset: (data) => api.post('/operations/assets', data),
  runDepreciation: (data) => api.post('/operations/depreciation', data),
  disposeAsset: (id, data) => api.post(`/operations/assets/${id}/dispose`, data),
  listFleet: () => api.get('/operations/fleet'),
  createVehicle: (data) => api.post('/operations/vehicles', data),
  recordTrip: (data) => api.post('/operations/trips', data),
  recordFuel: (data) => api.post('/operations/fuel', data),
  setBudget: (data) => api.post('/operations/budgets', data),
  budgetVariance: (params) => api.get('/operations/budgets/variance', { params }),
  listRestoreDrills: () => api.get('/operations/restore-drills'),
  recordRestoreDrill: () => api.post('/operations/restore-drills'),
  grantPortalAccess: (data) => api.post('/operations/portal-access', data)
};

export const portalAPI = {
  login: (data) => portalApi.post('/portal/login', data),
  home: () => portalApi.get('/portal/home')
};
