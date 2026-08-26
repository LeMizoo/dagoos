'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth-context';
import { getDefaultArea } from '@/lib/authorization';

interface PortalGuardProps {
  children: ReactNode;
  allowedRoles: string[];
}

function getRequiredRole(pathname: string): string[] | null {
  if (
    pathname === '/flotte/urbain' ||
    pathname.startsWith('/flotte/urbain/')
  ) {
    return ['FLEET_MANAGER'];
  }

  if (
    pathname === '/flotte/interurbain' ||
    pathname.startsWith('/flotte/interurbain/')
  ) {
    return ['COOP_MANAGER'];
  }

  return null;
}

function getLoginPath(pathname: string): string {
  if (
    pathname === '/flotte/interurbain' ||
    pathname.startsWith('/flotte/interurbain/')
  ) {
    return '/interurbain-login';
  }

  if (
    pathname === '/flotte/urbain' ||
    pathname.startsWith('/flotte/urbain/')
  ) {
    return '/urbain-login';
  }

  if (pathname.startsWith('/flotte')) {
    return '/urbain-login';
  }

  return '/login';
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
      const loginPath = getLoginPath(pathname);

      const redirect = encodeURIComponent(
        `${pathname}${window.location.search}`
      );

      router.replace(`${loginPath}?redirect=${redirect}`);
      return;
    }

    const requiredRoles = getRequiredRole(pathname);

    // Les espaces Urbain et Interurbain sont isolés par rôle.
    if (requiredRoles) {
      if (!user.role || !requiredRoles.includes(user.role)) {
        router.replace(getDefaultArea(user));
      }

      return;
    }

    // Pour /flotte (point d'entrée), les deux rôles sont autorisés.
    if (user.role && allowedRoles.includes(user.role)) {
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

  const requiredRoles = getRequiredRole(pathname);

  if (requiredRoles) {
    if (!user.role || !requiredRoles.includes(user.role)) {
      return null;
    }

    return <>{children}</>;
  }

  if (
    !user.role ||
    !allowedRoles.includes(user.role)
  ) {
    return null;
  }

  return <>{children}</>;
}
