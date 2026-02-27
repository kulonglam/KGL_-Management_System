<template>
  <div class="login-container d-flex align-items-center justify-content-center min-vh-100">
    <div class="card shadow-lg border-0 overflow-hidden" style="max-width: 900px; width: 100%">
      <div class="row g-0">
        <!-- Left Side -->
        <div
          class="col-md-6 d-none d-md-flex flex-column text-white p-5 login-sidebar position-relative"
        >
          <div class="d-flex align-items-center position-absolute top-0 start-0 p-5">
            <div
              class="bg-white bg-opacity-25 rounded-circle d-inline-flex align-items-center justify-content-center me-3"
              style="width: 48px; height: 48px"
            >
              <i class="bi bi-box-seam text-white" style="font-size: 1.5rem"></i>
            </div>
            <h2 class="fw-bold mb-0 h5">Karibu Groceries LTD</h2>
          </div>
          <div
            class="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center mt-5"
          >
            <h1 class="display-4 fw-bold mb-3">Welcome Back!</h1>
            <p class="lead mb-0 text-white-50">
              Streamline your wholesale produce distribution with our advanced management system.
            </p>
          </div>
          <div class="text-center text-white-50 small mt-auto">
            &copy; 2026 Karibu Groceries LTD
          </div>
        </div>

        <!-- Right Side -->
        <div class="col-md-6 bg-white p-5">
          <div class="d-flex align-items-center justify-content-center mb-4 d-md-none">
            <div
              class="bg-success rounded-circle d-inline-flex align-items-center justify-content-center me-2"
              style="width: 40px; height: 40px"
            >
              <i class="bi bi-box-seam text-white" style="font-size: 1.2rem"></i>
            </div>
            <h3 class="fw-bold text-success h4 mb-0">Karibu Groceries LTD</h3>
          </div>

          <div class="text-center mb-5">
            <h3 class="fw-bold text-dark">Sign In</h3>
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
                />
                <button
                  class="btn btn-outline-secondary border-start-0 border-start-0 bg-white"
                  type="button"
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
                  Remember me
                </label>
              </div>
              <a href="#" class="small text-decoration-none fw-bold text-success" @click.prevent
                >Forgot Password?</a
              >
            </div>

            <div v-if="error" class="alert alert-danger py-2 small shadow-sm border-0" role="alert">
              <i class="bi bi-exclamation-circle-fill me-2"></i> {{ error }}
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
import { authAPI } from '../services/api';

export default {
  name: 'Login',
  data() {
    return {
      credentials: {
        username: '',
        password: ''
      },
      rememberMe: false,
      showPassword: false,
      loading: false,
      error: ''
    };
  },
  methods: {
    // Handle login.
    async handleLogin() {
      this.loading = true;
      this.error = '';

      try {
        const response = await authAPI.login(this.credentials);
        const { token, ...user } = response.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Navigate based on role
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
  background-color: #f8f9fa;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.login-sidebar {
  background: linear-gradient(135deg, rgba(9, 10, 10, 0.719) rgba(20, 108, 67, 0.8)), url('');
  background-size: cover;
  background-position: center;
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
