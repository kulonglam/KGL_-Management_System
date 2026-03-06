<template>
  <div class="sales-form">
    <fieldset class="sales-section mb-3">
      <legend class="section-legend">
        <i class="bi bi-cart-check"></i>
        <span>Sale Details</span>
      </legend>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label" for="sales-produce-name">Produce Name</label>
          <select
            id="sales-produce-name"
            :class="['form-select', { 'is-invalid': errors.produceName }]"
            v-model="form.produceName"
            @change="handleProduceChange"
            required
          >
            <option value="">Select produce</option>
            <option
              v-for="item in inventory"
              :key="`${item.produceName}-${item.produceType}`"
              :value="item.produceName"
              :data-produce-type="item.produceType"
            >
              {{ item.produceName }}
            </option>
          </select>
          <div v-if="errors.produceName" class="invalid-feedback">{{ errors.produceName }}</div>
        </div>
        <div class="col-md-6">
          <label class="form-label" for="sales-tonnage-kg">Tonnage (kg)</label>
          <input
            id="sales-tonnage-kg"
            type="number"
            :class="['form-control', { 'is-invalid': errors.tonnageKg }]"
            v-model="form.tonnageKg"
            @input="$emit('tonnage-input')"
            min="1"
            required
          />
          <div v-if="errors.tonnageKg" class="invalid-feedback">{{ errors.tonnageKg }}</div>
        </div>
        <div class="col-md-6">
          <label class="form-label" for="sales-amount-paid">Amount Paid (UGX)</label>
          <input
            id="sales-amount-paid"
            type="number"
            :class="['form-control', { 'is-invalid': errors.amountPaidUgx }]"
            v-model="form.amountPaidUgx"
            min="10000"
            required
            readonly
          />
          <div v-if="errors.amountPaidUgx" class="invalid-feedback">{{ errors.amountPaidUgx }}</div>
          <small class="text-muted">Price is determined by manager.</small>
        </div>
        <div class="col-md-6">
          <label class="form-label" for="sales-buyer-name">Buyer Name</label>
          <input
            id="sales-buyer-name"
            type="text"
            :class="['form-control', { 'is-invalid': errors.buyerName }]"
            v-model="form.buyerName"
            minlength="2"
            pattern="^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$"
            @blur="normalizeText('buyerName')"
            required
          />
          <div v-if="errors.buyerName" class="invalid-feedback">{{ errors.buyerName }}</div>
        </div>
      </div>
    </fieldset>

    <fieldset class="sales-section">
      <legend class="section-legend">
        <i class="bi bi-calendar2-week"></i>
        <span>Transaction Information</span>
      </legend>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label" for="sales-date">Date</label>
          <input
            id="sales-date"
            type="date"
            :class="['form-control', { 'is-invalid': errors.date }]"
            v-model="form.date"
            required
          />
          <div v-if="errors.date" class="invalid-feedback">{{ errors.date }}</div>
        </div>
        <div class="col-md-6">
          <label class="form-label" for="sales-time">Time</label>
          <input
            id="sales-time"
            type="time"
            :class="['form-control', { 'is-invalid': errors.time }]"
            v-model="form.time"
            required
          />
          <div v-if="errors.time" class="invalid-feedback">{{ errors.time }}</div>
        </div>
        <div class="col-md-6">
          <label class="form-label" for="sales-agent-name">Sales Agent</label>
          <input id="sales-agent-name" type="text" class="form-control branch-display" :value="user.name" disabled />
        </div>
        <div class="col-md-6">
          <label class="form-label" for="sales-branch">Branch</label>
          <input id="sales-branch" type="text" class="form-control branch-display" :value="user.branch" disabled />
        </div>
      </div>
    </fieldset>
  </div>
</template>

<script setup>
// Trim and collapse repeated whitespace for free-text fields.
const normalizeTextValue = (value) => value.replace(/\s+/g, ' ').trim();

// Shared cash-sale form model passed from the parent view.
const form = defineModel('form', {
  type: Object,
  required: true
});

// Normalize text fields on blur before validation/submission.
const normalizeText = (field) => {
  if (typeof form.value[field] !== 'string') return;
  form.value[field] = normalizeTextValue(form.value[field]);
};

const emit = defineEmits(['produce-change', 'tonnage-input']);

// Keep produce name/type synchronized from the selected option.
const handleProduceChange = (event) => {
  const selected = event?.target?.options?.[event.target.selectedIndex];
  form.value.produceType = selected?.dataset?.produceType || '';
  emit('produce-change');
};

defineProps({
  inventory: {
    type: Array,
    required: true
  },
  user: {
    type: Object,
    required: true
  },
  errors: {
    type: Object,
    default: () => ({})
  }
});
</script>

<style scoped>
/* Component styles */
.sales-section {
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

.sales-form .form-label {
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
