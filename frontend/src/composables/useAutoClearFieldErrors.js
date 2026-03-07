/**
 * Clears field-level validation errors as tracked form values change.
 * File: frontend/src/composables/useAutoClearFieldErrors.js
 */

import { watch } from 'vue';

const isRecord = (value) => value && typeof value === 'object';

const useAutoClearFieldErrors = (formRef, clearFieldError) => {
  watch(
    formRef,
    (next, previous) => {
      if (!isRecord(next) || !isRecord(previous)) return;

      Object.keys(next).forEach((fieldName) => {
        if (next[fieldName] !== previous[fieldName]) {
          clearFieldError(fieldName);
        }
      });
    },
    { deep: true }
  );
};

export { useAutoClearFieldErrors };
