// ============================================================
// Hooks — useReservations
// Phase 1 — Étape 1.7.a
//
// POST /public/reservations/batch
// Crée N réservations (une par passager) pour un même départ,
// avec un code OTP unique partagé.
// ============================================================

import { useCallback, useState } from 'react';
import { apiPost } from '../services/api';
import type {
  BatchReservationRequest,
  BatchReservationResponse,
} from '../types/api';

export interface UseReservationsResult {
  loading: boolean;
  error: Error | null;
  /** Places en conflit en cas d'erreur 409. */
  conflictPlaces: string[];
  submit: (
    payload: BatchReservationRequest
  ) => Promise<BatchReservationResponse | null>;
  reset: () => void;
}

export function useReservations(): UseReservationsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [conflictPlaces, setConflictPlaces] = useState<string[]>([]);

  const submit = useCallback(
    async (
      payload: BatchReservationRequest
    ): Promise<BatchReservationResponse | null> => {
      setLoading(true);
      setError(null);
      setConflictPlaces([]);

      try {
        const result = await apiPost<BatchReservationResponse>(
          '/public/reservations/batch',
          payload
        );

        // Le backend renvoie { error } en HTTP 200 pour
        // certains cas métier (ex. places en conflit).
        if (result && typeof result === 'object' && result.error) {
          if (Array.isArray(result.places)) {
            setConflictPlaces(result.places);
          }
          setError(new Error(result.error));
          return null;
        }

        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
    setConflictPlaces([]);
  }, []);

  return { loading, error, conflictPlaces, submit, reset };
}
