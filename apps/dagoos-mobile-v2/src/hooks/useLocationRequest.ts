// ============================================================
// Hooks — useLocationRequest
// Phase 1 — Étape 1.8.f
//
// POST /public/actions
// Création d'une demande CAR_RENTAL ou LONG_HAUL.
// ============================================================

import { useCallback, useState } from 'react';
import { apiPost } from '../services/api';
import type {
  LocationRequest,
  LocationRequestResponse,
} from '../types/api';

export interface UseLocationRequestResult {
  loading: boolean;
  error: Error | null;
  submit: (
    payload: LocationRequest
  ) => Promise<LocationRequestResponse | null>;
  reset: () => void;
}

export function useLocationRequest(): UseLocationRequestResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = useCallback(
    async (
      payload: LocationRequest
    ): Promise<LocationRequestResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiPost<LocationRequestResponse>(
          '/public/actions',
          payload
        );

        if (result && typeof result === 'object' && result.error) {
          setError(new Error(result.error));
          return null;
        }

        return result;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error(String(err))
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    submit,
    reset,
  };
}