import { useState } from 'react';
import { submitRegistration } from '../services/sheets';
import { CanonicalSchema } from '../schemas/canonical';
import { transformToCanonical } from '../utils/dataFixer';

export const useFormSubmit = (tournamentId) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const submit = async (flatData) => {
    setIsSubmitting(true);
    setError(null);
    setIsSuccess(false);

    try {
      // 1. Transform to Canonical Format
      const canonicalData = transformToCanonical(tournamentId, flatData);
      
      // 2. Validate with Zod
      const validation = CanonicalSchema.safeParse(canonicalData);
      
      if (!validation.success) {
        // Map Zod errors to a readable message
        const fieldErrors = validation.error.format();
        console.error("Validation failed:", fieldErrors);
        
        if (fieldErrors.team?.team_name?._errors?.[0]) {
           throw new Error(`Team Data: ${fieldErrors.team.team_name._errors[0]}`);
        }
        
        throw new Error("Validation Error: Please check all required fields.");
      }

      // 3. Submit
      await submitRegistration(tournamentId, validation.data);
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
