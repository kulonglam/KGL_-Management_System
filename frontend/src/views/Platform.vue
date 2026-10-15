<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">Platform &amp; integrations</h2>
      <p class="page-subtitle">Background jobs, webhooks, partner API keys, single sign-on, and scheduled reports.</p>
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
    <div v-if="success" class="alert alert-success" role="status">{{ success }}</div>

    <!-- Jobs -->
    <div v-show="activeTab === 'jobs'">
      <div class="row g-3 mb-3">
        <div class="col-md-4">
          <div class="border rounded p-3 h-100 bg-white">
            <div class="text-muted small">Job backend</div>
            <strong>{{ status?.jobs?.mode === 'redis' ? 'Redis (BullMQ)' : 'In-process' }}</strong>
            <div class="small text-muted mt-1">
              {{ status?.jobs?.pendingInProcess || 0 }} queued ·
              {{ status?.jobs?.pendingRetries || 0 }} waiting to retry
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="border rounded p-3 h-100 bg-white">
            <div class="text-muted small">Scheduler</div>
            <strong>{{ status?.jobs?.schedulerEnabled ? 'Running' : 'Disabled' }}</strong>
          </div>
        </div>
        <div class="col-md-4">
          <div class="border rounded p-3 h-100 bg-white">
            <div class="text-muted small">Single sign-on</div>
            <strong>{{ status?.oidc?.enabled ? `On (${status.oidc.providerName || 'SSO'})` : 'Not configured' }}</strong>
            <div v-if="status?.oidc?.issuer" class="small text-muted mt-1 text-break">{{ status.oidc.issuer }}</div>
          </div>
        </div>
      </div>

      <div class="card mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Schedules</h5>
          <button type="button" class="btn btn-outline-secondary btn-sm" @click="loadStatus">Refresh</button>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Schedule</th>
                  <th>Last run</th>
                  <th>Status</th>
                  <th>Next run</th>
                  <th class="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in status?.schedules || []" :key="row.jobName">
                  <td>{{ jobLabel(row.jobName) }}</td>
                  <td class="small">{{ describeSchedule(row) }}</td>
                  <td class="small">{{ formatDateTime(row.lastRunAt) }}</td>
                  <td>
                    <span class="badge" :class="statusBadge(row.lastStatus)">{{ row.lastStatus }}</span>
                    <div v-if="row.lastError" class="small text-danger">{{ row.lastError }}</div>
                  </td>
                  <td class="small">{{ formatDateTime(row.nextRunAt) }}</td>
                  <td class="text-end">
                    <button
                      type="button"
                      class="btn btn-outline-primary btn-sm"
                      :disabled="runningJob === row.jobName"
                      @click="runJob(row.jobName)"
                    >
                      {{ runningJob === row.jobName ? 'Running…' : 'Run now' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h5 class="mb-0">Recent jobs</h5></div>
        <div class="card-body">
          <p v-if="!(status?.jobs?.recentJobs || []).length" class="text-muted mb-0">
            No jobs have run since the server started.
          </p>
          <div v-else class="table-responsive">
            <table class="table table-sm">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Attempt</th>
                  <th>Status</th>
                  <th>Finished</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="job in status.jobs.recentJobs" :key="`${job.id}-${job.attempt}`">
                  <td>{{ jobLabel(job.name) }}</td>
                  <td>{{ job.attempt }} / {{ job.maxAttempts }}</td>
                  <td><span class="badge" :class="statusBadge(job.status)">{{ job.status }}</span></td>
                  <td class="small">{{ formatDateTime(job.finishedAt) }}</td>
                  <td class="small text-danger">{{ job.error }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Webhooks -->
    <div v-show="activeTab === 'webhooks'">
      <div v-if="revealedSecret" class="alert alert-warning" role="status">
        <strong>Copy this signing secret now.</strong> It will not be shown again.
        <div class="font-monospace text-break mt-2">{{ revealedSecret }}</div>
        <p class="small mb-0 mt-2">
          Verify each request: <code>X-KGL-Signature</code> =
          <code>sha256=HMAC_SHA256(secret, X-KGL-Timestamp + "." + raw body)</code>.
        </p>
        <button type="button" class="btn btn-sm btn-outline-dark mt-2" @click="revealedSecret = ''">Done</button>
      </div>

      <div class="card mb-3">
        <div class="card-header"><h5 class="mb-0">Add subscription</h5></div>
        <div class="card-body">
          <form class="row g-3" @submit.prevent="createWebhook">
            <div class="col-md-4">
              <label class="form-label" for="webhook-name">Name</label>
              <input id="webhook-name" v-model.trim="webhookForm.name" type="text" maxlength="120" class="form-control" required />
            </div>
            <div class="col-md-8">
              <label class="form-label" for="webhook-url">Target URL</label>
              <input
                id="webhook-url"
                v-model.trim="webhookForm.targetUrl"
                type="url"
                maxlength="500"
                class="form-control"
                placeholder="https://erp.example.com/kgl-webhook"
                required
              />
            </div>
            <div class="col-12">
              <span class="form-label d-block">Events</span>
              <div class="d-flex flex-wrap gap-3">
                <div v-for="event in webhookEvents" :key="event" class="form-check">
                  <input
                    :id="`event-${event}`"
                    v-model="webhookForm.events"
                    class="form-check-input"
                    type="checkbox"
                    :value="event"
                  />
                  <label class="form-check-label" :for="`event-${event}`">{{ event }}</label>
                </div>
              </div>
            </div>
            <div class="col-12">
              <button type="submit" class="btn btn-primary" :disabled="submitting || !webhookForm.events.length">
                Add webhook
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 class="mb-0">Subscriptions</h5>
          <div class="d-flex gap-2 align-items-center">
            <select v-model="testEvent" class="form-select form-select-sm" aria-label="Test event">
              <option v-for="event in webhookEvents" :key="event" :value="event">{{ event }}</option>
            </select>
            <button type="button" class="btn btn-outline-primary btn-sm text-nowrap" :disabled="submitting" @click="sendTestEvent">
              Send test event
            </button>
          </div>
        </div>
        <div class="card-body">
          <p v-if="!webhooks.length" class="text-muted mb-0">No webhook subscriptions yet.</p>
          <div v-else class="table-responsive">
            <table class="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Target</th>
                  <th>Events</th>
                  <th>Secret</th>
                  <th>Last delivery</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="hook in webhooks" :key="hook._id">
                  <td>
                    {{ hook.name }}
                    <span v-if="!hook.isActive" class="badge text-bg-secondary ms-1">paused</span>
                  </td>
                  <td class="small text-break">{{ hook.targetUrl }}</td>
                  <td class="small">{{ (hook.events || []).join(', ') }}</td>
                  <td class="small font-monospace">{{ hook.secretPreview }}</td>
                  <td class="small">
                    <span v-if="hook.lastStatusCode">HTTP {{ hook.lastStatusCode }} · </span>{{ formatDateTime(hook.lastDeliveredAt) }}
                    <div v-if="hook.lastError" class="text-danger">{{ hook.lastError }}</div>
                  </td>
                  <td class="text-end text-nowrap">
                    <button type="button" class="btn btn-outline-secondary btn-sm me-1" :disabled="submitting" @click="toggleWebhook(hook)">
                      {{ hook.isActive ? 'Pause' : 'Resume' }}
                    </button>
                    <button type="button" class="btn btn-outline-secondary btn-sm me-1" :disabled="submitting" @click="rotateSecret(hook)">
                      Rotate secret
                    </button>
                    <button
                      type="button"
                      class="btn btn-sm"
                      :class="pendingDeleteId === hook._id ? 'btn-danger' : 'btn-outline-danger'"
                      :disabled="submitting"
                      @click="deleteWebhook(hook)"
                    >
                      {{ pendingDeleteId === hook._id ? 'Confirm delete' : 'Delete' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Deliveries -->
    <div v-show="activeTab === 'deliveries'" class="card">
      <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h5 class="mb-0">Webhook deliveries</h5>
        <div class="d-flex gap-2">
          <select v-model="deliveryStatus" class="form-select form-select-sm" aria-label="Delivery status">
            <option value="">All statuses</option>
            <option value="queued">Queued</option>
            <option value="retrying">Retrying</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
          </select>
          <button type="button" class="btn btn-outline-secondary btn-sm" @click="loadDeliveries">Refresh</button>
        </div>
      </div>
      <div class="card-body">
        <p v-if="!deliveries.length" class="text-muted mb-0">No deliveries found.</p>
        <div v-else class="table-responsive">
          <table class="table table-sm align-middle">
            <thead>
              <tr>
                <th>When</th>
                <th>Subscription</th>
                <th>Event</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Response</th>
                <th class="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="delivery in deliveries" :key="delivery._id">
                <td class="small">{{ formatDateTime(delivery.createdAt) }}</td>
                <td class="small">{{ delivery.subscription?.name || '—' }}</td>
                <td class="small">{{ delivery.event }}</td>
                <td><span class="badge" :class="statusBadge(delivery.status)">{{ delivery.status }}</span></td>
                <td>{{ delivery.attemptCount }}</td>
                <td class="small">
                  <span v-if="delivery.statusCode">HTTP {{ delivery.statusCode }}</span>
                  <div v-if="delivery.error" class="text-danger">{{ delivery.error }}</div>
                </td>
                <td class="text-end">
                  <button
                    v-if="delivery.status === 'failed'"
                    type="button"
                    class="btn btn-outline-primary btn-sm"
                    :disabled="submitting"
                    @click="redeliver(delivery)"
                  >
                    Redeliver
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Partner API keys -->
    <div v-show="activeTab === 'apikeys'">
      <div v-if="revealedApiKey" class="alert alert-warning" role="status">
        <strong>Copy this API key now.</strong> It will not be shown again.
        <div class="font-monospace text-break mt-2">{{ revealedApiKey }}</div>
        <p class="small mb-0 mt-2">
          Partners send it as the <code>X-API-Key</code> header to read-only endpoints under
          <code>/api/v1/partner</code> (for example <code>/partner/stock</code>).
        </p>
        <button type="button" class="btn btn-sm btn-outline-dark mt-2" @click="revealedApiKey = ''">Done</button>
      </div>

      <div class="card mb-3">
        <div class="card-header"><h5 class="mb-0">Issue API key</h5></div>
        <div class="card-body">
          <form class="row g-3" @submit.prevent="createApiKey">
            <div class="col-md-4">
              <label class="form-label" for="api-key-name">Name</label>
              <input
                id="api-key-name"
                v-model.trim="apiKeyForm.name"
                type="text"
                maxlength="120"
                class="form-control"
                placeholder="e.g. Bank reconciliation feed"
                required
              />
            </div>
            <div class="col-md-4">
              <label class="form-label" for="api-key-branch">Branch</label>
              <select id="api-key-branch" v-model="apiKeyForm.branch" class="form-select">
                <option value="">All branches</option>
                <option v-for="name in branchNames" :key="name" :value="name">{{ name }}</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label" for="api-key-expiry">Expiry date (optional)</label>
              <input id="api-key-expiry" v-model="apiKeyForm.expiresOn" type="date" class="form-control" />
            </div>
            <div class="col-12">
              <span class="form-label d-block">Scopes</span>
              <div class="d-flex flex-wrap gap-3">
                <div v-for="scope in apiKeyScopes" :key="scope" class="form-check">
                  <input
                    :id="`scope-${scope}`"
                    v-model="apiKeyForm.scopes"
                    class="form-check-input"
                    type="checkbox"
                    :value="scope"
                  />
                  <label class="form-check-label" :for="`scope-${scope}`">{{ scope }}</label>
                </div>
              </div>
            </div>
            <div class="col-12">
              <button type="submit" class="btn btn-primary" :disabled="submitting || !apiKeyForm.scopes.length">
                Issue key
              </button>
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Keys</h5>
          <button type="button" class="btn btn-outline-secondary btn-sm" @click="loadApiKeys">Refresh</button>
        </div>
        <div class="card-body">
          <p v-if="!apiKeys.length" class="text-muted mb-0">No API keys issued yet.</p>
          <div v-else class="table-responsive">
            <table class="table table-sm align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Key</th>
                  <th>Scopes</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th>Expires</th>
                  <th>Last used</th>
                  <th class="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="key in apiKeys" :key="key._id">
                  <td>{{ key.name }}</td>
                  <td class="small font-monospace">kgl_{{ key.prefix }}_…</td>
                  <td class="small">{{ (key.scopes || []).join(', ') }}</td>
                  <td class="small">{{ key.branch || 'All' }}</td>
                  <td><span class="badge" :class="apiKeyBadge(key.status)">{{ key.status }}</span></td>
                  <td class="small">{{ key.expiresAt ? formatDateTime(key.expiresAt) : 'Never' }}</td>
                  <td class="small">
                    {{ formatDateTime(key.lastUsedAt) }}
                    <div v-if="key.lastUsedIp" class="text-muted">{{ key.lastUsedIp }}</div>
                  </td>
                  <td class="text-end">
                    <button
                      v-if="key.status === 'active'"
                      type="button"
                      class="btn btn-sm"
                      :class="pendingRevokeId === key._id ? 'btn-danger' : 'btn-outline-danger'"
                      :disabled="submitting"
                      @click="revokeApiKey(key)"
                    >
                      {{ pendingRevokeId === key._id ? 'Confirm revoke' : 'Revoke' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Weekly report -->
    <div v-show="activeTab === 'report'" class="card">
      <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h5 class="mb-0">Weekly director report</h5>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-outline-secondary btn-sm" @click="loadReportPreview">Refresh preview</button>
          <button type="button" class="btn btn-primary btn-sm" :disabled="submitting" @click="sendReportNow">Send now</button>
        </div>
      </div>
      <div class="card-body">
        <p class="small text-muted">
          Sent automatically {{ weeklySchedule ? describeSchedule(weeklySchedule) : 'every week' }} by email to directors
          with an email address, with a copy in every director's inbox.
        </p>
        <div v-if="reportPreview">
          <div
            v-if="reportPreview.recipients.some((recipient) => !recipient.hasEmail)"
            class="alert alert-info py-2 small"
            role="status"
          >
            No email address on file for:
            {{ reportPreview.recipients.filter((recipient) => !recipient.hasEmail).map((recipient) => recipient.username).join(', ') }}.
            They will only get the inbox copy.
          </div>
          <h6>{{ reportPreview.subject }}</h6>
          <pre class="report-preview border rounded p-3 bg-light mb-0">{{ reportPreview.body }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { branchAPI, platformAPI } from '../services/api';
import { formatDisplayTimestamp } from '../utils/dateFormat.js';

const API_KEY_SCOPES = ['stock:read', 'sales:read', 'procurement:read', 'prices:read'];
const emptyApiKeyForm = () => ({ name: '', branch: '', expiresOn: '', scopes: ['stock:read'] });

const JOB_LABELS = {
  'credit.overdue.scan': 'Overdue credit scan',
  'retention.run': 'Data retention',
  'reports.director.weekly': 'Weekly director report',
  'webhook.deliver': 'Webhook delivery'
};
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const emptyWebhookForm = () => ({ name: '', targetUrl: '', events: ['sale.created'] });

export default {
  name: 'Platform',
  data() {
    return {
      activeTab: 'jobs',
      tabs: [
        { id: 'jobs', label: 'Jobs & SSO' },
        { id: 'webhooks', label: 'Webhooks' },
        { id: 'deliveries', label: 'Deliveries' },
        { id: 'apikeys', label: 'API keys' },
        { id: 'report', label: 'Weekly report' }
      ],
      apiKeyScopes: API_KEY_SCOPES,
      apiKeys: [],
      apiKeyForm: emptyApiKeyForm(),
      revealedApiKey: '',
      pendingRevokeId: '',
      branchNames: [],
      error: '',
      success: '',
      submitting: false,
      runningJob: '',
      status: null,
      webhooks: [],
      webhookForm: emptyWebhookForm(),
      revealedSecret: '',
      pendingDeleteId: '',
      testEvent: 'sale.created',
      deliveries: [],
      deliveryStatus: '',
      reportPreview: null
    };
  },
  computed: {
    webhookEvents() {
      return this.status?.webhookEvents || [];
    },
    weeklySchedule() {
      return (this.status?.schedules || []).find((row) => row.jobName === 'reports.director.weekly') || null;
    }
  },
  watch: {
    activeTab(tab) {
      this.error = '';
      this.success = '';
      this.pendingDeleteId = '';
      this.pendingRevokeId = '';
      if (tab === 'jobs') this.loadStatus();
      if (tab === 'apikeys') this.loadApiKeys();
      if (tab === 'webhooks') this.loadWebhooks();
      if (tab === 'deliveries') this.loadDeliveries();
      if (tab === 'report') this.loadReportPreview();
    },
    deliveryStatus() {
      this.loadDeliveries();
    }
  },
  mounted() {
    this.loadStatus();
  },
  methods: {
    messageOf(err, fallback) {
      return err.response?.data?.message || fallback;
    },
    jobLabel(name) {
      return JOB_LABELS[name] || name;
    },
    describeSchedule(row) {
      if (row.kind === 'interval') {
        const minutes = Math.round(Number(row.intervalMs || 0) / 60000);
        return minutes >= 60 ? `Every ${Math.round(minutes / 60)} h` : `Every ${minutes} min`;
      }
      const hour = String(row.utcHour ?? 0).padStart(2, '0');
      return `${DAY_NAMES[row.utcDay ?? 0]}s at ${hour}:00 UTC`;
    },
    formatDateTime(value) {
      if (!value) return '—';
      return formatDisplayTimestamp(value);
    },
    apiKeyBadge(status) {
      if (status === 'active') return 'text-bg-success';
      if (status === 'expired') return 'text-bg-warning';
      return 'text-bg-secondary';
    },
    async loadApiKeys() {
      try {
        const [keysResponse, branchesResponse] = await Promise.all([
          platformAPI.listApiKeys(),
          this.branchNames.length === 0 ? branchAPI.list() : Promise.resolve(null)
        ]);
        this.apiKeys = Array.isArray(keysResponse.data) ? keysResponse.data : [];
        if (branchesResponse) {
          this.branchNames = Array.isArray(branchesResponse.data?.names) ? branchesResponse.data.names : [];
        }
      } catch (err) {
        this.error = this.messageOf(err, 'Failed to load API keys.');
      }
    },
    async createApiKey() {
      this.submitting = true;
      this.error = '';
      this.success = '';
      try {
        const { name, branch, expiresOn, scopes } = this.apiKeyForm;
        const payload = { name, branch, scopes: [...scopes] };
        if (expiresOn) payload.expiresAt = expiresOn;
        const response = await platformAPI.createApiKey(payload);
        this.revealedApiKey = response.data?.key || '';
        this.apiKeyForm = emptyApiKeyForm();
        this.success = 'API key issued.';
        await this.loadApiKeys();
      } catch (err) {
        this.error = this.messageOf(err, 'Failed to issue API key.');
      } finally {
        this.submitting = false;
      }
    },
    async revokeApiKey(key) {
      if (this.pendingRevokeId !== key._id) {
        this.pendingRevokeId = key._id;
        return;
      }
      this.pendingRevokeId = '';
      this.submitting = true;
      this.error = '';
      this.success = '';
      try {
        await platformAPI.revokeApiKey(key._id);
        this.success = `API key "${key.name}" revoked. Requests using it now get 401.`;
        await this.loadApiKeys();
      } catch (err) {
        this.error = this.messageOf(err, 'Failed to revoke API key.');
      } finally {
        this.submitting = false;
      }
    },
    statusBadge(value) {
      if (value === 'completed' || value === 'delivered') return 'text-bg-success';
      if (value === 'failed') return 'text-bg-danger';
      if (value === 'retrying' || value === 'queued') return 'text-bg-warning';
      return 'text-bg-secondary';
    },
    async loadStatus() {
      try {
        const response = await platformAPI.status();
        this.status = response.data;
      } catch (err) {
        this.error = this.messageOf(err, 'Failed to load platform status.');
      }
    },
    async runJob(jobName) {
      this.runningJob = jobName;
      this.error = '';
      this.success = '';
      try {
        await platformAPI.enqueueJob({ jobName });
        this.success = `${this.jobLabel(jobName)} finished.`;
        await this.loadStatus();
      } catch (err) {
        this.error = this.messageOf(err, `${this.jobLabel(jobName)} failed.`);
      } finally {
        this.runningJob = '';
      }
    },
    async loadWebhooks() {
      if (!this.status) await this.loadStatus();
      try {
        const response = await platformAPI.listWebhooks();
        this.webhooks = Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        this.error = this.messageOf(err, 'Failed to load webhooks.');
      }
    },
    async createWebhook() {
      this.submitting = true;
      this.error = '';
      this.success = '';
      try {
        const response = await platformAPI.createWebhook({ ...this.webhookForm });
        this.revealedSecret = response.data?.secret || '';
        this.webhookForm = emptyWebhookForm();
        this.success = 'Webhook added.';
        await this.loadWebhooks();
      } catch (err) {
        this.error = this.messageOf(err, 'Failed to add webhook.');
      } finally {
        this.submitting = false;
      }
    },
    async updateWebhook(hook, payload, message) {
      this.submitting = true;
      this.error = '';
      this.success = '';
      try {
        const response = await platformAPI.updateWebhook(hook._id, payload);
        if (response.data?.secret) this.revealedSecret = response.data.secret;
        this.success = message;
        await this.loadWebhooks();
      } catch (err) {
        this.error = this.messageOf(err, 'Failed to update webhook.');
      } finally {
        this.submitting = false;
      }
    },
    toggleWebhook(hook) {
      return this.updateWebhook(hook, { isActive: !hook.isActive }, hook.isActive ? 'Webhook paused.' : 'Webhook resumed.');
    },
    rotateSecret(hook) {
      return this.updateWebhook(hook, { rotateSecret: true }, 'Signing secret rotated.');
    },
    async deleteWebhook(hook) {
      if (this.pendingDeleteId !== hook._id) {
        this.pendingDeleteId = hook._id;
        return;
      }
      this.pendingDeleteId = '';
      this.submitting = true;
      this.error = '';
      try {
        await platformAPI.deleteWebhook(hook._id);
        this.success = 'Webhook deleted.';
        await this.loadWebhooks();
      } catch (err) {
        this.error = this.messageOf(err, 'Failed to delete webhook.');
      } finally {
        this.submitting = false;
      }
    },
    async sendTestEvent() {
      this.submitting = true;
      this.error = '';
      this.success = '';
      try {
        const response = await platformAPI.testEmit({ event: this.testEvent });
        const queued = Number(response.data?.queued || 0);
        this.success = queued
          ? `Test ${this.testEvent} queued for ${queued} subscription${queued === 1 ? '' : 's'}. Check Deliveries.`
          : `No active subscription listens for ${this.testEvent}.`;
      } catch (err) {
        this.error = this.messageOf(err, 'Failed to send test event.');
      } finally {
        this.submitting = false;
      }
    },
    async loadDeliveries() {
      try {
        const params = this.deliveryStatus ? { status: this.deliveryStatus } : {};
        const response = await platformAPI.listDeliveries(params);
        this.deliveries = Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        this.error = this.messageOf(err, 'Failed to load deliveries.');
      }
    },
    async redeliver(delivery) {
      this.submitting = true;
      this.error = '';
      this.success = '';
      try {
        await platformAPI.redeliver(delivery._id);
        this.success = 'Redelivery queued.';
        await this.loadDeliveries();
      } catch (err) {
        this.error = this.messageOf(err, 'Failed to queue redelivery.');
      } finally {
        this.submitting = false;
      }
    },
    async loadReportPreview() {
      if (!this.status) await this.loadStatus();
      try {
        const response = await platformAPI.previewWeeklyReport();
        this.reportPreview = response.data;
      } catch (err) {
        this.error = this.messageOf(err, 'Failed to build report preview.');
      }
    },
    async sendReportNow() {
      this.submitting = true;
      this.error = '';
      this.success = '';
      try {
        const response = await platformAPI.runWeeklyReport();
        const { emailed = 0, inApp = 0 } = response.data || {};
        this.success = `Report sent: ${emailed} email${emailed === 1 ? '' : 's'}, ${inApp} inbox cop${inApp === 1 ? 'y' : 'ies'}.`;
      } catch (err) {
        this.error = this.messageOf(err, 'Failed to send the report.');
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style scoped>
.report-preview {
  white-space: pre-wrap;
  font-size: 0.875rem;
}
</style>
