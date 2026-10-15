<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">Stock operations</h2>
      <p class="page-subtitle">Movement ledger, branch transfers, adjustments, and stocktake.</p>
    </div>

    <ul class="nav nav-tabs mb-3 flex-wrap">
      <li v-for="tab in tabs" :key="tab.id" class="nav-item">
        <button
          type="button"
          class="nav-link"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </li>
    </ul>

    <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>
    <div v-if="success" class="alert alert-success" role="alert">{{ success }}</div>

    <!-- Movements -->
    <div v-show="activeTab === 'movements'" class="card">
      <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h5 class="mb-0">Movement ledger</h5>
        <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="loading" @click="loadMovements">
          Refresh
        </button>
      </div>
      <div class="card-body">
        <div class="data-toolbar mb-3">
          <select v-model="movementType" class="form-select form-select-sm" style="max-width: 14rem">
            <option value="">All types</option>
            <option v-for="type in movementTypes" :key="type" :value="type">{{ type }}</option>
          </select>
        </div>
        <div class="table-responsive">
          <table class="table table-sm align-middle">
            <thead>
              <tr>
                <th>When</th>
                <th>Type</th>
                <th>Branch</th>
                <th>Produce</th>
                <th class="text-end">Qty (kg)</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!loading && movements.length === 0">
                <td colspan="6" class="text-muted">No movements yet.</td>
              </tr>
              <tr v-for="row in movements" :key="row._id">
                <td>{{ formatTime(row.createdAt) }}</td>
                <td><span class="badge text-bg-light">{{ row.type }}</span></td>
                <td>{{ row.branch }}</td>
                <td>{{ row.produceName }} ({{ row.produceType }})</td>
                <td class="text-end" :class="row.qtyKg < 0 ? 'text-danger' : 'text-success'">
                  {{ formatKg(row.qtyKg) }}
                </td>
                <td>{{ row.note || row.reasonCode || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Transfers -->
    <div v-show="activeTab === 'transfers'">
      <div class="card mb-3">
        <div class="card-header"><h5 class="mb-0">New transfer</h5></div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label" for="transfer-from">From</label>
              <select
                v-if="user.role === 'director'"
                id="transfer-from"
                v-model="transferForm.fromBranch"
                class="form-select"
              >
                <option value="">Select branch</option>
                <option v-for="branch in branchOptions" :key="`from-${branch}`" :value="branch">{{ branch }}</option>
              </select>
              <input v-else id="transfer-from" type="text" class="form-control" :value="user.branch" disabled />
            </div>
            <div class="col-md-4">
              <label class="form-label" for="transfer-to">To branch</label>
              <select id="transfer-to" v-model="transferForm.toBranch" class="form-select" required>
                <option value="">Select branch</option>
                <option v-for="branch in destinationBranches" :key="branch" :value="branch">{{ branch }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label" for="transfer-note">Note</label>
              <input id="transfer-note" v-model="transferForm.note" type="text" class="form-control" maxlength="500" />
            </div>
            <div class="col-md-4">
              <label class="form-label" for="transfer-produce">Produce</label>
              <select id="transfer-produce" v-model="transferForm.produceKey" class="form-select" @change="onTransferProduce">
                <option value="">Select produce</option>
                <option
                  v-for="item in inventory"
                  :key="`${item.produceName}-${item.produceType}`"
                  :value="`${item.produceName}::${item.produceType}`"
                >
                  {{ item.produceName }} ({{ item.produceType }}) — {{ formatKg(item.totalTonnageKg) }} kg
                </option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label" for="transfer-kg">Tonnage (kg)</label>
              <input id="transfer-kg" v-model.number="transferForm.tonnageKg" type="number" min="1" class="form-control" />
            </div>
            <div class="col-md-4 d-flex align-items-end">
              <button type="button" class="btn btn-primary" :disabled="submitting" @click="createTransfer">
                Create draft
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Transfers</h5>
          <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="loading" @click="loadTransfers">
            Refresh
          </button>
        </div>
        <div class="card-body table-responsive">
          <table class="table table-sm align-middle">
            <thead>
              <tr>
                <th>Created</th>
                <th>Route</th>
                <th>Status</th>
                <th>Lines</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!loading && transfers.length === 0">
                <td colspan="5" class="text-muted">No transfers yet.</td>
              </tr>
              <tr v-for="row in transfers" :key="row._id">
                <td>{{ formatTime(row.createdAt) }}</td>
                <td>{{ row.fromBranch }} → {{ row.toBranch }}</td>
                <td><span class="badge text-bg-secondary">{{ row.status }}</span></td>
                <td>
                  <div v-for="(line, idx) in row.lines" :key="idx">
                    {{ line.produceName }} {{ formatKg(line.tonnageKg) }} kg
                  </div>
                </td>
                <td class="text-end text-nowrap">
                  <button
                    v-if="row.status === 'draft' && (user.role === 'director' || row.fromBranch === user.branch)"
                    type="button"
                    class="btn btn-sm btn-outline-primary me-1"
                    @click="shipTransfer(row._id)"
                  >
                    Ship
                  </button>
                  <button
                    v-if="row.status === 'in_transit' && (user.role === 'director' || row.toBranch === user.branch)"
                    type="button"
                    class="btn btn-sm btn-outline-success me-1"
                    @click="receiveTransfer(row._id)"
                  >
                    Receive
                  </button>
                  <button
                    v-if="['draft', 'in_transit'].includes(row.status)"
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    @click="cancelTransfer(row._id)"
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Adjustments -->
    <div v-show="activeTab === 'adjustments'">
      <div class="card mb-3">
        <div class="card-header">
          <h5 class="mb-0">New adjustment</h5>
          <small class="text-muted">
            Changes of {{ approvalThresholdKg }} kg or more need a second approver.
          </small>
        </div>
        <div class="card-body">
          <div class="row g-3">
            <div class="col-md-3">
              <label class="form-label" for="adj-produce">Produce</label>
              <select id="adj-produce" v-model="adjustmentForm.produceKey" class="form-select" @change="onAdjProduce">
                <option value="">Select produce</option>
                <option
                  v-for="item in inventory"
                  :key="`adj-${item.produceName}-${item.produceType}`"
                  :value="`${item.produceName}::${item.produceType}`"
                >
                  {{ item.produceName }} ({{ item.produceType }})
                </option>
              </select>
            </div>
            <div class="col-md-2">
              <label class="form-label" for="adj-delta">Delta (kg)</label>
              <input id="adj-delta" v-model.number="adjustmentForm.deltaKg" type="number" class="form-control" />
            </div>
            <div class="col-md-2">
              <label class="form-label" for="adj-reason">Reason</label>
              <select id="adj-reason" v-model="adjustmentForm.reasonCode" class="form-select">
                <option v-for="code in reasonCodes" :key="code" :value="code">{{ code }}</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label" for="adj-note">Note</label>
              <input id="adj-note" v-model="adjustmentForm.note" type="text" class="form-control" required maxlength="500" />
            </div>
            <div class="col-md-2 d-flex align-items-end">
              <button type="button" class="btn btn-primary w-100" :disabled="submitting" @click="createAdjustment">
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Adjustments</h5>
          <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="loading" @click="loadAdjustments">
            Refresh
          </button>
        </div>
        <div class="card-body table-responsive">
          <table class="table table-sm align-middle">
            <thead>
              <tr>
                <th>When</th>
                <th>Produce</th>
                <th class="text-end">Delta</th>
                <th>Reason</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!loading && adjustments.length === 0">
                <td colspan="6" class="text-muted">No adjustments yet.</td>
              </tr>
              <tr v-for="row in adjustments" :key="row._id">
                <td>{{ formatTime(row.createdAt) }}</td>
                <td>{{ row.produceName }} ({{ row.produceType }})</td>
                <td class="text-end">{{ formatKg(row.deltaKg) }}</td>
                <td>{{ row.reasonCode }}</td>
                <td><span class="badge text-bg-light">{{ row.status }}</span></td>
                <td class="text-end text-nowrap">
                  <template v-if="row.status === 'pending'">
                    <button type="button" class="btn btn-sm btn-outline-success me-1" @click="approveAdjustment(row._id)">
                      Approve
                    </button>
                    <button type="button" class="btn btn-sm btn-outline-danger" @click="rejectAdjustment(row._id)">
                      Reject
                    </button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Stocktake -->
    <div v-show="activeTab === 'stocktake'">
      <div class="card mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Stocktake sessions</h5>
          <button type="button" class="btn btn-primary btn-sm" :disabled="submitting" @click="startStocktake">
            Start stocktake
          </button>
        </div>
        <div class="card-body">
          <div v-if="stocktakes.length === 0" class="text-muted mb-3">No stocktake sessions yet.</div>
          <div class="list-group mb-3">
            <button
              v-for="session in stocktakes"
              :key="session._id"
              type="button"
              class="list-group-item list-group-item-action d-flex justify-content-between"
              :class="{ active: activeStocktakeId === session._id }"
              @click="openStocktake(session._id)"
            >
              <span>{{ formatTime(session.createdAt) }} · {{ session.branch }}</span>
              <span class="badge text-bg-secondary">{{ session.status }}</span>
            </button>
          </div>

          <div v-if="activeStocktake">
            <div class="table-responsive">
              <table class="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Produce</th>
                    <th class="text-end">System kg</th>
                    <th class="text-end">Counted kg</th>
                    <th class="text-end">Variance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(line, idx) in activeStocktake.lines" :key="`${line.produceName}-${line.produceType}`">
                    <td>{{ line.produceName }} ({{ line.produceType }})</td>
                    <td class="text-end">{{ formatKg(line.systemKg) }}</td>
                    <td class="text-end" style="max-width: 8rem">
                      <input
                        v-if="activeStocktake.status === 'draft'"
                        v-model="countDraft[idx]"
                        type="number"
                        min="0"
                        class="form-control form-control-sm text-end"
                        placeholder="—"
                      />
                      <span v-else>{{ line.countedKg == null ? '—' : formatKg(line.countedKg) }}</span>
                    </td>
                    <td class="text-end">
                      {{
                        activeStocktake.status === 'draft'
                          ? formatVariance(countDraft[idx], line.systemKg)
                          : formatKg(line.varianceKg)
                      }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="activeStocktake.status === 'draft'" class="d-flex flex-wrap gap-2">
              <button type="button" class="btn btn-outline-secondary" :disabled="submitting" @click="downloadCountSheet">
                <i class="bi bi-download me-1"></i>Count sheet (CSV)
              </button>
              <button type="button" class="btn btn-outline-primary" :disabled="submitting" @click="saveStocktakeCounts">
                Save counts
              </button>
              <button type="button" class="btn btn-success" :disabled="submitting" @click="postStocktake">
                Post variances
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia';
import { useAuthStore } from '../stores/auth';
import { inventoryAPI, inventoryOpsAPI } from '../services/api';
import { asListPayload } from '../utils/listPayload.js';
import { downloadReportFile } from '../utils/downloadFile.js';
import { formatDisplayTimestamp } from '../utils/dateFormat.js';
import { PRICE_PRODUCE_TYPES } from '../utils/pricing/priceManagement.js';

const BRANCH_OPTIONS = ['Maganjo', 'Matugga'];

export default {
  name: 'InventoryOps',
  data() {
    return {
      activeTab: 'movements',
      loading: false,
      submitting: false,
      error: '',
      success: '',
      inventory: [],
      movements: [],
      movementType: '',
      movementTypes: [
        'procurement_in',
        'procurement_out',
        'sale_out',
        'credit_out',
        'void_in',
        'transfer_out',
        'transfer_in',
        'adjustment',
        'stocktake'
      ],
      transfers: [],
      branchOptions: BRANCH_OPTIONS,
      transferForm: {
        fromBranch: '',
        toBranch: '',
        note: '',
        produceKey: '',
        produceName: '',
        produceType: '',
        tonnageKg: null
      },
      adjustments: [],
      reasonCodes: ['damage', 'shrinkage', 'found', 'correction', 'other'],
      approvalThresholdKg: 500,
      adjustmentForm: {
        produceKey: '',
        produceName: '',
        produceType: PRICE_PRODUCE_TYPES[0],
        deltaKg: null,
        reasonCode: 'correction',
        note: ''
      },
      stocktakes: [],
      activeStocktakeId: null,
      activeStocktake: null,
      countDraft: []
    };
  },
  computed: {
    ...mapState(useAuthStore, ['user']),
    tabs() {
      const all = [
        { id: 'movements', label: 'Movements' },
        { id: 'transfers', label: 'Transfers' },
        { id: 'adjustments', label: 'Adjustments' },
        { id: 'stocktake', label: 'Stocktake' }
      ];
      if (this.user?.role === 'sales_agent') {
        return all.filter((tab) => tab.id === 'movements');
      }
      return all;
    },
    destinationBranches() {
      const from = this.user?.role === 'director' ? this.transferForm.fromBranch : this.user?.branch;
      return BRANCH_OPTIONS.filter((branch) => branch !== from);
    }
  },
  watch: {
    activeTab(tab) {
      this.error = '';
      this.success = '';
      if (tab === 'movements') this.loadMovements();
      if (tab === 'transfers') this.loadTransfers();
      if (tab === 'adjustments') this.loadAdjustments();
      if (tab === 'stocktake') this.loadStocktakes();
    },
    movementType() {
      if (this.activeTab === 'movements') this.loadMovements();
    }
  },
  async mounted() {
    await this.loadInventory();
    await this.loadMovements();
  },
  methods: {
    formatTime: formatDisplayTimestamp,
    formatKg(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) return '—';
      return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
    },
    formatVariance(counted, systemKg) {
      if (counted === '' || counted === null || counted === undefined) return '—';
      const n = Number(counted);
      if (!Number.isFinite(n)) return '—';
      return this.formatKg(n - Number(systemKg || 0));
    },
    clearFlash() {
      this.error = '';
      this.success = '';
    },
    async loadInventory() {
      try {
        const response = await inventoryAPI.get();
        this.inventory = Array.isArray(response.data?.inventory) ? response.data.inventory : [];
      } catch {
        this.inventory = [];
      }
    },
    onTransferProduce() {
      const [produceName, produceType] = String(this.transferForm.produceKey || '').split('::');
      this.transferForm.produceName = produceName || '';
      this.transferForm.produceType = produceType || '';
    },
    onAdjProduce() {
      const [produceName, produceType] = String(this.adjustmentForm.produceKey || '').split('::');
      this.adjustmentForm.produceName = produceName || '';
      this.adjustmentForm.produceType = produceType || '';
    },
    async loadMovements() {
      this.loading = true;
      this.clearFlash();
      try {
        const response = await inventoryOpsAPI.listMovements({
          type: this.movementType || undefined,
          page: 1,
          limit: 100
        });
        this.movements = asListPayload(response.data).items;
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load movements.';
      } finally {
        this.loading = false;
      }
    },
    async loadTransfers() {
      this.loading = true;
      this.clearFlash();
      try {
        const response = await inventoryOpsAPI.listTransfers({ page: 1, limit: 50 });
        this.transfers = asListPayload(response.data).items;
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load transfers.';
      } finally {
        this.loading = false;
      }
    },
    async createTransfer() {
      this.submitting = true;
      this.clearFlash();
      try {
        if (!this.transferForm.toBranch || !this.transferForm.produceName || !(this.transferForm.tonnageKg > 0)) {
          this.error = 'Destination, produce, and tonnage are required.';
          return;
        }
        await inventoryOpsAPI.createTransfer({
          fromBranch:
            this.user.role === 'director' ? this.transferForm.fromBranch : this.user.branch,
          toBranch: this.transferForm.toBranch,
          note: this.transferForm.note,
          lines: [
            {
              produceName: this.transferForm.produceName,
              produceType: this.transferForm.produceType,
              tonnageKg: this.transferForm.tonnageKg
            }
          ]
        });
        this.success = 'Transfer draft created.';
        this.transferForm.tonnageKg = null;
        this.transferForm.note = '';
        await this.loadTransfers();
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to create transfer.';
      } finally {
        this.submitting = false;
      }
    },
    async shipTransfer(id) {
      this.clearFlash();
      try {
        await inventoryOpsAPI.shipTransfer(id);
        this.success = 'Transfer shipped.';
        await Promise.all([this.loadTransfers(), this.loadInventory()]);
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to ship transfer.';
      }
    },
    async receiveTransfer(id) {
      this.clearFlash();
      try {
        await inventoryOpsAPI.receiveTransfer(id);
        this.success = 'Transfer received.';
        await Promise.all([this.loadTransfers(), this.loadInventory()]);
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to receive transfer.';
      }
    },
    async cancelTransfer(id) {
      this.clearFlash();
      try {
        await inventoryOpsAPI.cancelTransfer(id);
        this.success = 'Transfer cancelled.';
        await Promise.all([this.loadTransfers(), this.loadInventory()]);
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to cancel transfer.';
      }
    },
    async loadAdjustments() {
      this.loading = true;
      this.clearFlash();
      try {
        const response = await inventoryOpsAPI.listAdjustments({ page: 1, limit: 50 });
        const payload = response.data;
        this.adjustments = asListPayload(payload).items;
        if (payload?.meta?.reasonCodes) this.reasonCodes = payload.meta.reasonCodes;
        if (payload?.meta?.approvalThresholdKg) this.approvalThresholdKg = payload.meta.approvalThresholdKg;
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load adjustments.';
      } finally {
        this.loading = false;
      }
    },
    async createAdjustment() {
      this.submitting = true;
      this.clearFlash();
      try {
        if (!this.adjustmentForm.produceName || !this.adjustmentForm.note || !this.adjustmentForm.deltaKg) {
          this.error = 'Produce, non-zero delta, and note are required.';
          return;
        }
        const created = await inventoryOpsAPI.createAdjustment({
          produceName: this.adjustmentForm.produceName,
          produceType: this.adjustmentForm.produceType,
          deltaKg: this.adjustmentForm.deltaKg,
          reasonCode: this.adjustmentForm.reasonCode,
          note: this.adjustmentForm.note
        });
        this.success =
          created.data?.status === 'pending'
            ? 'Adjustment submitted for approval.'
            : 'Adjustment applied.';
        this.adjustmentForm.deltaKg = null;
        this.adjustmentForm.note = '';
        await Promise.all([this.loadAdjustments(), this.loadInventory()]);
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to create adjustment.';
      } finally {
        this.submitting = false;
      }
    },
    async approveAdjustment(id) {
      this.clearFlash();
      try {
        await inventoryOpsAPI.approveAdjustment(id);
        this.success = 'Adjustment approved.';
        await Promise.all([this.loadAdjustments(), this.loadInventory()]);
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to approve adjustment.';
      }
    },
    async rejectAdjustment(id) {
      this.clearFlash();
      try {
        await inventoryOpsAPI.rejectAdjustment(id);
        this.success = 'Adjustment rejected.';
        await this.loadAdjustments();
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to reject adjustment.';
      }
    },
    async loadStocktakes() {
      this.loading = true;
      this.clearFlash();
      try {
        const response = await inventoryOpsAPI.listStocktakes();
        const data = response.data;
        this.stocktakes = Array.isArray(data) ? data : asListPayload(data).items;
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load stocktakes.';
      } finally {
        this.loading = false;
      }
    },
    async startStocktake() {
      this.submitting = true;
      this.clearFlash();
      try {
        const response = await inventoryOpsAPI.createStocktake({ note: 'Cycle count' });
        this.success = 'Stocktake session started.';
        await this.loadStocktakes();
        await this.openStocktake(response.data._id);
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to start stocktake.';
      } finally {
        this.submitting = false;
      }
    },
    async openStocktake(id) {
      this.activeStocktakeId = id;
      try {
        const response = await inventoryOpsAPI.getStocktake(id);
        this.activeStocktake = response.data;
        this.countDraft = (this.activeStocktake.lines || []).map((line) =>
          line.countedKg == null ? '' : line.countedKg
        );
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to open stocktake.';
      }
    },
    async downloadCountSheet() {
      if (!this.activeStocktake) return;
      this.error = '';
      try {
        const response = await inventoryOpsAPI.getStocktakeCountSheet(this.activeStocktake._id);
        downloadReportFile({
          filename: `stocktake-${this.activeStocktake.branch}-${this.activeStocktake._id}.csv`,
          content: response.data,
          type: 'text/csv;charset=utf-8'
        });
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to download count sheet.';
      }
    },
    async saveStocktakeCounts() {
      if (!this.activeStocktake) return;
      this.submitting = true;
      this.clearFlash();
      try {
        const lines = this.activeStocktake.lines.map((line, idx) => ({
          produceName: line.produceName,
          produceType: line.produceType,
          countedKg: this.countDraft[idx] === '' ? null : Number(this.countDraft[idx])
        }));
        const response = await inventoryOpsAPI.updateStocktake(this.activeStocktake._id, { lines });
        this.activeStocktake = response.data;
        this.success = 'Counts saved.';
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to save counts.';
      } finally {
        this.submitting = false;
      }
    },
    async postStocktake() {
      if (!this.activeStocktake) return;
      await this.saveStocktakeCounts();
      this.submitting = true;
      this.clearFlash();
      try {
        const response = await inventoryOpsAPI.postStocktake(this.activeStocktake._id);
        this.activeStocktake = response.data;
        this.success = 'Stocktake posted.';
        await Promise.all([this.loadStocktakes(), this.loadInventory(), this.loadMovements()]);
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to post stocktake.';
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>
