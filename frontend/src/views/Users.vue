<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">User Management</h2>
      <p class="page-subtitle">Create and maintain branch user accounts.</p>
    </div>

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Users</h5>
        <div class="d-flex gap-2">
          <button class="btn btn-primary btn-sm" @click="toggleForm">
            {{ showForm ? (editingId ? 'Close Edit' : 'Hide Form') : 'New User' }}
          </button>
          <button class="btn btn-outline-primary btn-sm" @click="loadUsers" :disabled="loadingList">
            <span v-if="loadingList" class="spinner-border spinner-border-sm me-2"></span>
            Refresh
          </button>
        </div>
      </div>
      <div class="card-body">
        <div v-if="users.length === 0" class="text-center py-5 text-muted">
          No users found for this branch.
        </div>
        <div v-else class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Branch</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in users" :key="item._id">
                <td>{{ item.name }}</td>
                <td>{{ item.username }}</td>
                <td>{{ formatRole(item.role) }}</td>
                <td>{{ item.branch || '-' }}</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-primary me-2" @click="startEdit(item)">
                    Edit
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="openDeleteDialog(item)">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="card mt-4">
      <div class="card-header">
        <h5 class="mb-0">{{ editingId ? 'Update User' : 'Create New User' }}</h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleSubmit">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label" for="user-name">Full Name *</label>
              <input
                id="user-name"
                type="text"
                class="form-control"
                v-model="form.name"
                minlength="2"
                pattern="^[A-Za-z0-9\\s]+$"
                required
              />
            </div>
            <div class="col-md-6">
              <label class="form-label" for="user-username">Username *</label>
              <input id="user-username" type="text" class="form-control" v-model="form.username" required />
            </div>
            <div class="col-md-6">
              <label class="form-label" for="user-role">Role *</label>
              <select id="user-role" class="form-select" v-model="form.role" required>
                <option value="">Select role</option>
                <option value="manager">Manager</option>
                <option value="sales_agent">Sales Agent</option>
              </select>
              <small class="text-muted">Users are created for your branch only.</small>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="user-branch">Branch</label>
              <input id="user-branch" type="text" class="form-control" :value="user.branch" disabled />
            </div>
            <div class="col-md-6">
              <label class="form-label" for="user-password">Password {{ editingId ? '' : '*' }}</label>
              <input
                id="user-password"
                type="password"
                class="form-control"
                v-model="form.password"
                :required="!editingId"
                placeholder="Leave blank to keep current password"
              />
            </div>
          </div>

          <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
          <div v-if="success" class="alert alert-success mt-3">{{ success }}</div>

          <div class="mt-4">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
              {{ editingId ? 'Update User' : 'Create User' }}
            </button>
            <button
              v-if="editingId"
              type="button"
              class="btn btn-outline-secondary ms-2"
              @click="cancelEdit"
            >
              Cancel Edit
            </button>
          </div>
        </form>
      </div>
    </div>

    <ConfirmDialog
      :show="deleteDialog.show"
      title="Delete User"
      :message="`Delete user ${deleteDialog.userName}? This action cannot be undone.`"
      confirm-text="Delete"
      :busy="deleteDialog.processing"
      @cancel="closeDeleteDialog"
      @confirm="confirmDeleteUser"
    />
  </div>
</template>

<script>
import { authAPI } from '../services/api';
import ConfirmDialog from '../components/common/ConfirmDialog.vue';

export default {
  name: 'Users',
  components: {
    ConfirmDialog
  },
  data() {
    return {
      user: {},
      users: [],
      loadingList: false,
      editingId: null,
      showForm: false,
      form: {
        name: '',
        username: '',
        password: '',
        role: ''
      },
      loading: false,
      error: '',
      success: '',
      deleteDialog: {
        show: false,
        userId: '',
        userName: '',
        processing: false
      }
    };
  },
  async created() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    await this.loadUsers();
  },
  methods: {
    // Handle load users.
    async loadUsers() {
      this.loadingList = true;
      try {
        const response = await authAPI.listUsers();
        this.users = response.data;
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        this.loadingList = false;
      }
    },
    async handleSubmit() {
      this.loading = true;
      this.error = '';
      this.success = '';

      try {
        if (this.editingId) {
          // Configure payload.
          const payload = {
            name: this.form.name,
            username: this.form.username,
            role: this.form.role
          };
          if (this.form.password) {
            payload.password = this.form.password;
          }
          await authAPI.updateUser(this.editingId, payload);
          this.success = 'User updated successfully!';
        } else {
          await authAPI.register(this.form);
          this.success = 'User created successfully!';
        }
        this.resetForm();
        await this.loadUsers();
      } catch (error) {
        this.error =
          error.response?.data?.message ||
          (this.editingId ? 'Failed to update user' : 'Failed to create user');
      } finally {
        this.loading = false;
      }
    },
    startEdit(item) {
      this.editingId = item._id;
      this.showForm = true;
      this.form = {
        name: item.name,
        username: item.username,
        password: '',
        role: item.role
      };
      this.error = '';
      this.success = '';
    },
    cancelEdit() {
      this.resetForm();
    },
    openDeleteDialog(item) {
      this.deleteDialog = {
        show: true,
        userId: item._id,
        userName: item.name,
        processing: false
      };
    },
    closeDeleteDialog() {
      if (this.deleteDialog.processing) return;
      this.deleteDialog.show = false;
    },
    async confirmDeleteUser() {
      if (!this.deleteDialog.userId) return;
      this.deleteDialog.processing = true;
      try {
        await authAPI.deleteUser(this.deleteDialog.userId);
        if (this.editingId === this.deleteDialog.userId) {
          this.resetForm();
        }
        await this.loadUsers();
        this.success = 'User deleted successfully!';
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete user';
      } finally {
        this.deleteDialog.processing = false;
        this.deleteDialog.show = false;
      }
    },
    resetForm() {
      this.editingId = null;
      this.showForm = false;
      this.form = {
        name: '',
        username: '',
        password: '',
        role: ''
      };
    },
    toggleForm() {
      if (this.showForm && this.editingId) {
        this.resetForm();
      } else {
        this.showForm = !this.showForm;
      }
      this.error = '';
      this.success = '';
    },
    formatRole(role) {
      if (role === 'sales_agent') return 'Sales Agent';
      if (role === 'manager') return 'Manager';
      if (role === 'director') return 'Director';
      return role;
    }
  }
};
</script>
