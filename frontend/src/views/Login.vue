<template>
  <div class="login-container d-flex align-items-center justify-content-center min-vh-100">
    <div class="card shadow-lg border-0 overflow-hidden login-card">
      <div class="row g-0">
        <!-- Left Side -->
        <div
          class="col-md-6 d-none d-md-flex flex-column text-white p-5 login-sidebar position-relative"
        >
          <div class="d-flex align-items-center position-absolute top-0 start-0 p-5">
            <div class="brand-logo-wrap brand-logo-desktop me-3">
              <img :src="brandLogo" alt="Karibu Groceries LTD logo" class="brand-logo-image" />
            </div>
            <p class="fw-bold mb-0 h5 login-sidebar-brand">Karibu Groceries LTD</p>
          </div>
          <div
            class="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center mt-5"
          >
            <h2 class="display-6 fw-bold mb-3 login-sidebar-title">Welcome to Karibu Groceries</h2>
            <p class="lead mb-0 login-sidebar-copy">
              Track procurement, inventory, cash and credit sales across branches in real time.
            </p>
          </div>
          <div class="text-center small mt-auto login-sidebar-footer">
            &copy; 2026 Karibu Groceries LTD | Your trusted whole sales system
          </div>
        </div>

        <!-- Right Side -->
        <div class="col-md-6 bg-white p-5">
          <div class="d-flex align-items-center justify-content-center mb-4 d-md-none">
            <div class="brand-logo-wrap brand-logo-mobile me-2">
              <img :src="brandLogo" alt="Karibu Groceries LTD logo" class="brand-logo-image" />
            </div>
            <p class="fw-bold text-success h4 mb-0">Karibu Groceries LTD</p>
          </div>

          <div class="text-center mb-5">
            <h2 class="fw-bold text-dark h3">Sign In</h2>
            <p class="text-muted">Access your dashboard</p>
          </div>

          <form @submit.prevent="handleLogin">
            <div class="mb-4">
              <label for="username" class="form-label small text-uppercase fw-bold text-muted"
                >Username</label
              >
              <div class="input-group">
                <span class="input-group-text bg-white border-end-0"
                  ><i class="bi bi-person text-muted"></i
                ></span>
                <input
                  type="text"
                  class="form-control border-start-0 ps-0"
                  id="username"
                  v-model="credentials.username"
                  required
                  placeholder="Enter your username"
                  autocomplete="username"
                />
              </div>
            </div>

            <div class="mb-4">
              <label for="password" class="form-label small text-uppercase fw-bold text-muted"
                >Password</label
              >
              <div class="input-group">
                <span class="input-group-text bg-white border-end-0"
                  ><i class="bi bi-lock text-muted"></i
                ></span>
                <input
                  :type="showPassword ? 'text' : 'password'"
                  class="form-control border-start-0 border-end-0 ps-0"
                  id="password"
                  v-model="credentials.password"
                  required
                  placeholder="Enter your password"
                  autocomplete="current-password"
                />
                <button
                  class="btn btn-outline-secondary border-start-0 bg-white login-password-toggle"
                  type="button"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  @click="showPassword = !showPassword"
                >
                  <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                </button>
              </div>
            </div>

            <div v-if="passwordChangeRequired" class="mb-4">
              <label for="new-password" class="form-label small text-uppercase fw-bold text-muted"
                >New password</label
              >
              <input
                id="new-password"
                v-model="newPassword"
                type="password"
                class="form-control mb-3"
                autocomplete="new-password"
                placeholder="Choose a new password"
              />
              <label for="confirm-password" class="form-label small text-uppercase fw-bold text-muted"
                >Confirm password</label
              >
              <input
                id="confirm-password"
                v-model="confirmPassword"
                type="password"
                class="form-control"
                autocomplete="new-password"
                placeholder="Repeat the new password"
              />
            </div>

            <div v-if="mfaRequired || mfaEnrollmentRequired" class="mb-4">
              <label for="mfa-code" class="form-label small text-uppercase fw-bold text-muted"
                >Authenticator code</label
              >
              <input
                id="mfa-code"
                v-model.trim="mfaCode"
                type="text"
                inputmode="numeric"
                maxlength="6"
                class="form-control"
                placeholder="6-digit code"
                autocomplete="one-time-code"
              />
              <p v-if="mfaEnrollmentRequired && mfaSecret" class="small text-muted mt-3 mb-1">
                Add this secret to an authenticator app, then enter the code.
              </p>
              <p v-if="mfaEnrollmentRequired && mfaSecret" class="small font-monospace text-break mb-0">
                {{ mfaSecret }}
              </p>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-4">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="rememberMe"
                  v-model="rememberMe"
                />
                <label class="form-check-label small text-muted" for="rememberMe">
                  Remember username
                </label>
              </div>
              <button
                type="button"
                class="btn btn-link p-0 small text-decoration-none fw-bold text-success"
                @click="$router.push('/reset-password')"
              >
                Forgot Password?
              </button>
            </div>

            <div v-if="error" class="alert alert-danger py-2 small shadow-sm border-0" role="alert" aria-live="assertive">
              <i class="bi bi-exclamation-circle-fill me-2"></i> {{ error }}
            </div>
            <div
              v-if="helpMessage"
              class="alert alert-info py-2 small shadow-sm border-0"
              role="status"
              aria-live="polite"
            >
              <i class="bi bi-info-circle-fill me-2"></i> {{ helpMessage }}
            </div>

            <button
              type="submit"
              class="btn btn-success w-100 py-2 fw-bold shadow-sm"
              :disabled="loading"
            >
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{
                loading
                  ? 'Signing in...'
                  : passwordChangeRequired
                    ? 'Update password'
                    : mfaEnrollmentRequired
                      ? 'Turn on MFA'
                      : mfaRequired
                        ? 'Verify code'
                        : 'Sign In'
              }}
            </button>
          </form>

          <template v-if="sso.enabled && !mfaRequired && !mfaEnrollmentRequired && !passwordChangeRequired">
            <div class="d-flex align-items-center my-4 text-muted small">
              <hr class="flex-grow-1" />
              <span class="px-2">or</span>
              <hr class="flex-grow-1" />
            </div>
            <button
              type="button"
              class="btn btn-outline-dark w-100 py-2 fw-bold"
              :disabled="loading"
              @click="startSso"
            >
              <i class="bi bi-shield-lock me-2"></i>Sign in with {{ sso.providerName || 'SSO' }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * Authentication screen that signs users in and routes them to role-specific dashboards.
 * File: frontend/src/views/Login.vue
 */

import { authAPI } from '../services/api';
import brandLogo from '../assets/images/logo.png';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';
import { getHomeRouteForUser } from '../utils/directorAccess.js';

export default {
  name: 'Login',
  data() {
    return {
      brandLogo,
      credentials: {
        username: '',
        password: ''
      },
      rememberMe: false,
      showPassword: false,
      loading: false,
      error: '',
      helpMessage: '',
      mfaRequired: false,
      mfaEnrollmentRequired: false,
      passwordChangeRequired: false,
      setupToken: '',
      mfaToken: '',
      mfaCode: '',
      mfaSecret: '',
      newPassword: '',
      confirmPassword: '',
      sso: { enabled: false, providerName: '' }
    };
  },
  async created() {
    localStorage.removeItem('rememberedUsername');
    this.loadSsoStatus();
    const query = this.$route?.query || {};
    const ssoResult = String(query.sso || '');
    if (ssoResult) {
      await this.finishSso(ssoResult, String(query.reason || ''));
      return;
    }
    try {
      const response = await authAPI.getRememberedUsername();
      const username = String(response?.data?.username || '').trim();
      if (username) {
        this.credentials.username = username;
        this.rememberMe = true;
      }
    } catch {
      // Sign-in still works when the remembered-username request fails.
    }
  },
  methods: {
    // Show a non-technical password-reset instruction for users.
    completeLogin(authPayload) {
      const { token, ...user } = authPayload;
      const authStore = useAuthStore(pinia);
      authStore.setSession(token, user);
      this.$router.push(getHomeRouteForUser(user));
    },
    setupRequest() {
      return { headers: { Authorization: `Bearer ${this.setupToken}` } };
    },
    async loadSsoStatus() {
      try {
        const response = await authAPI.oidcStatus();
        this.sso = {
          enabled: Boolean(response?.data?.enabled),
          providerName: response?.data?.providerName || ''
        };
      } catch {
        this.sso = { enabled: false, providerName: '' };
      }
    },
    startSso() {
      this.loading = true;
      window.location.assign(authAPI.oidcLoginUrl());
    },
    // The SSO callback only sets the refresh cookie; exchange it for an access token here.
    async finishSso(result, reason) {
      this.$router.replace({ path: this.$route.path, query: {} });
      if (result !== 'success') {
        this.error = reason || 'Single sign-on failed. Try again.';
        return;
      }
      this.loading = true;
      try {
        const authStore = useAuthStore(pinia);
        const restored = await authStore.restoreSession();
        if (!restored) {
          this.error = 'Single sign-on finished but the session could not be started. Try again.';
          return;
        }
        this.$router.push(getHomeRouteForUser(authStore.user));
      } finally {
        this.loading = false;
      }
    },
    async handleLogin() {
      this.loading = true;
      this.error = '';
      this.helpMessage = '';

      try {
        if (this.passwordChangeRequired) {
          if (!this.newPassword || this.newPassword !== this.confirmPassword) {
            this.error = 'Enter the new password twice, with the same value.';
            return;
          }
          await authAPI.updateMe({ password: this.newPassword }, this.setupRequest());
          this.passwordChangeRequired = false;
          this.setupToken = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.credentials.password = '';
          this.helpMessage = 'Password updated. Sign in with the new password.';
          return;
        }

        if (this.mfaEnrollmentRequired) {
          await authAPI.enableMfa({ code: this.mfaCode }, this.setupRequest());
          this.mfaEnrollmentRequired = false;
          this.setupToken = '';
          this.mfaSecret = '';
          this.mfaCode = '';
          this.helpMessage = 'Authenticator MFA is on. Sign in again and enter the 6-digit code.';
          return;
        }

        if (this.mfaRequired) {
          const response = await authAPI.verifyMfa({
            mfaToken: this.mfaToken,
            code: this.mfaCode,
            rememberMe: this.rememberMe
          });
          this.completeLogin(response?.data);
          return;
        }

        const payload = {
          username: this.credentials.username.trim(),
          password: this.credentials.password,
          rememberMe: this.rememberMe
        };
        const response = await authAPI.login(payload);
        const authPayload = response?.data;
        if (authPayload?.passwordChangeRequired) {
          this.passwordChangeRequired = true;
          this.setupToken = authPayload.setupToken;
          this.helpMessage = authPayload.message;
          return;
        }
        if (authPayload?.mfaEnrollmentRequired) {
          this.mfaEnrollmentRequired = true;
          this.setupToken = authPayload.setupToken;
          const setup = await authAPI.setupMfa(this.setupRequest());
          this.mfaSecret = setup?.data?.secret || '';
          this.helpMessage = authPayload.message;
          return;
        }
        if (authPayload?.mfaRequired) {
          this.mfaRequired = true;
          this.mfaToken = authPayload.mfaToken;
          this.helpMessage = 'Enter the 6-digit code from your authenticator app.';
          return;
        }
        if (!authPayload || typeof authPayload !== 'object' || !authPayload.token || !authPayload.role) {
          throw new Error('Login service misconfiguration detected. Check frontend API URL settings.');
        }
        this.completeLogin(authPayload);
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Login failed';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
/* Component styles */
.login-card {
  max-width: 900px;
  width: 100%;
}

.login-container {
  background-image:
    linear-gradient(135deg, rgba(15, 23, 42, 0.55), rgba(30, 64, 175, 0.35)),
    url('../assets/images/background.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.login-sidebar {
  background-image:
    linear-gradient(145deg, rgba(8, 15, 28, 0.62), rgba(17, 64, 52, 0.68)),
    url('../assets/images/login.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.login-sidebar-brand {
  color: #f8fafc;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}

.login-sidebar-title {
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.login-sidebar-copy {
  color: rgba(241, 245, 249, 0.9);
  max-width: 28ch;
}

.login-sidebar-footer {
  color: rgba(226, 232, 240, 0.86);
}

.brand-logo-wrap {
  border-radius: 50%;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

.brand-logo-desktop {
  width: 48px;
  height: 48px;
}

.brand-logo-mobile {
  width: 40px;
  height: 40px;
}

.brand-logo-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Custom Input Styling */
.input-group-text {
  border-color: #ced4da;
}

.form-control {
  border-color: #ced4da;
}

.form-control:focus {
  box-shadow: none;
  border-color: #198754;
}

.input-group:focus-within .input-group-text {
  border-color: #198754;
}

.input-group:focus-within .form-control {
  border-color: #198754;
}

.input-group:focus-within button {
  border-color: #198754;
}

.login-password-toggle {
  color: #6c757d;
}

.login-password-toggle:hover,
.login-password-toggle:focus,
.login-password-toggle:active {
  color: #495057;
  background-color: #ffffff !important;
}

.btn-success {
  background-color: #198754;
  border-color: #198754;
  transition: all 0.3s ease;
}

.btn-success:hover {
  background-color: #157347;
  border-color: #146c43;
  transform: translateY(-1px);
}
</style>
