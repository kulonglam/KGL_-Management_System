<template>
  <div class="view-shell">
    <div class="view-heading d-flex flex-wrap justify-content-between align-items-start gap-3">
      <div>
        <h2 class="page-title">Inbox</h2>
        <p class="page-subtitle">In-app notices such as overdue credit alerts.</p>
      </div>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-outline-secondary btn-sm" :disabled="loading" @click="loadMessages">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          Refresh
        </button>
        <button
          type="button"
          class="btn btn-outline-primary btn-sm"
          :disabled="loading || messages.length === 0"
          @click="markAllRead"
        >
          Acknowledge all
        </button>
      </div>
    </div>

    <div v-if="loadError" class="alert alert-danger" role="alert">{{ loadError }}</div>

    <div class="card">
      <div class="card-body">
        <label class="form-check mb-3">
          <input v-model="unreadOnly" class="form-check-input" type="checkbox" />
          Unread only
        </label>

        <div v-if="!loading && messages.length === 0" class="text-muted">No messages right now.</div>

        <div v-for="item in messages" :key="item._id" class="border rounded p-3 mb-2">
          <div class="d-flex flex-wrap justify-content-between gap-2">
            <div>
              <strong>{{ item.subject || 'Notice' }}</strong>
              <div>{{ item.body }}</div>
              <small class="text-muted">{{ formatTime(item.createdAt) }}</small>
            </div>
            <button
              v-if="!item.readAt"
              type="button"
              class="btn btn-sm btn-outline-secondary"
              @click="markRead(item._id)"
            >
              Acknowledge
            </button>
            <span v-else class="badge text-bg-light align-self-start">Read</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { messagesAPI } from '../services/api';
import { asListPayload } from '../utils/listPayload.js';
import { formatDisplayTimestamp } from '../utils/dateFormat.js';

export default {
  name: 'Inbox',
  data() {
    return {
      loading: false,
      loadError: '',
      messages: [],
      unreadOnly: true
    };
  },
  watch: {
    unreadOnly() {
      this.loadMessages();
    }
  },
  mounted() {
    this.loadMessages();
  },
  methods: {
    formatTime: formatDisplayTimestamp,
    async loadMessages() {
      this.loading = true;
      this.loadError = '';
      try {
        const response = await messagesAPI.getAll({
          unread: this.unreadOnly ? 'true' : undefined,
          page: 1,
          limit: 50
        });
        this.messages = asListPayload(response.data).items;
      } catch (error) {
        this.loadError = error.response?.data?.message || 'Failed to load inbox messages.';
      } finally {
        this.loading = false;
      }
    },
    async markRead(id) {
      try {
        await messagesAPI.markAsRead(id);
        await this.loadMessages();
      } catch (error) {
        this.loadError = error.response?.data?.message || 'Failed to acknowledge message.';
      }
    },
    async markAllRead() {
      try {
        await messagesAPI.markAllRead();
        await this.loadMessages();
      } catch (error) {
        this.loadError = error.response?.data?.message || 'Failed to acknowledge messages.';
      }
    }
  }
};
</script>
