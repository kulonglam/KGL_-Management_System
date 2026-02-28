import { reactive } from 'vue';
import { validateFieldValue, validateValues } from '../utils/formValidation.mjs';

// Handle use form validation.
const useFormValidation = (schema) => {
  const errors = reactive({});

  // Handle set errors.
  const setErrors = (nextErrors = {}) => {
    Object.keys(errors).forEach((fieldName) => {
      delete errors[fieldName];
    });

    Object.entries(nextErrors).forEach(([fieldName, message]) => {
      if (message) {
        errors[fieldName] = message;
      }
    });
  };

  // Handle validate form.
  const validateForm = (values) => {
    const result = validateValues(values, schema);
    setErrors(result.errors);
    return result;
  };

  // Handle validate field.
  const validateField = (fieldName, values) => {
    const message = validateFieldValue(fieldName, values, schema);
    if (message) {
      errors[fieldName] = message;
      return false;
    }
    delete errors[fieldName];
    return true;
  };

  // Handle clear field error.
  const clearFieldError = (fieldName) => {
    delete errors[fieldName];
  };

  // Handle reset errors.
  const resetErrors = () => {
    Object.keys(errors).forEach((fieldName) => {
      delete errors[fieldName];
    });
  };

  return {
    errors,
    setErrors,
    validateForm,
    validateField,
    clearFieldError,
    resetErrors
  };
};

export { useFormValidation };
