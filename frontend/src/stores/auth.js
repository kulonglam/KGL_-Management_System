import { defineStore } from 'pinia';

const TOKEN_STORAGE_KEY = 'token';
const USER_STORAGE_KEY = 'user';

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
};

const readStoredToken = () => {
  try {
    const storage = getStorage();
    return storage ? storage.getItem(TOKEN_STORAGE_KEY) : null;
  } catch {
    return null;
  }
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

const writeStoredSession = (token, user) => {
  try {
    const storage = getStorage();
    if (!storage) return;

    if (token) {
      storage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      storage.removeItem(TOKEN_STORAGE_KEY);
    }

    storage.setItem(USER_STORAGE_KEY, JSON.stringify(user || {}));
  } catch {
    // Ignore storage write issues to avoid blocking in-memory session updates.
  }
};

const removeStoredSession = () => {
  try {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem(TOKEN_STORAGE_KEY);
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
      this.token = readStoredToken();
      this.user = readStoredUser();
      this.hydrated = true;
    },
    setSession(token, user) {
      this.token = token || null;
      this.user = user || {};
      this.hydrated = true;
      writeStoredSession(this.token, this.user);
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
      writeStoredSession(this.token, this.user);
    }
  }
});
