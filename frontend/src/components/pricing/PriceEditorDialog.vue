<template>
  <div v-if="show" class="modal-mask" @click.self="$emit('close')">
    <div
      class="modal-card price-edit-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="price-edit-title"
    >
      <div class="modal-header">
        <h5 id="price-edit-title" class="mb-0">
          {{ form._id ? 'Edit Price' : 'Create Price' }}
        </h5>
        <button
          type="button"
          class="btn-close"
          aria-label="Close price editor"
          :disabled="saving"
          @click="$emit('close')"
        ></button>
      </div>
      <div class="modal-body">
        <div class="form-shell">
          <div class="form-section">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label" for="price-edit-produce-name">Produce Name</label>
                <input
                  id="price-edit-produce-name"
                  v-model="form.produceName"
                  type="text"
                  class="form-control"
                  placeholder="Leave blank for type default"
                />
                <small class="field-note">
                  Use a name only when this row should override the type default.
                </small>
              </div>
              <div class="col-md-6">
                <label class="form-label" for="price-edit-produce-type">Produce Type</label>
                <select
                  id="price-edit-produce-type"
                  v-model="form.produceType"
                  class="form-select"
                >
                  <option value="">Select type</option>
                  <option v-for="type in produceTypes" :key="type" :value="type">
                    {{ type }}
                  </option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label" for="price-edit-price-ugx">Price per kg (UGX)</label>
                <div class="price-input-wrap">
                  <span class="price-prefix">UGX</span>
                  <input
                    id="price-edit-price-ugx"
                    v-model="form.priceUgx"
                    type="number"
                    class="form-control text-end price-input"
                    min="10000"
                  />
                </div>
              </div>
            </div>
          </div>

          <div v-if="error" class="alert alert-danger mb-0">
            {{ error }}
          </div>

          <div class="d-flex justify-content-end gap-2">
            <button
              type="button"
              class="btn btn-outline-secondary"
              :disabled="saving"
              @click="$emit('close')"
            >
              Cancel
            </button>
            <button type="button" class="btn btn-primary" :disabled="saving" @click="$emit('submit')">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              {{ form._id ? 'Save Changes' : 'Create Price' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  },
  form: {
    type: Object,
    required: true
  },
  produceTypes: {
    type: Array,
    default: () => []
  },
  saving: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
});

defineEmits(['close', 'submit']);
</script>

<style scoped>
.price-edit-modal {
  max-width: 700px;
}
</style>
