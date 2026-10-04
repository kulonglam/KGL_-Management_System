<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">Audit log</h2>
      <p class="page-subtitle">Recent create, update, and delete actions in your scope.</p>
    </div>
    <div class="card">
      <div class="card-body">
        <div v-if="loadError" class="alert alert-danger" role="alert">{{ loadError }}</div>
        <div v-if="loading" class="text-muted">Loading audit entries...</div>
        <div v-else-if="items.length === 0" class="empty-state">No audit entries yet.</div>
        <div v-else class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
                <th>Branch</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item._id">
                <td>{{ formatTime(item.createdAt) }}</td>
                <td>{{ item.actorName }} ({{ item.actorRole }})</td>
                <td>{{ item.action }}</td>
                <td>{{ item.entityType }} {{ item.entityId }}</td>
                <td>
                  <pre v-if="formatMetadata(item.metadata)" class="mb-0 small">{{ formatMetadata(item.metadata) }}</pre>
                  <span v-else>-</span>
                </td>
                <td>{{ item.branch || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <TablePagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-items="totalItems"
          :page-size="pageSize"
          :page-size-options="pageSizeOptions"
          id-prefix="audit-logs"
          @update:currentPage="goToPage"
          @update:pageSize="handlePageSizeUpdate"
        />
      </div>
    </div>
  </div>
</template>

<script>
import TablePagination from '../components/common/TablePagination.vue';
import { auditAPI } from '../services/api';
import { asListPayload } from '../utils/listPayload.js';
import { formatDisplayTimestamp } from '../utils/dateFormat.js';

export default {
  name: 'AuditLogs',
  components: { TablePagination },
  data() {
    return {
      items: [],
      loading: false,
      loadError: '',
      currentPage: 1,
      pageSize: 20,
      pageSizeOptions: [10, 20, 50, 100],
      totalItems: 0,
      totalPages: 1
    };
  },
  watch: {
    currentPage() {
      this.loadLogs();
    },
    pageSize() {
      if (this.currentPage !== 1) {
        this.currentPage = 1;
        return;
      }
      this.loadLogs();
    }
  },
  created() {
    this.loadLogs();
  },
  methods: {
    async loadLogs() {
      this.loading = true;
      this.loadError = '';
      try {
        const response = await auditAPI.list({ page: this.currentPage, limit: this.pageSize });
        const payload = asListPayload(response.data);
        this.items = payload.items;
        this.totalItems = payload.total;
        this.totalPages = payload.totalPages;
      } catch (error) {
        this.loadError = error.response?.data?.message || 'Failed to load audit logs.';
      } finally {
        this.loading = false;
      }
    },
    goToPage(page) {
      this.currentPage = Math.max(1, Math.min(this.totalPages, Number(page || 1)));
    },
    handlePageSizeUpdate(size) {
      this.pageSize = Number(size || 20);
    },
    formatTime: formatDisplayTimestamp,
    formatMetadata(metadata) {
      if (!metadata || typeof metadata !== 'object' || Object.keys(metadata).length === 0) {
        return '';
      }
      return JSON.stringify(metadata, null, 2);
    }
  }
};
</script>
