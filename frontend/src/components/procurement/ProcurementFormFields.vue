<template>
  <div class="procurement-form">
    <fieldset class="procurement-section mb-3">
      <legend class="section-legend">
        
        <span>Produce Details</span>
      </legend>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label" for="procurement-produce-name">Produce Name </label>
          <input
            id="procurement-produce-name"
            type="text"
            :class="['form-control', { 'is-invalid': errors.produceName }]"
            v-model="form.produceName"
            minlength="2"
            pattern="^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$"
            placeholder="e.g. White Maize"
            @blur="normalizeText('produceName')"
            required
          />
          <div v-if="errors.produceName" class="invalid-feedback">{{ errors.produceName }}</div>
          <small class="text-muted">Letters, numbers and spaces are allowed.</small>
        </div>

        <div class="col-md-6">
          <label class="form-label" for="procurement-produce-type">Produce Type </label>
          <select
            id="procurement-produce-type"
            :class="['form-select', { 'is-invalid': errors.produceType }]"
            v-model="form.produceType"
            @change="$emit('type-change')"
            required
          >
            <option value="">Select type</option>
            <option value="Beans">Beans</option>
            <option value="Grain Maize">Grain Maize</option>
            <option value="Cow peas">Cow peas</option>
            <option value="G-nuts">G-nuts</option>
            <option value="Soybeans">Soybeans</option>
          </select>
          <div v-if="errors.produceType" class="invalid-feedback">{{ errors.produceType }}</div>
        </div>

        <div class="col-md-6">
          <label class="form-label" for="procurement-source-type">Source Type </label>
          <select
            id="procurement-source-type"
            :class="['form-select', { 'is-invalid': errors.sourceType }]"
            v-model="form.sourceType"
            required
          >
            <option value="">Select source</option>
            <option value="individual">Individual Dealer</option>
            <option value="company">Company</option>
            <option value="kgl_farm">KGL Farm</option>
          </select>
          <div v-if="errors.sourceType" class="invalid-feedback">{{ errors.sourceType }}</div>
        </div>

        <div class="col-md-3">
          <label class="form-label" for="procurement-date">Date </label>
          <input
            id="procurement-date"
            type="date"
            :class="['form-control', { 'is-invalid': errors.dateReceived }]"
            v-model="form.dateReceived"
            required
          />
          <div v-if="errors.dateReceived" class="invalid-feedback">{{ errors.dateReceived }}</div>
        </div>

        <div class="col-md-3">
          <label class="form-label" for="procurement-time">Time </label>
          <input
            id="procurement-time"
            type="time"
            :class="['form-control', { 'is-invalid': errors.timeReceived }]"
            v-model="form.timeReceived"
            required
          />
          <div v-if="errors.timeReceived" class="invalid-feedback">{{ errors.timeReceived }}</div>
        </div>
      </div>
    </fieldset>

    <fieldset class="procurement-section mb-3">
      <legend class="section-legend">
        
        <span>Quantity & Pricing</span>
      </legend>
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label" for="procurement-tonnage">Tonnage (kg) </label>
          <input
            id="procurement-tonnage"
            type="number"
            :class="['form-control', { 'is-invalid': errors.tonnageKg }]"
            v-model.number="form.tonnageKg"
            :min="minimumTonnage"
            required
          />
          <div v-if="errors.tonnageKg" class="invalid-feedback">{{ errors.tonnageKg }}</div>
          <small class="text-muted">
            {{
              form.sourceType === 'individual'
                ? 'Minimum 1000 kg for individual dealers.'
                : 'Minimum 100 kg for non-individual sources.'
            }}
          </small>
        </div>

        <div class="col-md-4">
          <label class="form-label" for="procurement-cost">Cost (UGX) </label>
          <input
            id="procurement-cost"
            type="number"
            :class="['form-control', { 'is-invalid': errors.costUgx }]"
            v-model.number="form.costUgx"
            min="10000"
            required
          />
          <div v-if="errors.costUgx" class="invalid-feedback">{{ errors.costUgx }}</div>
        </div>

        <div class="col-md-4">
          <label class="form-label" for="procurement-selling-price">Selling Price per kg (UGX) </label>
          <input
            id="procurement-selling-price"
            type="number"
            :class="['form-control', { 'is-invalid': errors.sellingPrice }]"
            v-model.number="form.sellingPrice"
            min="10000"
            required
            :readonly="priceLocked"
          />
          <div v-if="errors.sellingPrice" class="invalid-feedback">{{ errors.sellingPrice }}</div>
          <small v-if="!hasManagedPrice && form.produceType" class="text-danger">
            Set a manager price in Price Management before saving procurement.
          </small>
          <small v-else-if="priceLocked" class="text-muted">{{ priceLockHint }}</small>
        </div>
      </div>
    </fieldset>

    <fieldset class="procurement-section">
      <legend class="section-legend">
        
        <span>Dealer Information</span>
      </legend>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label" for="procurement-dealer-name">Dealer Name</label>
          <input
            id="procurement-dealer-name"
            type="text"
            :class="['form-control', { 'is-invalid': errors.dealerName }]"
            v-model="form.dealerName"
            minlength="2"
            pattern="^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$"
            placeholder="e.g. Lam Traders"
            @blur="normalizeText('dealerName')"
            required
          />
          <div v-if="errors.dealerName" class="invalid-feedback">{{ errors.dealerName }}</div>
        </div>

        <div class="col-md-6">
          <label class="form-label" for="procurement-dealer-contact">Dealer Contact </label>
          <input
            id="procurement-dealer-contact"
            type="text"
            :class="['form-control', { 'is-invalid': errors.dealerContact }]"
            v-model="form.dealerContact"
            pattern="^(\+256|0)[0-9]{9}$"
            placeholder="+256700000000 or 0700000000"
            required
          />
          <div v-if="errors.dealerContact" class="invalid-feedback">{{ errors.dealerContact }}</div>
        </div>

        <div class="col-md-6">
          <label class="form-label" for="procurement-branch">Branch</label>
          <input id="procurement-branch" type="text" class="form-control branch-display" :value="user.branch" disabled />
        </div>
      </div>
    </fieldset>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Handle normalize text value.
const normalizeTextValue = (value) => value.replace(/\s+/g, ' ').trim();

// Configure form.
const form = defineModel('form', {
  type: Object,
  required: true
});

// Handle normalize text.
const normalizeText = (field) => {
  if (typeof form.value[field] !== 'string') return;
  form.value[field] = normalizeTextValue(form.value[field]);
};

// Configure minimum tonnage.
const minimumTonnage = computed(() => (form.value.sourceType === 'individual' ? 1000 : 100));
// Configure has managed price.
const hasManagedPrice = computed(() => Number(form.value.sellingPrice) >= 10000);

defineProps({
  user: {
    type: Object,
    required: true
  },
  priceLocked: {
    type: Boolean,
    required: true
  },
  priceLockHint: {
    type: String,
    default: 'Price is controlled in Price Management.'
  },
  errors: {
    type: Object,
    default: () => ({})
  }
});

defineEmits(['type-change']);
</script>

<style scoped>
/* Component styles */
.procurement-section {
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 0.95rem 0.95rem 1rem;
  background: #fbfcfd;
  min-width: 0;
}

.section-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.1rem;
  color: #1f2937;
  margin: 0 auto 0.8rem;
  padding: 0 0.45rem;
  text-align: center;
}

.section-legend i {
  color: #198754;
}

.procurement-form .form-label {
  font-weight: 700;
  font-size: 0.95rem;
  color: #1f2937;
}

.branch-display {
  background-color: #f1f5f9;
  color: #334155;
  font-weight: 500;
}
</style>
