// ============================================================
// Hooks — useSuivi
// Phase 1 — Étape 1.9.b
//
// GET /public/suivi/:code
// Récupère l'état d'une demande par son code de suivi.
// ============================================================

import { useCallback, useState } from 'react';
import { apiGet } from '../services/api';
import type { SuiviResponse } from '../types/api';

export interface UseSuiviResult {
  suivi: SuiviResponse | null;
  loading: boolean;
  error: Error | null;
  fetchSuivi: (code: string) => Promise<SuiviResponse | null>;
  reset: () => void;
}

export function useSuivi(): UseSuiviResult {
  const [suivi, setSuivi] = useState<SuiviResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSuivi = useCallback(
    async (code: string): Promise<SuiviResponse | null> => {
      const trimmed = code.trim();

      if (!trimmed) {
        setSuivi(null);
        setError(new Error('Code requis'));
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await apiGet<SuiviResponse>(
          '/public/suivi/' + encodeURIComponent(trimmed)
        );

        setSuivi(result);
        return result;
      } catch (err) {
        setSuivi(null);
        setError(err instanceof Error ? err : new Error(String(err)));
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setSuivi(null);
    setError(null);
  }, []);

  return { suivi, loading, error, fetchSuivi, reset };
}
