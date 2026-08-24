'use client';

import { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';

export interface Organization {
  id?: string;
  name?: string;
  code?: string;
  type?: string;
  email?: string;
  phone?: string;
  logo?: string;
  plan?: string;
  status?: string;
}

interface OrganizationContextType {
  organization: Organization | null;
  isUrbain: boolean;
  isInterurbain: boolean;
  isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organization: null,
  isUrbain: false,
  isInterurbain: false,
  isLoading: true,
});

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();

  const organization = useMemo<Organization | null>(() => {
    if (!user) return null;
    
    return {
      id: user.organizationId,
      name: user.organizationName,
      code: user.organizationCode,
      type: user.role === 'FLEET_MANAGER' ? 'FLEET_MANAGER' : user.role === 'COOP_MANAGER' ? 'COOPERATIVE' : undefined,
      email: user.email,
    };
  }, [user]);

  const isUrbain = organization?.type === 'FLEET_MANAGER';
  const isInterurbain = organization?.type === 'COOPERATIVE';

  return (
    <OrganizationContext.Provider value={{ organization, isUrbain, isInterurbain, isLoading: authLoading }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  return useContext(OrganizationContext);
}
