'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth-context';
import { getDefaultArea } from '@/lib/authorization';

interface PortalGuardProps {
  children: ReactNode;
  allowedRoles: string[];
}

export default function PortalGuard({
  children,
  allowedRoles,
}: PortalGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      const loginPath =
        pathname.startsWith('/flotte/interurbain')
          ? '/interurbain-login'
          : pathname.startsWith('/flotte')
            ? '/urbain-login'
            : '/login';

      const redirect = encodeURIComponent(
        `${pathname}${window.location.search}`
      );

      router.replace(`${loginPath}?redirect=${redirect}`);
      return;
    }

    if (
      user.role &&
      allowedRoles.includes(user.role)
    ) {
      return;
    }

    router.replace(getDefaultArea(user));
  }, [
    user,
    loading,
    allowedRoles,
    pathname,
    router,
  ]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-500">
          Chargement...
        </div>
      </div>
    );
  }

  if (
    !user.role ||
    !allowedRoles.includes(user.role)
  ) {
    return null;
  }

  return <>{children}</>;
}
