<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">Branches</h2>
      <p class="page-subtitle">Add a branch with its first manager, or deactivate extra branches.</p>
    </div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>
    <div class="card mb-4">
      <div class="card-header"><h5 class="mb-0">Create branch</h5></div>
      <div class="card-body">
        <form class="row g-3" @submit.prevent="handleCreate">
          <div class="col-md-6">
            <label class="form-label" for="branch-name">Branch name</label>
            <input id="branch-name" v-model.trim="form.name" class="form-control" required />
          </div>
          <div class="col-md-6">
            <label class="form-label" for="manager-name">Manager name</label>
            <input id="manager-name" v-model.trim="form.managerName" class="form-control" required />
          </div>
          <div class="col-md-6">
            <label class="form-label" for="manager-username">Manager username</label>
            <input id="manager-username" v-model.trim="form.managerUsername" class="form-control" required />
          </div>
          <div class="col-md-6">
            <label class="form-label" for="manager-password">Manager password</label>
            <input
              id="manager-password"
              v-model="form.managerPassword"
              type="password"
              class="form-control"
              minlength="10"
              required
            />
          </div>
          <div class="col-12">
            <button class="btn btn-primary" type="submit" :disabled="saving">Save branch</button>
          </div>
        </form>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h5 class="mb-0">Registered branches</h5></div>
      <div class="card-body">
        <ul class="mb-0 list-unstyled">
          <li
            v-for="branch in branches"
            :key="branch._id || branch.name"
            class="d-flex justify-content-between align-items-center py-2 border-bottom"
          >
            <span>
              {{ branch.name }}
              <span class="text-muted">{{ branch.isActive === false ? '(inactive)' : '' }}</span>
            </span>
            <button
              v-if="canDeactivate(branch)"
              type="button"
              class="btn btn-sm btn-outline-secondary"
              :disabled="saving"
              @click="toggleActive(branch)"
            >
              {{ branch.isActive === false ? 'Activate' : 'Deactivate' }}
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { branchAPI } from '../services/api';

export default {
  name: 'Branches',
  data() {
    return {
      branches: [],
      saving: false,
      error: '',
      success: '',
      form: { name: '', managerName: '', managerUsername: '', managerPassword: '' },
      defaultBranches: ['Maganjo', 'Matugga']
    };
  },
  async created() {
    await this.loadBranches();
  },
  methods: {
    canDeactivate(branch) {
      return branch?._id && !this.defaultBranches.includes(branch.name);
    },
    async toggleActive(branch) {
      this.saving = true;
      this.error = '';
      this.success = '';
      try {
        await branchAPI.update(branch._id, { isActive: branch.isActive === false });
        this.success = branch.isActive === false ? 'Branch activated.' : 'Branch deactivated.';
        await this.loadBranches();
      } catch (error) {
        this.error = error.response?.data?.message || 'Unable to update branch.';
      } finally {
        this.saving = false;
      }
    },
    async loadBranches() {
      const response = await branchAPI.list();
      this.branches = response.data?.items || [];
    },
    async handleCreate() {
      this.saving = true;
      this.error = '';
      this.success = '';
      try {
        await branchAPI.create(this.form);
        this.success = 'Branch created.';
        this.form = { name: '', managerName: '', managerUsername: '', managerPassword: '' };
        await this.loadBranches();
      } catch (error) {
        this.error = error.response?.data?.message || 'Unable to create branch.';
      } finally {
        this.saving = false;
      }
    }
  }
};
</script>
