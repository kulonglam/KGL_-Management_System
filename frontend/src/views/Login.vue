<template>
  <div class="login-container d-flex align-items-center justify-content-center min-vh-100">
    <div class="card shadow-lg border-0 overflow-hidden" style="max-width: 900px; width: 100%">
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
            <h1 class="display-6 fw-bold mb-3 login-sidebar-title">Welcome to Karibu Groceries</h1>
            <p class="lead mb-0 login-sidebar-copy">
              Track procurement, inventory, cash and credit sales across branches in real time.
            </p>
          </div>
          <div class="text-center small mt-auto login-sidebar-footer">
            &copy; 2026 Karibu Groceries LTD
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
                @click="showResetHelp"
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
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>
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
      helpMessage: ''
    };
  },
  created() {
    const rememberedUsername = localStorage.getItem('rememberedUsername') || '';
    if (rememberedUsername) {
      this.credentials.username = rememberedUsername;
      this.rememberMe = true;
    }
  },
  methods: {
    // Show a non-technical password-reset instruction for users.
    showResetHelp() {
      this.helpMessage = 'Please contact your manager or system administrator to reset your password.';
    },
    // Submit login credentials and hydrate client session on success.
    async handleLogin() {
      this.loading = true;
      this.error = '';
      this.helpMessage = '';

      try {
        const payload = {
          username: this.credentials.username.trim(),
          password: this.credentials.password
        };
        const response = await authAPI.login(payload);
        const { token, ...user } = response.data;

        const authStore = useAuthStore(pinia);
        authStore.setSession(token, user);
        if (this.rememberMe) {
          localStorage.setItem('rememberedUsername', payload.username);
        } else {
          localStorage.removeItem('rememberedUsername');
        }

        // Route user to the dashboard permitted by their assigned role.
        if (user.role === 'director') {
          this.$router.push('/dashboard/director');
        } else if (user.role === 'manager') {
          this.$router.push('/dashboard/manager');
        } else {
          this.$router.push('/dashboard/sales-agent');
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Login failed';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
/* Component styles */
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
