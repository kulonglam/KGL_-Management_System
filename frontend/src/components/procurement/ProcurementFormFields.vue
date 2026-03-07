<template>
  <div class="procurement-form form-shell">
    <fieldset class="form-section mb-0">
      <legend class="form-section-legend">
        <i class="bi bi-basket2"></i>
        <span>Produce Details</span>
      </legend>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label" for="procurement-produce-name">Produce Name</label>
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
          <small class="field-note">Letters, numbers and spaces are allowed.</small>
        </div>

        <div class="col-md-6">
          <label class="form-label" for="procurement-produce-type">Produce Type</label>
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
            <option value="Groundnuts">Groundnuts</option>
            <option value="Soybeans">Soybeans</option>
          </select>
          <div v-if="errors.produceType" class="invalid-feedback">{{ errors.produceType }}</div>
        </div>

        <div class="col-md-6">
          <label class="form-label" for="procurement-source-type">Source Type</label>
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
          <label class="form-label" for="procurement-date">Date</label>
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
          <label class="form-label" for="procurement-time">Time</label>
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

    <fieldset class="form-section mb-0">
      <legend class="form-section-legend">
        <i class="bi bi-cash-coin"></i>
        <span>Quantity & Pricing</span>
      </legend>
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label" for="procurement-tonnage">Tonnage (kg)</label>
          <input
            id="procurement-tonnage"
            type="number"
            :class="['form-control', { 'is-invalid': errors.tonnageKg }]"
            v-model.number="form.tonnageKg"
            :min="minimumTonnage"
            required
          />
          <div v-if="errors.tonnageKg" class="invalid-feedback">{{ errors.tonnageKg }}</div>
          <small class="field-note">
            {{
              form.sourceType === 'individual'
                ? 'Minimum 1000 kg for individual dealers.'
                : 'Minimum 100 kg for non-individual sources.'
            }}
          </small>
        </div>

        <div class="col-md-4">
          <label class="form-label" for="procurement-cost">Cost (UGX)</label>
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
          <label class="form-label" for="procurement-selling-price">Selling Price per kg (UGX)</label>
          <input
            id="procurement-selling-price"
            type="number"
            :class="['form-control', { 'is-invalid': errors.sellingPrice }]"
            v-model.number="form.sellingPrice"
            min="10000"
            :readonly="priceLocked"
          />
          <div v-if="errors.sellingPrice" class="invalid-feedback">{{ errors.sellingPrice }}</div>
          <small
            v-if="!hasManagedPrice && form.produceType && availableProduceNames.length > 0 && !hasTypeDefaultPrice"
            class="field-note text-danger"
          >
            Available {{ form.produceType }} prices in this branch: {{ availableProduceNames.join(', ') }}.
            Use one of those exact produce names or create a {{ form.produceType }} type default in Price Management.
          </small>
          <small v-else-if="!hasManagedPrice && form.produceType" class="field-note text-danger">
            No manager price is available for this produce yet. Create an exact produce price or a type default in Price Management before saving procurement.
          </small>
          <small v-else-if="priceLocked" class="field-note">{{ priceLockHint }}</small>
          <small v-else class="field-note">Select a produce type to load the manager-set selling price.</small>
        </div>
      </div>
    </fieldset>

    <fieldset class="form-section">
      <legend class="form-section-legend">
        <i class="bi bi-person-vcard"></i>
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
          <label class="form-label" for="procurement-dealer-contact">Dealer Contact</label>
          <input
            id="procurement-dealer-contact"
            type="tel"
            :class="['form-control', { 'is-invalid': errors.dealerContact }]"
            v-model="form.dealerContact"
            inputmode="tel"
            autocomplete="tel"
            maxlength="13"
            pattern="^(\+256|0)[0-9]{9}$"
            placeholder="+256700000000 or 0700000000"
            @input="sanitizePhoneField('dealerContact')"
            required
          />
          <div v-if="errors.dealerContact" class="invalid-feedback">{{ errors.dealerContact }}</div>
          <small class="field-note">Use digits only. Accepted formats are 0700000000 or +256700000000.</small>
        </div>

        <div class="col-md-6">
          <label class="form-label" for="procurement-branch">Branch</label>
          <input id="procurement-branch" type="text" class="form-control readonly-display" :value="user.branch" disabled />
        </div>
      </div>
    </fieldset>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Trim and collapse repeated whitespace for free-text fields.
const normalizeTextValue = (value) => value.replace(/\s+/g, ' ').trim();
const sanitizePhoneValue = (value) => {
  const normalized = String(value || '').replace(/[^\d+]/g, '');
  const withoutExtraPlus = normalized.startsWith('+')
    ? `+${normalized.slice(1).replace(/\+/g, '')}`
    : normalized.replace(/\+/g, '');

  if (withoutExtraPlus.startsWith('+')) {
    return withoutExtraPlus.slice(0, 13);
  }

  return withoutExtraPlus.slice(0, 10);
};

// Shared procurement form model passed from parent views.
const form = defineModel('form', {
  type: Object,
  required: true
});

// Normalize user-entered text on blur to keep payloads clean and consistent.
const normalizeText = (field) => {
  if (typeof form.value[field] !== 'string') return;
  form.value[field] = normalizeTextValue(form.value[field]);
};

const sanitizePhoneField = (field) => {
  if (typeof form.value[field] !== 'string') return;
  form.value[field] = sanitizePhoneValue(form.value[field]);
};

// Enforce business minimum tonnage by source type.
const minimumTonnage = computed(() => (form.value.sourceType === 'individual' ? 1000 : 100));
// Indicates whether a manager-defined selling price is already populated.
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
    default: 'Selling price comes from Price Management.'
  },
  errors: {
    type: Object,
    default: () => ({})
  },
  availableProduceNames: {
    type: Array,
    default: () => []
  },
  hasTypeDefaultPrice: {
    type: Boolean,
    default: false
  }
});

defineEmits(['type-change']);
</script>
