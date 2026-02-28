<template>
  <div v-if="show" class="modal-mask" @click.self="handleCancel">
    <div
      ref="dialogRef"
      class="modal-card confirm-dialog"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      tabindex="-1"
    >
      <div class="modal-header">
        <h5 :id="titleId" class="mb-0">{{ title }}</h5>
        <button
          type="button"
          class="btn-close"
          aria-label="Close confirmation dialog"
          :disabled="busy"
          @click="handleCancel"
        ></button>
      </div>
      <div class="modal-body">
        <p class="mb-4">{{ message }}</p>
        <div class="d-flex justify-content-end gap-2">
          <button
            ref="cancelButtonRef"
            type="button"
            class="btn btn-outline-secondary"
            :disabled="busy"
            @click="handleCancel"
          >
            {{ cancelText }}
          </button>
          <button
            type="button"
            class="btn"
            :class="confirmButtonClass"
            :disabled="busy"
            @click="$emit('confirm')"
          >
            <span v-if="busy" class="spinner-border spinner-border-sm me-2"></span>
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Confirm Action'
  },
  message: {
    type: String,
    default: 'Are you sure you want to continue?'
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  confirmVariant: {
    type: String,
    default: 'danger'
  },
  busy: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['confirm', 'cancel']);

const dialogRef = ref(null);
const cancelButtonRef = ref(null);
const lastActiveElement = ref(null);
const titleId = `confirm-dialog-title-${Math.random().toString(36).slice(2, 10)}`;

const confirmButtonClass = computed(() => {
  if (props.confirmVariant === 'primary') return 'btn-primary';
  if (props.confirmVariant === 'success') return 'btn-success';
  return 'btn-danger';
});

const getFocusableElements = () =>
  Array.from(
    dialogRef.value?.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) || []
  );

const focusDialog = async () => {
  await nextTick();
  if (cancelButtonRef.value) {
    cancelButtonRef.value.focus();
    return;
  }
  dialogRef.value?.focus();
};

const trapFocus = (event) => {
  if (!props.show || event.key !== 'Tab') return;
  const focusable = getFocusableElements();
  if (focusable.length === 0) {
    event.preventDefault();
    dialogRef.value?.focus();
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
    return;
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
};

const onWindowKeydown = (event) => {
  if (!props.show) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    handleCancel();
    return;
  }
  trapFocus(event);
};

const restoreFocus = () => {
  const element = lastActiveElement.value;
  if (element && typeof element.focus === 'function') {
    element.focus();
  }
};

const handleCancel = () => {
  if (props.busy) return;
  emit('cancel');
};

watch(
  () => props.show,
  async (isOpen) => {
    if (isOpen) {
      lastActiveElement.value = document.activeElement;
      await focusDialog();
      window.addEventListener('keydown', onWindowKeydown);
      return;
    }

    window.removeEventListener('keydown', onWindowKeydown);
    restoreFocus();
  }
);

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onWindowKeydown);
});
</script>

<style scoped>
.confirm-dialog {
  max-width: 480px;
}
</style>
