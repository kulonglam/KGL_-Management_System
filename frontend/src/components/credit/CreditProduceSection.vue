<template>
  <fieldset class="credit-section mb-3">
    <legend class="section-legend">
      <i class="bi bi-box-seam"></i>
      <span>Produce Information</span>
    </legend>
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label" for="credit-produce-name">Produce Name</label>
        <select
          id="credit-produce-name"
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
            {{ item.produceName }} ({{ item.produceType }}) - {{ item.totalTonnageKg }} kg
          </option>
        </select>
        <div v-if="errors.produceName" class="invalid-feedback">{{ errors.produceName }}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label" for="credit-produce-type">Produce Type</label>
        <input
          id="credit-produce-type"
          type="text"
          :class="['form-control branch-display', { 'is-invalid': errors.produceType }]"
          v-model="form.produceType"
          disabled
        />
        <div v-if="errors.produceType" class="invalid-feedback">{{ errors.produceType }}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label" for="credit-tonnage-kg">Tonnage (kg)</label>
        <input
          id="credit-tonnage-kg"
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
        <label class="form-label" for="credit-amount-due">Amount Due (UGX)</label>
        <input
          id="credit-amount-due"
          type="number"
          :class="['form-control', { 'is-invalid': errors.amountDueUgx }]"
          v-model="form.amountDueUgx"
          min="10000"
          required
          readonly
        />
        <div v-if="errors.amountDueUgx" class="invalid-feedback">{{ errors.amountDueUgx }}</div>
        <small class="text-muted">Price is determined by manager.</small>
      </div>
    </div>
  </fieldset>
</template>

<script setup>
// Configure form.
const form = defineModel('form', {
  type: Object,
  required: true
});

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
  errors: {
    type: Object,
    default: () => ({})
  }
});
</script>

<style scoped>
/* Component styles */
.credit-section {
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

.credit-section .form-label {
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
