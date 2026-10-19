<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">Group</h2>
      <p class="page-subtitle">Companies, the branches inside them, foreign rates, and the stock transfers that cancel out inside one company.</p>
    </div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <div class="card mb-3">
      <div class="card-header"><h5 class="mb-0">Companies</h5></div>
      <div class="card-body">
        <form class="row g-2 mb-3" @submit.prevent="createEntity">
          <div class="col-md-4">
            <input v-model.trim="entityForm.name" class="form-control" placeholder="Company name" required />
          </div>
          <div class="col-md-3">
            <input v-model.trim="entityForm.tin" class="form-control" placeholder="TIN" />
          </div>
          <div class="col-md-3">
            <input v-model.trim="entityForm.address" class="form-control" placeholder="Address" />
          </div>
          <div class="col-md-2">
            <button class="btn btn-primary w-100" type="submit">Add company</button>
          </div>
        </form>
        <div v-for="entity in entities" :key="entity._id" class="border rounded p-3 mb-2">
          <div class="d-flex justify-content-between">
            <strong>{{ entity.name }}</strong>
            <button type="button" class="btn btn-sm btn-outline-secondary" @click="consolidate(entity)">Totals</button>
          </div>
          <div class="small text-muted">{{ entity.tin || 'No TIN' }} · {{ entity.baseCurrency || 'UGX' }}</div>
          <div class="mt-1">{{ (entity.branches || []).map((branch) => branch.name).join(', ') || 'No branches yet' }}</div>
        </div>
        <pre v-if="totals" class="small bg-light p-3 mb-0">{{ totals }}</pre>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header"><h5 class="mb-0">Put a branch in a company</h5></div>
      <div class="card-body">
        <form class="row g-2" @submit.prevent="assign">
          <div class="col-md-5">
            <select v-model="assignForm.entityId" class="form-select" required>
              <option value="" disabled>Company</option>
              <option v-for="entity in entities" :key="entity._id" :value="entity._id">{{ entity.name }}</option>
            </select>
          </div>
          <div class="col-md-5">
            <select v-model="assignForm.branchId" class="form-select" required>
              <option value="" disabled>Branch</option>
              <option v-for="branch in branches" :key="branch._id" :value="branch._id">{{ branch.name }}</option>
            </select>
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-primary w-100" type="submit">Assign</button>
          </div>
        </form>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header"><h5 class="mb-0">Exchange rates to UGX</h5></div>
      <div class="card-body">
        <p v-for="rate in rates" :key="rate.code" class="mb-1">
          {{ rate.code }}: {{ rate.rateToUgx == null ? 'not set' : rate.rateToUgx }}
          <span v-if="rate.effectiveOn" class="text-muted">from {{ rate.effectiveOn }}</span>
        </p>
        <form class="row g-2 mt-2" @submit.prevent="saveRate">
          <div class="col-md-3">
            <select v-model="rateForm.code" class="form-select">
              <option>USD</option>
              <option>KES</option>
              <option>EUR</option>
              <option>GBP</option>
            </select>
          </div>
          <div class="col-md-4">
            <input v-model.number="rateForm.rateToUgx" type="number" min="0.0001" step="0.0001" class="form-control" placeholder="UGX per 1 unit" required />
          </div>
          <div class="col-md-3">
            <button class="btn btn-primary" type="submit">Save rate</button>
          </div>
        </form>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h5 class="mb-0">Live API processes</h5></div>
      <div class="card-body">
        <p class="mb-2">{{ instanceNote }}</p>
        <p v-if="instances.length === 0" class="mb-0 text-muted">No process has reported in the last minute. The server records itself after it starts.</p>
        <ul v-else class="mb-0">
          <li v-for="instance in instances" :key="instance.instanceId">
            {{ instance.hostname }} · pid {{ instance.pid }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { branchAPI, financeAPI, organizationAPI, platformAPI } from '../services/api';

export default {
  name: 'Organization',
  data() {
    return {
      entities: [],
      branches: [],
      rates: [],
      instances: [],
      instanceNote: '',
      totals: '',
      error: '',
      success: '',
      entityForm: { name: '', tin: '', address: '' },
      assignForm: { entityId: '', branchId: '' },
      rateForm: { code: 'USD', rateToUgx: null }
    };
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      this.error = '';
      try {
        const [entities, branches, rates, instances] = await Promise.all([
          organizationAPI.listEntities(),
          branchAPI.list(),
          financeAPI.listExchangeRates(),
          platformAPI.listInstances()
        ]);
        this.entities = Array.isArray(entities.data) ? entities.data : [];
        this.branches = branches.data?.items || [];
        this.rates = rates.data?.rates || [];
        this.instances = instances.data?.instances || [];
        this.instanceNote = instances.data?.note || '';
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load the group.';
      }
    },
    async createEntity() {
      this.error = '';
      try {
        await organizationAPI.createEntity(this.entityForm);
        this.success = 'Company added.';
        this.entityForm = { name: '', tin: '', address: '' };
        await this.load();
      } catch (err) {
        this.error = err.response?.data?.message || 'Could not add the company.';
      }
    },
    async assign() {
      this.error = '';
      try {
        await organizationAPI.assignBranch(this.assignForm.entityId, this.assignForm.branchId);
        this.success = 'Branch assigned.';
        await this.load();
      } catch (err) {
        this.error = err.response?.data?.message || 'Could not assign the branch.';
      }
    },
    async consolidate(entity) {
      this.error = '';
      try {
        const response = await organizationAPI.consolidation(entity._id);
        const row = response.data || {};
        this.totals = `${row.entity}: cash sales ${row.cashSalesUgx} UGX, open receivables ${row.openReceivablesUgx} UGX`;
      } catch (err) {
        this.error = err.response?.data?.message || 'Could not total the company.';
      }
    },
    async saveRate() {
      this.error = '';
      try {
        await financeAPI.setExchangeRate(this.rateForm);
        this.success = 'Rate saved. Books stay in UGX.';
        await this.load();
      } catch (err) {
        this.error = err.response?.data?.message || 'Could not save the rate.';
      }
    }
  }
};
</script>
