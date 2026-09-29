// ============================================================
// Hooks — useLocationEstimate
// Phase 1 — Étape 1.8.f
//
// POST /public/estimate-location
// L'estimation reste entièrement calculée par le backend.
// ============================================================

import { useCallback, useState } from 'react';
import { apiPost } from '../services/api';
import type {
  LocationEstimateRequest,
  LocationEstimateResponse,
} from '../types/api';

export interface UseLocationEstimateResult {
  estimate: LocationEstimateResponse | null;
  loading: boolean;
  error: Error | null;
  compute: (
    payload: LocationEstimateRequest
  ) => Promise<LocationEstimateResponse | null>;
  reset: () => void;
}

export function useLocationEstimate(): UseLocationEstimateResult {
  const [estimate, setEstimate] =
    useState<LocationEstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const compute = useCallback(
    async (
      payload: LocationEstimateRequest
    ): Promise<LocationEstimateResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiPost<LocationEstimateResponse>(
          '/public/estimate-location',
          payload
        );

        if (result && typeof result === 'object' && result.error) {
          setEstimate(null);
          setError(new Error(result.error));
          return null;
        }

        setEstimate(result);
        return result;
      } catch (err) {
        setEstimate(null);
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
    setEstimate(null);
    setError(null);
  }, []);

  return {
    estimate,
    loading,
    error,
    compute,
    reset,
  };
}