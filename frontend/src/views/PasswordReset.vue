<template>
  <div class="login-container d-flex align-items-center justify-content-center min-vh-100">
    <div class="card border-0" style="max-width: 480px; width: 100%">
      <div class="card-body p-4">
        <h2 class="h4 fw-bold">Reset password</h2>
        <p class="text-muted">
          Use a one-time recovery code from Profile, or ask your branch manager to issue codes, then choose a new
          password.
        </p>
        <form @submit.prevent="handleReset">
          <div class="mb-3">
            <label class="form-label" for="reset-username">Username</label>
            <input id="reset-username" v-model.trim="form.username" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label" for="reset-code">Recovery code</label>
            <input id="reset-code" v-model.trim="form.recoveryCode" class="form-control" required />
          </div>
          <div class="mb-3">
            <label class="form-label" for="reset-password">New password</label>
            <input
              id="reset-password"
              v-model="form.newPassword"
              type="password"
              class="form-control"
              minlength="10"
              required
            />
          </div>
          <div v-if="error" class="alert alert-danger">{{ error }}</div>
          <div v-if="success" class="alert alert-success">{{ success }}</div>
          <div class="d-flex gap-2">
            <button class="btn btn-success" type="submit" :disabled="loading">
              {{ loading ? 'Resetting...' : 'Reset password' }}
            </button>
            <router-link class="btn btn-outline-secondary" to="/">Back to sign in</router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { authAPI } from '../services/api';

export default {
  name: 'PasswordReset',
  data() {
    return {
      loading: false,
      error: '',
      success: '',
      form: {
        username: '',
        recoveryCode: '',
        newPassword: ''
      }
    };
  },
  methods: {
    async handleReset() {
      this.loading = true;
      this.error = '';
      this.success = '';
      try {
        const response = await authAPI.resetPassword(this.form);
        this.success = response.data?.message || 'Password reset successfully.';
      } catch (error) {
        this.error = error.response?.data?.message || 'Unable to reset password.';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
