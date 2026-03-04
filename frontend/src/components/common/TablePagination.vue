<!-- Reusable table pagination control with page-size selection and navigation actions. -->
<template>
  <div
    v-if="totalItems > 0"
    class="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3"
    aria-live="polite"
  >
    <small class="text-muted" :id="summaryId">
      Showing {{ rowsStart }}-{{ rowsEnd }} of
      {{ totalItems.toLocaleString('en-UG') }} {{ itemLabel }}
    </small>
    <div class="d-flex align-items-center gap-2">
      <label class="small text-muted mb-0" :for="rowsControlId">Rows</label>
      <select
        :id="rowsControlId"
        class="form-select form-select-sm"
        :value="pageSize"
        :aria-describedby="summaryId"
        @change="handlePageSizeChange"
      >
        <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
      </select>
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary"
        :disabled="currentPage <= 1"
        aria-label="Go to previous page"
        @click="$emit('update:currentPage', currentPage - 1)"
      >
        Prev
      </button>
      <span class="small text-muted">Page {{ currentPage }} / {{ totalPages }}</span>
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary"
        :disabled="currentPage >= totalPages"
        aria-label="Go to next page"
        @click="$emit('update:currentPage', currentPage + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    required: true
  },
  pageSize: {
    type: Number,
    required: true
  },
  pageSizeOptions: {
    type: Array,
    default: () => [10, 20, 50, 100]
  },
  itemLabel: {
    type: String,
    default: 'records'
  },
  idPrefix: {
    type: String,
    default: 'table'
  }
});

const emit = defineEmits(['update:currentPage', 'update:pageSize']);

const rowsStart = computed(() => {
  if (props.totalItems === 0) return 0;
  return (props.currentPage - 1) * props.pageSize + 1;
});

const rowsEnd = computed(() =>
  Math.min(props.currentPage * props.pageSize, props.totalItems)
);

const rowsControlId = computed(() => `${props.idPrefix}-page-size`);
const summaryId = computed(() => `${props.idPrefix}-summary`);

const handlePageSizeChange = (event) => {
  const nextValue = Number(event.target.value || props.pageSize);
  emit('update:pageSize', nextValue);
};
</script>

