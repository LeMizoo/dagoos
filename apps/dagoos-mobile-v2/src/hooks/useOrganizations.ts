import { useMemo } from 'react';
import { useApi } from './useApi';
import type { Organization } from '../types/api';

const PLAN_PRIORITY: Record<string, number> = {
  Premium: 4,
  Standard: 3,
  Basic: 2,
  Freemium: 1,
};

export function useOrganizations() {
  const { data, loading, error, refetch } = useApi<Organization[]>(
    '/public/partners'
  );

  const organizations = useMemo(() => {
    return [...(data ?? [])].sort(
      (a, b) =>
        (PLAN_PRIORITY[b.plan] ?? 0) -
        (PLAN_PRIORITY[a.plan] ?? 0)
    );
  }, [data]);

  return {
    organizations,
    loading,
    error,
    refetch,
  };
}