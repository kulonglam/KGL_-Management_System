<template>
  <fieldset class="credit-section mb-3">
    <legend class="section-legend">
      <i class="bi bi-box-seam"></i>
      <span>Produce Information</span>
    </legend>
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Produce Name *</label>
        <select class="form-select" v-model="form.produceName" @change="$emit('produce-change')" required>
          <option value="">Select produce</option>
          <option
            v-for="item in inventory"
            :key="`${item.produceName}-${item.produceType}`"
            :value="item.produceName"
          >
            {{ item.produceName }} ({{ item.produceType }}) - {{ item.totalTonnageKg }} kg
          </option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Produce Type</label>
        <input type="text" class="form-control branch-display" v-model="form.produceType" disabled />
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
        <label class="form-label">Amount Due (UGX) *</label>
        <input
          type="number"
          class="form-control"
          v-model="form.amountDueUgx"
          min="10000"
          required
          readonly
        />
        <small class="text-muted">Price is determined by manager.</small>
      </div>
    </div>
  </fieldset>
</template>

<script setup>
const form = defineModel('form', {
  type: Object,
  required: true
});

defineProps({
  inventory: {
    type: Array,
    required: true
  }
});

defineEmits(['produce-change', 'tonnage-input']);
</script>

<style scoped>
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
