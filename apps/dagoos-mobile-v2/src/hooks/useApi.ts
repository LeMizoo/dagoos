// ============================================================
// Hooks — useApi
// Phase 0 — Étape 0.13.4
// Hook React pour les appels API avec loading/error/refetch
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet } from '../services/api';
import type { ApiOptions } from '../types/api';

export interface UseApiOptions<T> {
  /** Valeur de repli utilisée si l'appel échoue. */
  fallback?: T;
  /** Si false, ne lance pas l'appel. */
  enabled?: boolean;
  /** Dépendances qui relancent l'appel quand elles changent. */
  deps?: readonly unknown[];
  /** Options passées à la couche API (timeout, retry, method...). */
  apiOptions?: ApiOptions;
}

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useApi<T>(
  endpoint: string,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const { fallback, enabled = true, deps = [], apiOptions } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef<boolean>(true);

  // Sérialisation stable des deps : ESLint exige un tableau littéral,
  // donc on compresse `deps` en une seule clé primitive.
  const depsKey = JSON.stringify(deps);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      const result = await apiGet<T>(endpoint, apiOptions);

      if (!mountedRef.current) return;

      setData(result);
      setError(null);
      setLoading(false);
    } catch (err) {
      if (!mountedRef.current) return;

      if (fallback !== undefined) {
        setData(fallback);
        setError(null);
      } else {
        setError(err instanceof Error ? err : new Error(String(err)));
      }

      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, enabled, fallback, apiOptions, depsKey]);

  useEffect(() => {
    mountedRef.current = true;

    const run = async () => {
      await fetchData();
    };

    void run();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  // refetch est appelé depuis un event handler (bouton, etc.).
  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    void fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}
