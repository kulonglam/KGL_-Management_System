import { defineStore } from 'pinia';

const USER_STORAGE_KEY = 'user';

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
};

const readStoredUser = () => {
  try {
    const storage = getStorage();
    if (!storage) return {};
    const rawUser = storage.getItem(USER_STORAGE_KEY);
    return rawUser ? JSON.parse(rawUser) : {};
  } catch {
    return {};
  }
};

const writeStoredUser = (user) => {
  try {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(USER_STORAGE_KEY, JSON.stringify(user || {}));
    storage.removeItem('token');
  } catch {
    // Ignore storage write issues to avoid blocking in-memory session updates.
  }
};

const removeStoredSession = () => {
  try {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem('token');
    storage.removeItem(USER_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup issues to avoid blocking logout.
  }
};

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: {},
    hydrated: false
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    role: (state) => state.user?.role || ''
  },
  actions: {
    hydrateFromStorage() {
      this.user = readStoredUser();
      this.hydrated = true;
    },
    async restoreSession() {
      this.hydrateFromStorage();
      try {
        const { authAPI } = await import('../services/api');
        const response = await authAPI.refresh();
        const payload = response.data || {};
        if (payload.token) {
          this.setSession(payload.token, payload);
          return true;
        }
      } catch {
        this.clearSession();
      }
      return false;
    },
    setSession(token, user) {
      this.token = token || null;
      const nextUser = { ...(user || {}) };
      delete nextUser.token;
      this.user = nextUser;
      this.hydrated = true;
      writeStoredUser(this.user);
    },
    clearSession() {
      this.token = null;
      this.user = {};
      this.hydrated = true;
      removeStoredSession();
    },
    updateUser(partialUser) {
      this.user = {
        ...(this.user || {}),
        ...(partialUser || {})
      };
      this.hydrated = true;
      writeStoredUser(this.user);
    }
  }
});
