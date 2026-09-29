// ============================================================
// Hooks — useDeparts
// Phase 1 — Étape 1.7.a
//
// Charge la liste des départs interurbains publiés.
// Source : GET /public/organizations (les départs sont
// imbriqués dans chaque organisation).
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGetSafe } from '../services/api';
import type { Depart, Organization } from '../types/api';

export interface UseDepartsResult {
  departs: Depart[];
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Aplatit les départs de toutes les organisations.
 * Chaque départ est enrichi du nom de son organisation.
 */
function flattenDeparts(organizations: Organization[]): Depart[] {
  const out: Depart[] = [];

  for (const org of organizations) {
    const departs = org.departs;

    if (!Array.isArray(departs)) continue;

    for (const raw of departs) {
      const d = raw as Depart;

      out.push({
        ...d,
        organizationName: org.name,
        reservations: Array.isArray(d.reservations)
          ? d.reservations
          : [],
      });
    }
  }

  return out;
}

export function useDeparts(): UseDepartsResult {
  const [departs, setDeparts] = useState<Depart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await apiGetSafe<Organization[] | null>(
      '/public/organizations',
      null
    );

    if (!mountedRef.current) return;

    if (result === null) {
      setDeparts([]);
      setError(new Error('Impossible de charger les départs'));
      setLoading(false);
      return;
    }

    setDeparts(flattenDeparts(result));
    setLoading(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const timer = window.setTimeout(() => {
      void fetchData();
    }, 0);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(timer);
    };
  }, [fetchData]);

  const refetch = useCallback(() => {
    void fetchData();
  }, [fetchData]);

  return {
    departs,
    loading,
    error,
    refetch,
  };
}