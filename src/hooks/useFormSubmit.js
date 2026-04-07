import { useState } from 'react';
import { submitRegistration } from '../services/sheets';

export const useFormSubmit = (tournamentId) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const submit = async (formData) => {
    setIsSubmitting(true);
    setError(null);
    setIsSuccess(false);

    try {
      await submitRegistration(tournamentId, formData);
      setIsSuccess(true);
      return { success: true };
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during submission.');
      return { success: false, error: err.message };
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setIsSubmitting(false);
    setError(null);
    setIsSuccess(false);
  };

  return { submit, isSubmitting, error, isSuccess, reset };
};
