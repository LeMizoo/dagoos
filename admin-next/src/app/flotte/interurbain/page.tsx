'use client';

import { useMemo } from 'react';
import { useOrganization } from '@/lib/organization-context';
import FlotteDashboard from '@/components/flotte/FlotteDashboard';

export default function FlotteInterurbainEntry() {
  const { hasActivity, isLoading } = useOrganization();
  const isInterurbain = useMemo(() => hasActivity('INTERURBAN'), [hasActivity]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!isInterurbain) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-center">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            Activité interurbaine non activée
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Votre organisation n&apos;a pas d&apos;activité interurbaine.
            Contactez l&apos;administrateur si c&apos;est une erreur.
          </p>
        </div>
      </div>
    );
  }

  return <FlotteDashboard />;
}
