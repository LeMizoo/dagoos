export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'FLEET_MANAGER'
  | 'COOP_MANAGER'
  | 'DRIVER';

export type UserScope =
  | 'GLOBAL'
  | 'ORGANIZATION'
  | 'SELF'
  | null;

export interface AuthorizationUser {
  id?: string;
  role?: UserRole | string;
  organizationId?: string;
  driverId?: string;
}

export function getUserScope(
  user: AuthorizationUser | null | undefined
): UserScope {
  if (!user?.role) {
    return null;
  }

  switch (user.role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return 'GLOBAL';

    case 'FLEET_MANAGER':
    case 'COOP_MANAGER':
      return 'ORGANIZATION';

    case 'DRIVER':
      return 'SELF';

    default:
      return null;
  }
}

export function isGlobalUser(
  user: AuthorizationUser | null | undefined
): boolean {
  return getUserScope(user) === 'GLOBAL';
}

export function isOrganizationUser(
  user: AuthorizationUser | null | undefined
): boolean {
  return getUserScope(user) === 'ORGANIZATION';
}

export function isDriver(
  user: AuthorizationUser | null | undefined
): boolean {
  return user?.role === 'DRIVER';
}

export function isFleetManager(
  user: AuthorizationUser | null | undefined
): boolean {
  return user?.role === 'FLEET_MANAGER';
}

export function isCooperative(
  user: AuthorizationUser | null | undefined
): boolean {
  return user?.role === 'COOP_MANAGER';
}

export function canAccessOrganization(
  user: AuthorizationUser | null | undefined,
  organizationId: string | undefined | null
): boolean {
  if (!user || !organizationId) {
    return false;
  }

  const scope = getUserScope(user);

  if (scope === 'GLOBAL') {
    return true;
  }

  if (scope === 'ORGANIZATION') {
    return user.organizationId === organizationId;
  }

  return false;
}

export function canAccessSelf(
  user: AuthorizationUser | null | undefined,
  userId: string | undefined | null
): boolean {
  if (!user || !userId) {
    return false;
  }

  return getUserScope(user) === 'SELF' && user.id === userId;
}

export function getDefaultArea(
  user: AuthorizationUser | null | undefined
): '/dashboard' | '/fleet' | '/coop' | '/' {
  switch (user?.role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/dashboard';

    case 'FLEET_MANAGER':
      return '/fleet';

    case 'COOP_MANAGER':
      return '/coop';

    case 'DRIVER':
      return '/';

    default:
      return '/';
  }
}
