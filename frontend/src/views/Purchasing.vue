<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">{{ $t('Purchasing') }}</h2>
      <p class="page-subtitle">{{ $t('Purchase orders, goods receipts, and the match against stock.') }}</p>
    </div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>

    <div class="card mb-3">
      <div class="card-header"><h5 class="mb-0">{{ $t('New order') }}</h5></div>
      <div class="card-body">
        <form class="row g-3" @submit.prevent="createOrder">
          <div class="col-md-4">
            <label class="form-label" for="po-supplier">{{ $t('Supplier') }}</label>
            <select id="po-supplier" v-model="form.supplierId" class="form-select" required>
              <option value="" disabled>Choose a supplier</option>
              <option v-for="supplier in suppliers" :key="supplier._id" :value="supplier._id">
                {{ supplier.name }} ({{ supplier.branch }})
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label" for="po-name">{{ $t('Produce') }}</label>
            <input id="po-name" v-model.trim="form.produceName" class="form-control" required />
          </div>
          <div class="col-md-2">
            <label class="form-label" for="po-type">{{ $t('Type') }}</label>
            <select id="po-type" v-model="form.produceType" class="form-select" required>
              <option v-for="produceType in produceTypes" :key="produceType" :value="produceType">{{ produceType }}</option>
            </select>
          </div>
          <div class="col-md-1">
            <label class="form-label" for="po-kg">Kg</label>
            <input id="po-kg" v-model.number="form.orderedKg" type="number" min="1" class="form-control" required />
          </div>
          <div class="col-md-2">
            <label class="form-label" for="po-cost">{{ $t('Unit cost') }}</label>
            <input id="po-cost" v-model.number="form.unitCostUgx" type="number" min="0" class="form-control" required />
          </div>
          <div class="col-12">
            <button class="btn btn-primary" type="submit" :disabled="submitting">{{ $t('Create draft') }}</button>
          </div>
        </form>
      </div>
    </div>

    <div class="card">
      <div class="card-header d-flex justify-content-between">
        <h5 class="mb-0">{{ $t('Orders') }}</h5>
        <button type="button" class="btn btn-outline-secondary btn-sm" @click="load">Refresh</button>
      </div>
      <div class="card-body table-responsive">
        <table class="table table-sm align-middle">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Status</th>
              <th>Lines</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order._id">
              <td>{{ order.supplier?.name || order.supplier }}</td>
              <td>{{ order.status }}</td>
              <td>{{ order.lines.map((line) => `${line.produceName} ${line.receivedKg}/${line.orderedKg} kg`).join(', ') }}</td>
              <td class="text-end text-nowrap">
                <button v-if="order.status === 'draft'" type="button" class="btn btn-sm btn-success me-1" @click="approve(order)">
                  {{ $t('Approve') }}
                </button>
                <button
                  v-if="order.status === 'approved' || order.status === 'partial'"
                  type="button"
                  class="btn btn-sm btn-outline-primary me-1"
                  @click="receive(order)"
                >
                  {{ $t('Receive') }}
                </button>
                <button type="button" class="btn btn-sm btn-outline-secondary" @click="match(order)">{{ $t('Match') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
        <pre v-if="matchResult" class="small bg-light p-3 mb-0">{{ matchResult }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import { procurementAPI, suppliersAPI } from '../services/api';

export default {
  name: 'Purchasing',
  data() {
    return {
      orders: [],
      suppliers: [],
      error: '',
      success: '',
      submitting: false,
      matchResult: '',
      produceTypes: ['Beans', 'Grain Maize', 'Cow peas', 'Groundnuts', 'Soybeans'],
      form: { supplierId: '', produceName: '', produceType: 'Beans', orderedKg: 1000, unitCostUgx: 8000 }
    };
  },
  mounted() {
    this.load();
  },
  methods: {
    async load() {
      try {
        const [orders, suppliers] = await Promise.all([procurementAPI.listOrders(), suppliersAPI.getAll()]);
        this.orders = Array.isArray(orders.data) ? orders.data : [];
        const supplierPayload = suppliers.data;
        this.suppliers = Array.isArray(supplierPayload) ? supplierPayload : supplierPayload?.items || [];
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load orders.';
      }
    },
    async createOrder() {
      this.submitting = true;
      this.error = '';
      try {
        await procurementAPI.createOrder({
          supplierId: this.form.supplierId,
          lines: [
            {
              produceName: this.form.produceName,
              produceType: this.form.produceType,
              orderedKg: this.form.orderedKg,
              unitCostUgx: this.form.unitCostUgx
            }
          ]
        });
        this.success = this.$t('Draft order created. A different person must approve it.');
        await this.load();
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to create the order.';
      } finally {
        this.submitting = false;
      }
    },
    async approve(order) {
      this.error = '';
      try {
        await procurementAPI.approveOrder(order._id);
        this.success = 'Order approved.';
        await this.load();
      } catch (err) {
        this.error = err.response?.data?.message || 'Approval failed.';
      }
    },
    async receive(order) {
      const lines = order.lines
        .map((line) => ({
          produceName: line.produceName,
          produceType: line.produceType,
          receivedKg: Number(line.orderedKg) - Number(line.receivedKg || 0)
        }))
        .filter((line) => line.receivedKg > 0);
      if (lines.length === 0) return;
      try {
        await procurementAPI.receiveOrder(order._id, { lines });
        this.success = this.$t('Goods received and stock updated.');
        await this.load();
      } catch (err) {
        this.error = err.response?.data?.message || 'Receipt failed.';
      }
    },
    async match(order) {
      try {
        const response = await procurementAPI.matchOrder(order._id);
        this.matchResult = JSON.stringify(response.data, null, 2);
      } catch (err) {
        this.error = err.response?.data?.message || 'Match failed.';
      }
    }
  }
};
</script>
