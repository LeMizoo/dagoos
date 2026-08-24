'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FleetLoginRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/flotte-login');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Redirection vers le nouvel espace flotte...</p>
    </div>
  );
}
