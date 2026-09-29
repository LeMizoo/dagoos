// ============================================================
// Hooks — useEstimate
// Phase 1 — Étape 1.6.a
//
// POST /public/estimate — estimation course urbaine.
// Retourne distance + prix estimé pour un trajet.
// ============================================================

import { useCallback, useState } from 'react';
import { apiPost } from '../services/api';
import type { EstimateRequest, EstimateResponse } from '../types/api';

export interface UseEstimateResult {
  estimate: EstimateResponse | null;
  loading: boolean;
  error: Error | null;
  compute: (payload: EstimateRequest) => Promise<EstimateResponse | null>;
  reset: () => void;
}

export function useEstimate(): UseEstimateResult {
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const compute = useCallback(
    async (payload: EstimateRequest): Promise<EstimateResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiPost<EstimateResponse>(
          '/public/estimate',
          payload
        );

        // Le backend renvoie parfois { error: "..." } en HTTP 200
        if (result && typeof result === 'object' && result.error) {
          setEstimate(null);
          setError(new Error(result.error));
          return null;
        }

        setEstimate(result);
        return result;
      } catch (err) {
        setEstimate(null);
        setError(err instanceof Error ? err : new Error(String(err)));
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

  return { estimate, loading, error, compute, reset };
}
