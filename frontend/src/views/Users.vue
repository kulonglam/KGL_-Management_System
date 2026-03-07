<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">Staff Management</h2>
      <p class="page-subtitle">Create and maintain branch user accounts.</p>
    </div>

    <div
      v-if="loadError"
      class="alert alert-danger d-flex align-items-start justify-content-between gap-3"
      role="alert"
    >
      <span>{{ loadError }}</span>
      <button
        type="button"
        class="btn btn-sm btn-outline-danger"
        :disabled="loadingList"
        @click="loadUsers"
      >
        Retry
      </button>
    </div>

    <div v-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>
    <div v-if="success" class="alert alert-success" role="status">
      {{ success }}
    </div>

    <InsightStrip label="Staff overview" :items="overviewItems" />

    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Users</h5>
        <div class="d-flex gap-2">
          <button class="btn btn-primary btn-sm" @click="toggleForm">
            {{ showForm ? 'Close' : 'New User' }}
          </button>
          <button class="btn btn-outline-primary btn-sm" @click="loadUsers" :disabled="loadingList">
            <span v-if="loadingList" class="spinner-border spinner-border-sm me-2"></span>
            Refresh
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="data-toolbar">
          <div class="data-toolbar-group">
            <div class="data-toolbar-field">
              <label class="form-label mb-1" for="users-search">Search</label>
              <input
                id="users-search"
                v-model.trim="searchQuery"
                type="text"
                class="form-control form-control-sm"
                placeholder="Name, username, role..."
              />
            </div>
            <div class="data-toolbar-field">
              <label class="form-label mb-1" for="users-role-filter">Role</label>
              <select id="users-role-filter" v-model="roleFilter" class="form-select form-select-sm">
                <option value="all">All roles</option>
                <option value="manager">Manager</option>
                <option value="sales_agent">Sales Agent</option>
              </select>
            </div>
            <div class="data-toolbar-field">
              <label class="form-label mb-1" for="users-sort">Sort By</label>
              <select id="users-sort" v-model="sortBy" class="form-select form-select-sm">
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="recent">Recently created</option>
              </select>
            </div>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            :disabled="!searchQuery && roleFilter === 'all' && sortBy === 'name_asc'"
            @click="resetTableFilters"
          >
            Reset Filters
          </button>
        </div>

        <div v-if="loadingList" class="text-center py-5 text-muted">Loading users...</div>
        <div v-else-if="users.length === 0" class="empty-state">
          No users found for this branch.
        </div>
        <div v-else-if="displayedUsers.length === 0" class="empty-state">
          No users match your current filters.
        </div>
        <div v-else class="table-responsive">
          <table class="table align-middle table-sticky table-row-hover responsive-stack-table">
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
              <tr v-for="item in paginatedUsers" :key="item._id">
                <td data-label="Name">{{ item.name }}</td>
                <td data-label="Username">{{ item.username }}</td>
                <td data-label="Role">{{ formatRole(item.role) }}</td>
                <td data-label="Branch">{{ item.branch || '-' }}</td>
                <td data-label="Actions" class="text-end">
                  <div class="record-row-actions justify-content-end">
                    <button class="btn btn-sm btn-outline-primary" @click="startEdit(item)">
                      Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="openDeleteDialog(item)">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          :current-page="currentPage"
          :total-pages="totalUserPages"
          :total-items="displayedUsers.length"
          :page-size="pageSize"
          :page-size-options="pageSizeOptions"
          id-prefix="users-table"
          @update:currentPage="goToPage"
          @update:pageSize="handlePageSizeUpdate"
        />
      </div>
    </div>

    <div v-if="showForm" class="modal-mask" @click.self="toggleForm">
      <div class="modal-card user-editor-modal" role="dialog" aria-modal="true" aria-labelledby="user-form-title">
        <div class="modal-header">
          <h5 id="user-form-title" class="mb-0">{{ editingId ? 'Update User' : 'Create New User' }}</h5>
          <button type="button" class="btn-close" aria-label="Close user form" :disabled="loading" @click="toggleForm"></button>
        </div>
        <div class="modal-body">
          <p class="text-muted small mb-3">
            Create staff accounts for your branch or update the details of an existing user.
          </p>
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
              <input
                id="user-branch"
                type="text"
                class="form-control readonly-display"
                :value="user.branch"
                disabled
              />
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

          <div v-if="error" class="alert alert-danger mt-3 mb-0">{{ error }}</div>

          <div class="form-action-bar">
            <div class="form-action-copy">
              <strong>Branch staffing stays role-based and branch-specific.</strong>
              <span>Create a new user or update account details for the selected staff member.</span>
            </div>
            <div class="form-action-buttons">
              <button
                type="button"
                class="btn btn-outline-secondary"
                :disabled="loading"
                @click="toggleForm"
              >
                Cancel
              </button>
              <button type="submit" class="btn btn-success" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                {{ editingId ? 'Update User' : 'Create User' }}
              </button>
            </div>
          </div>
        </form>
      </div>
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
/**
 * Branch user administration page for creating, updating, filtering, and deleting staff accounts.
 * File: frontend/src/views/Users.vue
 */

import { authAPI } from '../services/api';
import ConfirmDialog from '../components/common/ConfirmDialog.vue';
import InsightStrip from '../components/common/InsightStrip.vue';
import TablePagination from '../components/common/TablePagination.vue';
import { pinia } from '../stores';
import { useAuthStore } from '../stores/auth';

export default {
  name: 'Users',
  components: {
    ConfirmDialog,
    InsightStrip,
    TablePagination
  },
  data() {
    return {
      user: {},
      users: [],
      loadingList: false,
      loadError: '',
      searchQuery: '',
      roleFilter: 'all',
      sortBy: 'name_asc',
      currentPage: 1,
      pageSize: 20,
      pageSizeOptions: [10, 20, 50, 100],
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
  computed: {
    // Build table rows as search -> role filter -> sort so state changes remain predictable.
    displayedUsers() {
      const query = this.searchQuery.trim().toLowerCase();
      const searched = this.users.filter((item) => {
        if (!query) return true;
        const haystack = [item.name, item.username, this.formatRole(item.role), item.branch]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });

      const filteredByRole =
        this.roleFilter === 'all'
          ? searched
          : searched.filter((item) => item.role === this.roleFilter);

      const sorted = [...filteredByRole];
      if (this.sortBy === 'name_desc') {
        sorted.sort((a, b) => String(b.name || '').localeCompare(String(a.name || '')));
      } else if (this.sortBy === 'recent') {
        sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      } else {
        sorted.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
      }
      return sorted;
    },
    totalUserPages() {
      return Math.max(1, Math.ceil(this.displayedUsers.length / this.pageSize));
    },
    paginatedUsers() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.displayedUsers.slice(start, start + this.pageSize);
    },
    managerCount() {
      return this.users.filter((item) => item.role === 'manager').length;
    },
    salesAgentCount() {
      return this.users.filter((item) => item.role === 'sales_agent').length;
    },
    overviewItems() {
      const visibleMeta =
        this.displayedUsers.length === this.users.length
          ? 'No filters applied'
          : `${this.displayedUsers.length.toLocaleString('en-UG')} visible after filters`;

      return [
        {
          label: 'Branch',
          value: this.user.branch || 'Unassigned',
          meta: 'Current staff workspace'
        },
        {
          label: 'Total Staff',
          value: this.users.length.toLocaleString('en-UG'),
          meta: visibleMeta
        },
        {
          label: 'Managers',
          value: this.managerCount.toLocaleString('en-UG'),
          meta: 'One manager required per branch'
        },
        {
          label: 'Sales Agents',
          value: this.salesAgentCount.toLocaleString('en-UG'),
          meta: 'Two attendants allowed per branch'
        }
      ];
    }
  },
  watch: {
    pageSize() {
      this.currentPage = 1;
    },
    users() {
      if (this.currentPage > this.totalUserPages) {
        this.currentPage = this.totalUserPages;
      }
    },
    searchQuery() {
      this.currentPage = 1;
    },
    roleFilter() {
      this.currentPage = 1;
    },
    sortBy() {
      this.currentPage = 1;
    }
  },
  async created() {
    const authStore = useAuthStore(pinia);
    this.user = authStore.user || {};
    await this.loadUsers();
  },
  methods: {
    // Load branch users visible to the current manager.
    async loadUsers() {
      this.loadingList = true;
      this.loadError = '';
      try {
        const response = await authAPI.listUsers();
        this.users = response.data;
      } catch (error) {
        this.loadError = error.response?.data?.message || 'Failed to load users.';
      } finally {
        this.loadingList = false;
      }
    },
    resetTableFilters() {
      this.searchQuery = '';
      this.roleFilter = 'all';
      this.sortBy = 'name_asc';
      this.currentPage = 1;
    },
    goToPage(page) {
      const nextPage = Math.max(1, Math.min(this.totalUserPages, Number(page || 1)));
      this.currentPage = nextPage;
    },
    handlePageSizeUpdate(size) {
      this.pageSize = Number(size || 20);
    },
    async handleSubmit() {
      this.loading = true;
      this.error = '';
      this.success = '';

      try {
        if (this.editingId) {
          // Update payload excludes immutable fields and optional password when blank.
          const payload = {
            name: this.form.name,
            username: this.form.username,
            role: this.form.role
          };
          // Password is optional during updates; omit it to keep the existing credential unchanged.
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
        // Reset editor when the row being edited is deleted from the same table session.
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
      if (this.loading) return;
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

<style scoped>
.user-editor-modal {
  max-width: 760px;
}
</style>

