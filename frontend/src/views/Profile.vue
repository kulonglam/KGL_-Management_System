<template>
  <div class="profile-page view-shell">
    <div class="view-header">
      <div class="view-heading">
        <h2 class="page-title">My Profile</h2>
        <p class="page-subtitle">Update your account details securely.</p>
      </div>
    </div>

    <div class="card profile-card">
      <div class="card-header">
        <h5 class="mb-0">Account Information</h5>
      </div>
      <div class="card-body">
        <div class="profile-image-panel mb-4">
          <div class="profile-image-preview">
            <img v-if="profileImagePreview" :src="profileImagePreview" alt="Profile image" />
            <div v-else class="profile-image-placeholder">
              <i class="bi bi-person"></i>
            </div>
          </div>
          <div>
            <div class="d-flex flex-wrap gap-2">
              <label class="btn btn-outline-primary btn-sm mb-0" for="profile-image-upload">
                <input
                  id="profile-image-upload"
                  type="file"
                  class="d-none"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  :disabled="saving || loading"
                  @change="handleImageChange"
                />
                Upload Image
              </label>
              <button
                v-if="profileImagePreview"
                type="button"
                class="btn btn-outline-danger btn-sm"
                :disabled="saving || loading"
                @click="removeImage"
              >
                Remove
              </button>
            </div>
            <small class="text-muted d-block mt-2">PNG, JPG, or WEBP up to 1 MB.</small>
          </div>
        </div>

        <form @submit.prevent="handleSave">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label fw-semibold" for="profile-full-name">Full Name</label>
              <input
                id="profile-full-name"
                v-model="form.name"
                type="text"
                class="form-control"
                minlength="2"
                pattern="^[A-Za-z0-9\\s.]+$"
                required
              />
            </div>

            <div class="col-md-6">
              <label class="form-label fw-semibold" for="profile-username">Username</label>
              <input
                id="profile-username"
                v-model="form.username"
                type="text"
                class="form-control"
                minlength="2"
                required
              />
            </div>

            <div class="col-md-6">
              <label class="form-label fw-semibold" for="profile-role">Role</label>
              <input id="profile-role" :value="formatRole(form.role)" type="text" class="form-control" disabled />
            </div>

            <div class="col-md-6">
              <label class="form-label fw-semibold" for="profile-branch">Branch</label>
              <input id="profile-branch" :value="form.branch || '-'" type="text" class="form-control" disabled />
            </div>
          </div>

          <hr class="my-4" />

          <h6 class="mb-3">Change Password</h6>
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label fw-semibold" for="profile-new-password">New Password</label>
              <input
                id="profile-new-password"
                v-model="form.password"
                type="password"
                class="form-control"
                minlength="6"
                placeholder="Leave blank to keep current password"
              />
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold" for="profile-confirm-password">Confirm New Password</label>
              <input
                id="profile-confirm-password"
                v-model="form.confirmPassword"
                type="password"
                class="form-control"
                minlength="6"
                placeholder="Repeat new password"
              />
            </div>
          </div>

          <div v-if="error" class="alert alert-danger mt-4 mb-0">{{ error }}</div>
          <div v-if="success" class="alert alert-success mt-4 mb-0">{{ success }}</div>

          <div class="d-flex flex-wrap gap-2 mt-4">
            <button type="submit" class="btn btn-primary" :disabled="saving || loading">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              Save Changes
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary"
              :disabled="saving || loading"
              @click="handleCancel"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
// Profile management page for viewing/updating account details and optional profile photo.
 
import { authAPI } from '../services/api';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';
import { getHomeRouteForUser } from '../utils/directorAccess.js';

// Cap uploaded profile image size to 1 MB.
const MAX_PROFILE_IMAGE_SIZE_BYTES = 1024 * 1024;
// Restrict uploads to accepted image MIME types.
const ALLOWED_PROFILE_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export default {
  name: 'Profile',
  data() {
    return {
      loading: false,
      saving: false,
      error: '',
      success: '',
      profileImagePreview: '',
      profileImageChanged: false,
      form: {
        _id: '',
        name: '',
        username: '',
        role: '',
        branch: '',
        password: '',
        confirmPassword: ''
      }
    };
  },
  async created() {
    await this.loadProfile();
  },
  methods: {
    // Load current user profile from backend and hydrate local form state.
    async loadProfile() {
      this.loading = true;
      this.error = '';
      this.success = '';
      try {
        const response = await authAPI.getMe();
        this.applyUserToForm(response.data);
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to load profile';
      } finally {
        this.loading = false;
      }
    },
    // Leave the profile editor when possible, otherwise restore the saved profile state.
    handleCancel() {
      const previousRoute = window.history.state?.back;
      if (previousRoute && previousRoute !== this.$route.fullPath) {
        this.$router.back();
        return;
      }

      const authStore = useAuthStore(pinia);
      const fallbackRoute = getHomeRouteForUser(authStore.user);
      if (fallbackRoute && fallbackRoute !== this.$route.fullPath) {
        this.$router.push(fallbackRoute);
        return;
      }

      this.loadProfile();
    },
    // Apply backend user payload to editable form fields.
    applyUserToForm(user) {
      this.form = {
        _id: user._id || '',
        name: user.name || '',
        username: user.username || '',
        role: user.role || '',
        branch: user.branch || '',
        password: '',
        confirmPassword: ''
      };
      this.profileImagePreview = user.profileImage || '';
      this.profileImageChanged = false;
      this.updateSessionUser(user);
    },
    // Keep Pinia session user details synchronized with profile updates.
    updateSessionUser(user) {
      const authStore = useAuthStore(pinia);
      authStore.updateUser({
        _id: user._id,
        name: user.name,
        username: user.username,
        profileImage: user.profileImage ?? '',
        role: user.role,
        branch: user.branch
      });
    },
    // Validate and preview selected profile image before upload.
    handleImageChange(event) {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!ALLOWED_PROFILE_IMAGE_TYPES.includes(file.type)) {
        this.error = 'Profile image must be PNG, JPG, or WEBP.';
        event.target.value = '';
        return;
      }

      if (file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
        this.error = 'Profile image must be 1 MB or smaller.';
        event.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.error = '';
        this.profileImagePreview = typeof reader.result === 'string' ? reader.result : '';
        this.profileImageChanged = true;
      };
      reader.onerror = () => {
        this.error = 'Failed to process the selected image.';
      };
      reader.readAsDataURL(file);
      event.target.value = '';
    },
    // Remove current previewed profile image from pending payload.
    removeImage() {
      this.error = '';
      this.profileImagePreview = '';
      this.profileImageChanged = true;
    },
    // Validate profile changes and submit update payload.
    async handleSave() {
      this.error = '';
      this.success = '';

      if (this.form.password || this.form.confirmPassword) {
        if (this.form.password.length < 6) {
          this.error = 'Password must be at least 6 characters.';
          return;
        }
        if (this.form.password !== this.form.confirmPassword) {
          this.error = 'Password confirmation does not match.';
          return;
        }
      }

      this.saving = true;
      try {
        // Send only mutable account fields and optional password/image changes.
        const payload = {
          name: this.form.name.trim(),
          username: this.form.username.trim()
        };

        if (this.profileImageChanged) {
          payload.profileImage = this.profileImagePreview;
        }

        if (this.form.password) {
          payload.password = this.form.password;
        }

        const response = await authAPI.updateMe(payload);
        this.applyUserToForm(response.data);
        this.success = 'Profile updated successfully.';
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update profile';
      } finally {
        this.saving = false;
      }
    },
    formatRole(role) {
      if (role === 'sales_agent') return 'Sales Agent';
      if (role === 'manager') return 'Manager';
      if (role === 'director') return 'Director';
      return role || '-';
    }
  }
};
</script>

<style scoped>
/* Component styles */
.profile-page {
  max-width: 960px;
}

.profile-card {
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.profile-image-panel {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}

.profile-image-preview {
  width: 84px;
  height: 84px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #dbe4f0;
  background: #f8fafc;
  flex-shrink: 0;
}

.profile-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 2rem;
}
</style>
