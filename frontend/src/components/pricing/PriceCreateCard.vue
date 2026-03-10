<template>
  <div class="card create-card">
    <div class="card-header">
      <h5 class="mb-0 d-flex align-items-center gap-2">
        <i class="bi bi-plus-circle"></i>
        Add Price
      </h5>
    </div>
    <div class="card-body">
      <div class="create-grid">
        <div>
          <label class="form-label" for="price-produce-name">Produce Name</label>
          <input
            id="price-produce-name"
            v-model="produceNameModel"
            type="text"
            class="form-control"
            placeholder="Leave blank for a type default"
          />
        </div>
        <div>
          <label class="form-label" for="price-produce-type">Produce Type</label>
          <select id="price-produce-type" v-model="produceTypeModel" class="form-select">
            <option value="">Select type</option>
            <option v-for="type in produceTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </div>
        <div>
          <label class="form-label" for="price-price-ugx">Price per kg (UGX)</label>
          <div class="price-input-wrap">
            <span class="price-prefix">UGX</span>
            <input
              id="price-price-ugx"
              v-model="priceUgxModel"
              type="number"
              class="form-control text-end price-input"
              min="10000"
            />
          </div>
        </div>
        <div class="create-action">
          <button
            type="button"
            class="btn btn-success w-100"
            :disabled="saving"
            @click="$emit('submit')"
          >
            <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
            Create Price
          </button>
        </div>
      </div>
      <small v-if="error" class="text-danger d-block mt-2">{{ error }}</small>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  produceName: {
    type: String,
    default: ''
  },
  produceType: {
    type: String,
    default: ''
  },
  priceUgx: {
    type: [String, Number],
    default: ''
  },
  saving: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  produceTypes: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['submit', 'update:produceName', 'update:produceType', 'update:priceUgx']);

const produceNameModel = computed({
  get: () => props.produceName,
  set: (value) => emit('update:produceName', value)
});

const produceTypeModel = computed({
  get: () => props.produceType,
  set: (value) => emit('update:produceType', value)
});

const priceUgxModel = computed({
  get: () => props.priceUgx,
  set: (value) => emit('update:priceUgx', value)
});
</script>

<style scoped>
.create-card .card-header {
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
}

.create-grid {
  display: grid;
  grid-template-columns: 2fr 1.2fr 1.2fr auto;
  gap: 0.85rem;
  align-items: end;
}

.create-action {
  min-width: 150px;
}

.price-input-wrap {
  max-width: 380px;
  display: flex;
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 0.56rem;
  overflow: hidden;
  background: #ffffff;
}

.price-prefix {
  background: #f8fafc;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.46rem 0.62rem;
  border-right: 1px solid #e2e8f0;
}

.price-input {
  border: none;
  border-radius: 0;
}

.price-input:focus {
  box-shadow: none;
}

@media (max-width: 991.98px) {
  .create-grid {
    grid-template-columns: 1fr;
  }

  .create-action {
    min-width: 0;
  }

  .price-input-wrap {
    max-width: 100%;
  }
}
</style>
