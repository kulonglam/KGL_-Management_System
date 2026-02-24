import { ref } from 'vue';

const useFormFeedback = () => {
  const loading = ref(false);
  const error = ref('');
  const success = ref('');

  const resetFeedback = () => {
    error.value = '';
    success.value = '';
  };

  const beginSubmit = () => {
    loading.value = true;
    resetFeedback();
  };

  const endSubmit = () => {
    loading.value = false;
  };

  const setError = (message) => {
    error.value = message;
  };

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
