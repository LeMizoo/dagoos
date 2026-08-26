'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth-context';
import { getDefaultArea } from '@/lib/authorization';

export default function FlotteEntry() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/urbain-login');
      return;
    }

    router.replace(getDefaultArea(user));
  }, [user, loading, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-sm text-gray-500">
        Ouverture de votre espace...
      </div>
    </div>
  );
}
