<template>
  <div class="sales-form">
    <fieldset class="sales-section mb-3">
      <legend class="section-legend">
        <i class="bi bi-cart-check"></i>
        <span>Sale Details</span>
      </legend>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Produce Name *</label>
          <select
            class="form-select"
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
              {{ item.produceName }} ({{ item.produceType }}) - {{ item.totalTonnageKg }} kg
              available
            </option>
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label">Tonnage (kg) *</label>
          <input
            type="number"
            class="form-control"
            v-model="form.tonnageKg"
            @input="$emit('tonnage-input')"
            min="1"
            required
          />
        </div>
        <div class="col-md-6">
          <label class="form-label">Amount Paid (UGX) *</label>
          <input
            type="number"
            class="form-control"
            v-model="form.amountPaidUgx"
            min="10000"
            required
            readonly
          />
          <small class="text-muted">Price is determined by manager.</small>
        </div>
        <div class="col-md-6">
          <label class="form-label">Buyer Name *</label>
          <input
            type="text"
            class="form-control"
            v-model="form.buyerName"
            minlength="2"
            pattern="^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$"
            @blur="normalizeText('buyerName')"
            required
          />
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
          <label class="form-label">Date</label>
          <input type="date" class="form-control" v-model="form.date" required />
        </div>
        <div class="col-md-6">
          <label class="form-label">Time</label>
          <input type="time" class="form-control" v-model="form.time" required />
        </div>
        <div class="col-md-6">
          <label class="form-label">Sales Agent</label>
          <input type="text" class="form-control branch-display" :value="user.name" disabled />
        </div>
        <div class="col-md-6">
          <label class="form-label">Branch</label>
          <input type="text" class="form-control branch-display" :value="user.branch" disabled />
        </div>
      </div>
    </fieldset>
  </div>
</template>

<script setup>
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
