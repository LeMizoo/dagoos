// ============================================================
// Hooks — useSuiviEvents
// Phase 2.4.4.a — Timeline
//
// GET /public/suivi/:code/events
// Récupère les événements de suivi d'une demande.
// ============================================================

import { useCallback, useState } from 'react';
import { apiGet } from '../services/api';
import type { SuiviEventsResponse } from '../types/api';

const DEFAULT_LIMIT = 100;

export interface UseSuiviEventsResult {
  events: SuiviEventsResponse | null;
  loading: boolean;
  error: Error | null;
  fetchEvents: (code: string) => Promise<SuiviEventsResponse | null>;
  reset: () => void;
}

export function useSuiviEvents(): UseSuiviEventsResult {
  const [events, setEvents] = useState<SuiviEventsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(
    async (code: string): Promise<SuiviEventsResponse | null> => {
      const trimmed = code.trim();

      if (!trimmed) {
        setEvents(null);
        setError(new Error('Code requis'));
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await apiGet<SuiviEventsResponse>(
          '/public/suivi/' +
            encodeURIComponent(trimmed) +
            '/events?limit=' +
            DEFAULT_LIMIT
        );

        setEvents(result);
        return result;
      } catch (err) {
        setEvents(null);
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setEvents(null);
    setError(null);
  }, []);

  return { events, loading, error, fetchEvents, reset };
}
