import { ref } from 'vue';

// Handle use form feedback.
const useFormFeedback = () => {
  const loading = ref(false);
  const error = ref('');
  const success = ref('');

  // Handle reset feedback.
  const resetFeedback = () => {
    error.value = '';
    success.value = '';
  };

  // Handle begin submit.
  const beginSubmit = () => {
    loading.value = true;
    resetFeedback();
  };

  // Handle end submit.
  const endSubmit = () => {
    loading.value = false;
  };

  // Set error.
  const setError = (message) => {
    error.value = message;
  };

  // Set success.
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
