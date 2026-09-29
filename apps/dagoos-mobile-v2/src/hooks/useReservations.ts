// ============================================================
// Hooks — useReservations
// Phase 1 — Étape 1.7.a (durci en 1.7.c)
//
// POST /public/reservations/batch
// Crée N réservations (une par passager) pour un même départ,
// avec un code OTP unique partagé.
//
// 1.7.c :
//   submit() retourne { response, conflictPlaces } pour que
//   l'appelant lise les places en conflit de manière synchrone,
//   sans dépendre du state React (stale closure).
// ============================================================

import { useCallback, useState } from 'react';
import { apiPost } from '../services/api';
import type {
  BatchReservationRequest,
  BatchReservationResponse,
} from '../types/api';

export interface SubmitOutcome {
  response: BatchReservationResponse | null;
  /** Places en conflit (409) — disponible de manière synchrone. */
  conflictPlaces: string[];
}

export interface UseReservationsResult {
  loading: boolean;
  error: Error | null;
  /** Places en conflit — destiné à l'affichage UI (render suivant). */
  conflictPlaces: string[];
  submit: (
    payload: BatchReservationRequest
  ) => Promise<SubmitOutcome>;
  reset: () => void;
}

export function useReservations(): UseReservationsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [conflictPlaces, setConflictPlaces] = useState<string[]>([]);

  const submit = useCallback(
    async (
      payload: BatchReservationRequest
    ): Promise<SubmitOutcome> => {
      setLoading(true);
      setError(null);
      setConflictPlaces([]);

      try {
        const result = await apiPost<BatchReservationResponse>(
          '/public/reservations/batch',
          payload
        );

        // Cas métier : backend renvoie { error } sans throw HTTP.
        if (result && typeof result === 'object' && result.error) {
          const places = Array.isArray(result.places)
            ? result.places
            : [];

          if (places.length > 0) {
            setConflictPlaces(places);
          }

          setError(new Error(result.error));

          return { response: null, conflictPlaces: places };
        }

        return { response: result, conflictPlaces: [] };
      } catch (err) {
        const wrapped =
          err instanceof Error ? err : new Error(String(err));

        setError(wrapped);

        return { response: null, conflictPlaces: [] };
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
