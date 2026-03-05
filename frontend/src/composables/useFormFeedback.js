/**
 * Manages submit-state feedback (loading/error/success) for form-driven views.
 * File: frontend/src/composables/useFormFeedback.js
 */

import { ref } from 'vue';

// Expose a reusable feedback state bundle for async form submissions.
const useFormFeedback = () => {
  const loading = ref(false);
  const error = ref('');
  const success = ref('');

  // Clear transient messages before a new user action.
  const resetFeedback = () => {
    error.value = '';
    success.value = '';
  };

  // Mark submit as active and remove stale alerts.
  const beginSubmit = () => {
    loading.value = true;
    resetFeedback();
  };

  // Return form state to idle after request completion.
  const endSubmit = () => {
    loading.value = false;
  };

  // Show failure feedback from API or validation flows.
  const setError = (message) => {
    error.value = message;
  };

  // Show success feedback after a completed action.
  const setSuccess = (message) => {
    success.value = message;
  };

  return {
    loading,
    error,
    success,
    resetFeedback,
    beginSubmit,
    endSubmit,
    setError,
    setSuccess
  };
};

export { useFormFeedback };
