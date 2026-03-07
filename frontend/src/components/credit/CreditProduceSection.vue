<template>
  <fieldset class="form-section mb-0">
    <legend class="form-section-legend">
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
            {{ item.produceName }}
          </option>
        </select>
        <div v-if="errors.produceName" class="invalid-feedback">{{ errors.produceName }}</div>
        <small class="field-note">Only produce with stock in this branch is listed.</small>
      </div>
      <div class="col-md-6">
        <label class="form-label" for="credit-produce-type">Produce Type</label>
        <input
          id="credit-produce-type"
          type="text"
          :class="['form-control readonly-display', { 'is-invalid': errors.produceType }]"
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
          :class="['form-control readonly-display', { 'is-invalid': errors.amountDueUgx }]"
          v-model="form.amountDueUgx"
          min="10000"
          required
          readonly
        />
        <div v-if="errors.amountDueUgx" class="invalid-feedback">{{ errors.amountDueUgx }}</div>
        <small class="field-note">Auto-calculated from the manager-set price.</small>
      </div>
    </div>
  </fieldset>
</template>

<script setup>
// Shared credit-sale form model passed from parent view.
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
