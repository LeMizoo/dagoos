// ============================================================
// Hooks — useCourseRequest
// Phase 1 — Étape 1.6.a
//
// POST /public/actions (type COURSE_REQUEST)
// Retourne { ok, actionId, codeSuivi }.
// ============================================================

import { useCallback, useState } from 'react';
import { apiPost } from '../services/api';
import type { ActionRequest, ActionResponse } from '../types/api';

export interface UseCourseRequestResult {
  loading: boolean;
  error: Error | null;
  submit: (
    payload: ActionRequest
  ) => Promise<ActionResponse | null>;
}

export function useCourseRequest(): UseCourseRequestResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submit = useCallback(
    async (payload: ActionRequest): Promise<ActionResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiPost<ActionResponse>(
          '/public/actions',
          payload
        );

        // Le backend peut renvoyer { error } sans throw
        if (result && typeof result === 'object' && result.error) {
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

  return { loading, error, submit };
}
