<template>
  <div class="view-shell">
    <div class="view-heading">
      <h2 class="page-title">{{ $t('Till') }}</h2>
      <p class="page-subtitle">Scan a barcode and sell. If the network drops, the sale waits on this device and sends when you are back online.</p>
    </div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="success" class="alert alert-success">{{ success }}</div>
    <div class="alert" :class="queued.length ? 'alert-warning' : 'alert-light'">
      {{ online ? $t('Online') : $t('Offline') }} · {{ queued.length }} sale{{ queued.length === 1 ? '' : 's' }} waiting to sync
      <span v-if="catalog.length"> · {{ catalog.length }} barcodes on this device</span>
    </div>

    <div class="card mb-3">
      <div class="card-header"><h5 class="mb-0">{{ $t('Scan') }}</h5></div>
      <div class="card-body">
        <form class="row g-2" @submit.prevent="scan">
          <div class="col-md-5">
            <input id="till-code" v-model.trim="code" class="form-control" placeholder="Barcode" required />
          </div>
          <div class="col-md-2">
            <input v-model.number="kg" type="number" min="1" class="form-control" aria-label="Kilograms" />
          </div>
          <div class="col-md-2">
            <button class="btn btn-primary w-100" type="submit">{{ $t('Add') }}</button>
          </div>
        </form>
        <ul class="mt-3 mb-0">
          <li v-for="(line, index) in cart" :key="index">
            {{ line.produceName }} · {{ line.tonnageKg }} kg · {{ line.amountUgx }} UGX
          </li>
        </ul>
      </div>
    </div>

    <div class="card mb-3">
      <div class="card-header"><h5 class="mb-0">{{ $t('Take payment') }}</h5></div>
      <div class="card-body">
        <form class="row g-2" @submit.prevent="checkout">
          <div class="col-md-4">
            <input v-model.trim="buyerName" class="form-control" placeholder="Buyer name" required />
          </div>
          <div class="col-md-2">
            <select v-model="paymentMethod" class="form-select">
              <option value="cash">Cash</option>
              <option value="momo">MoMo</option>
              <option value="bank">Bank</option>
            </select>
          </div>
          <div class="col-md-2">
            <select v-model="currency" class="form-select">
              <option>UGX</option>
              <option>USD</option>
              <option>KES</option>
              <option>EUR</option>
              <option>GBP</option>
            </select>
          </div>
          <div v-if="currency !== 'UGX'" class="col-md-2">
            <input v-model.number="foreignAmount" type="number" min="0" step="0.01" class="form-control" placeholder="Foreign amount" />
          </div>
          <div class="col-md-2">
            <button class="btn btn-success w-100" type="submit" :disabled="cart.length === 0">Sell</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="canRegister" class="card">
      <div class="card-header"><h5 class="mb-0">Register a barcode</h5></div>
      <div class="card-body">
        <form class="row g-2" @submit.prevent="register">
          <div class="col-md-3">
            <input v-model.trim="registerForm.code" class="form-control" placeholder="Barcode" required />
          </div>
          <div class="col-md-3">
            <input v-model.trim="registerForm.produceName" class="form-control" placeholder="Produce" required />
          </div>
          <div class="col-md-3">
            <input v-model.trim="registerForm.produceType" class="form-control" placeholder="Beans" required />
          </div>
          <div class="col-md-3">
            <button class="btn btn-outline-primary w-100" type="submit">Save barcode</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { catalogAPI, salesAPI } from '../services/api';
import { useAuthStore } from '../stores/auth';
import { businessTodayIso } from '../utils/businessTime';

const QUEUE_KEY = 'kgl.offlineSales';
const CATALOG_KEY = 'kgl.barcodeCatalog';

const readQueue = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(QUEUE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeQueue = (rows) => {
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(rows));
};

const readCatalog = () => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CATALOG_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCatalog = (rows) => {
  window.localStorage.setItem(CATALOG_KEY, JSON.stringify(rows));
};

const businessTime = () =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kampala',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(new Date());

export default {
  name: 'OfflinePos',
  data() {
    return {
      code: '',
      kg: 1,
      cart: [],
      buyerName: '',
      paymentMethod: 'cash',
      currency: 'UGX',
      foreignAmount: null,
      queued: readQueue(),
      catalog: readCatalog(),
      online: typeof navigator === 'undefined' ? true : navigator.onLine,
      error: '',
      success: '',
      registerForm: { code: '', produceName: '', produceType: 'Beans' }
    };
  },
  computed: {
    canRegister() {
      return ['director', 'manager'].includes(useAuthStore().role);
    }
  },
  mounted() {
    window.addEventListener('online', this.onOnline);
    window.addEventListener('offline', this.onOffline);
    if (this.online) {
      this.flush();
      this.refreshCatalog();
    }
  },
  beforeUnmount() {
    window.removeEventListener('online', this.onOnline);
    window.removeEventListener('offline', this.onOffline);
  },
  methods: {
    onOnline() {
      this.online = true;
      this.flush();
      this.refreshCatalog();
    },
    async refreshCatalog() {
      try {
        const response = await catalogAPI.listBarcodes();
        const rows = Array.isArray(response.data) ? response.data : [];
        this.catalog = rows;
        writeCatalog(rows);
      } catch {
        this.catalog = readCatalog();
      }
    },
    addToCart(item) {
      if (!item?.priceUgx) {
        this.error = 'This barcode has no selling price at the branch.';
        return;
      }
      const tonnageKg = Number(this.kg) || 1;
      this.cart.push({
        produceName: item.produceName,
        produceType: item.produceType,
        tonnageKg,
        amountUgx: item.priceUgx * tonnageKg
      });
      this.code = '';
    },
    onOffline() {
      this.online = false;
    },
    async scan() {
      this.error = '';
      const cached = this.catalog.find((row) => row.code === this.code);
      if (!this.online) {
        if (!cached) {
          this.error = 'This barcode is not in the catalog saved on this device.';
          return;
        }
        this.addToCart(cached);
        return;
      }
      try {
        const response = await catalogAPI.lookupBarcode(this.code);
        this.addToCart(response.data);
        this.refreshCatalog();
      } catch (err) {
        if (cached) {
          this.addToCart(cached);
          return;
        }
        this.error = err.response?.data?.message || 'Barcode was not found.';
      }
    },
    queueSale(payload) {
      this.queued = [...this.queued, payload];
      writeQueue(this.queued);
    },
    async sendSale(payload) {
      await salesAPI.create(payload);
    },
    async checkout() {
      this.error = '';
      if (this.cart.length === 0) return;
      const time = businessTime();
      const date = businessTodayIso();
      for (const line of this.cart) {
        const payload = {
          clientSaleId: crypto.randomUUID(),
          produceName: line.produceName,
          produceType: line.produceType,
          tonnageKg: line.tonnageKg,
          buyerName: this.buyerName,
          date,
          time,
          paymentMethod: this.paymentMethod,
          currency: this.currency,
          foreignAmount: this.currency === 'UGX' ? undefined : this.foreignAmount
        };
        if (!this.online) {
          this.queueSale(payload);
          continue;
        }
        try {
          await this.sendSale(payload);
        } catch (err) {
          if (!err.response) {
            this.queueSale(payload);
            this.online = false;
          } else {
            this.error = err.response?.data?.message || 'The sale was rejected.';
            return;
          }
        }
      }
      this.success = this.queued.length
        ? this.$t('Saved on this device until the network returns.')
        : this.$t('Sale recorded.');
      this.cart = [];
      this.buyerName = '';
    },
    async flush() {
      const pending = readQueue();
      const remain = [];
      for (const payload of pending) {
        try {
          await this.sendSale(payload);
        } catch (err) {
          if (!err.response) {
            remain.push(payload, ...pending.slice(pending.indexOf(payload) + 1));
            break;
          }
          this.error = err.response?.data?.message || 'A waiting sale was rejected.';
        }
      }
      this.queued = remain;
      writeQueue(remain);
      if (pending.length > remain.length) this.success = 'Waiting sales were sent.';
    },
    async register() {
      this.error = '';
      try {
        await catalogAPI.registerBarcode(this.registerForm);
        this.success = 'Barcode saved.';
        this.registerForm = { code: '', produceName: '', produceType: 'Beans' };
      } catch (err) {
        this.error = err.response?.data?.message || 'Could not save the barcode.';
      }
    }
  }
};
</script>
