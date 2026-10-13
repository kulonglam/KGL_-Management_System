// Wraps schema-based field/form validation with a reactive error object for Vue forms.
 
import { reactive } from 'vue';
import { validateValues } from '../utils/formValidation.js';

// Build validation helpers bound to one schema instance.
const useFormValidation = (schema) => {
  const errors = reactive({});

  // Replace current errors with a sanitized error map from validation output.
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

  // Validate all fields and update the shared error state.
  const validateForm = (values) => {
    const result = validateValues(values, schema);
    setErrors(result.errors);
    return result;
  };

  // Remove one field error after user correction.
  const clearFieldError = (fieldName) => {
    delete errors[fieldName];
  };

  // Clear all tracked validation errors.
  const resetErrors = () => {
    Object.keys(errors).forEach((fieldName) => {
      delete errors[fieldName];
    });
  };

  return {
    errors,
    validateForm,
    clearFieldError,
    resetErrors
  };
};

export { useFormValidation };
