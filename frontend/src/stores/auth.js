// Stores authenticated user session state and keeps it synchronized with sessionStorage.

import { defineStore } from 'pinia';

const TOKEN_STORAGE_KEY = 'token';
const USER_STORAGE_KEY = 'user';

// Return browser sessionStorage safely (null in SSR or restricted contexts).
const getStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
};

// Read persisted token while gracefully handling storage access errors.
const readStoredToken = () => {
  try {
    const storage = getStorage();
    return storage ? storage.getItem(TOKEN_STORAGE_KEY) : null;
  } catch {
    return null;
  }
};

// Read persisted user payload and parse JSON safely.
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

// Persist both token and user snapshot, removing token when session is cleared.
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

// Remove all persisted auth session keys.
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
    // Hydrate in-memory auth state from sessionStorage.
    hydrateFromStorage() {
      this.token = readStoredToken();
      this.user = readStoredUser();
      this.hydrated = true;
    },
    // Set authenticated session after login or profile fetch.
    setSession(token, user) {
      this.token = token || null;
      this.user = user || {};
      this.hydrated = true;
      writeStoredSession(this.token, this.user);
    },
    // Clear authenticated session during logout or invalid-session flows.
    clearSession() {
      this.token = null;
      this.user = {};
      this.hydrated = true;
      removeStoredSession();
    },
    // Merge user profile updates and persist them.
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
