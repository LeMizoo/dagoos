'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';

// =========================================================
// TYPES V2 — Conformes au CDC DAGOO'S MOBILITY V2
// Sections 10, 11, 12, 17, 51
// =========================================================

export type BusinessActivityType =
  | 'URBAN'
  | 'INTERURBAN'
  | 'SPECIALIZED'
  | 'RENTAL';

export type PricingModel =
  | 'PER_KM'
  | 'FIXED'
  | 'NEGOTIATED'
  | 'BAREME'
  | 'PER_DAY';

export type ServiceCategory = 'STANDARD' | 'PREMIUM' | 'VIP';

export type VehicleTypeCode =
  | 'MOTO'
  | 'VOITURE'
  | 'BUS'
  | 'MINIVAN'
  | 'TRICYCLE'
  | 'FOURGON'
  | 'CAMION'
  | 'SEMI_REMORQUE'
  | 'DEPANNEUSE'
  | 'CAMION_FRIGO';

export interface VehicleCategory {
  id: string;
  code: string;
  label: string;
  vehicleType: VehicleTypeCode;
  capacity?: number | null;
}

export interface ServiceTariff {
  id: string;
  pricingModel: PricingModel;
  basePrice: number | null;
  unitPrice: number | null;
  minimumPrice: number | null;
  /**
   * Commission chauffeur (CDC Section 31).
   * Semantique : commissionPct = part du CHAUFFEUR (0 a 50).
   * La part de l'organisation = 100 - commissionPct.
   */
  commissionPct: number;
  currency: string;
  configuration: Record<string, unknown> | null;
  vehicleCategory: VehicleCategory | null;
}

export interface Service {
  id: string;
  code: string;
  label: string;
  category: ServiceCategory | null;
  tariffs: ServiceTariff[];
}

export interface BusinessActivity {
  id: string;
  type: BusinessActivityType;
  zone: string | null;
  services: Service[];
}

export interface Organization {
  id?: string;
  name?: string;
  code?: string;
  slug?: string;
  type?: 'FLEET_MANAGER' | 'COOPERATIVE' | string;
  logo?: string | null;
  plan?: string;
  status?: string;
  email?: string;
  phone?: string;
  businessActivities?: BusinessActivity[];
}

// =========================================================
// CONTEXT
// =========================================================

interface OrganizationContextType {
  // Organisation de base (derivee de /auth/me)
  organization: Organization | null;

  // Configuration V2 (chargee via /organizations/:id/config)
  activities: BusinessActivity[];

  // Etats
  isLoading: boolean;
  isConfigLoading: boolean;
  configError: string | null;

  // Helpers V2
  hasActivity: (type: BusinessActivityType) => boolean;
  hasService: (code: string) => boolean;
  getService: (code: string) => Service | null;
  getTariff: (
    serviceCode: string,
    vehicleCategoryCode?: string
  ) => ServiceTariff | null;
  getActivityServices: (type: BusinessActivityType) => Service[];

  // @deprecated — Transition V1 -> V2
  // Utiliser hasActivity() a la place.
  // Ces flags seront supprimes dans une future version.
  /** @deprecated Utiliser hasActivity('URBAN') */
  isUrbain: boolean;
  /** @deprecated Utiliser hasActivity('INTERURBAN') */
  isInterurbain: boolean;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organization: null,
  activities: [],
  isLoading: true,
  isConfigLoading: false,
  configError: null,
  hasActivity: () => false,
  hasService: () => false,
  getService: () => null,
  getTariff: () => null,
  getActivityServices: () => [],
  isUrbain: false,
  isInterurbain: false,
});

// =========================================================
// PROVIDER
// =========================================================

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();

  const [config, setConfig] = useState<Organization | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  // ---------------------------------------------------------
  // Organisation de base derivee de /auth/me
  // ---------------------------------------------------------

  const organization = useMemo<Organization | null>(() => {
    if (!user) return null;

    return {
      id: user.organizationId,
      name: user.organizationName,
      code: user.organizationCode,
      type:
        user.role === 'FLEET_MANAGER'
          ? 'FLEET_MANAGER'
          : user.role === 'COOP_MANAGER'
            ? 'COOPERATIVE'
            : undefined,
      email: user.email,
      phone: user.phone,
    };
  }, [user]);

  // ---------------------------------------------------------
  // Chargement de la configuration V2
  // ---------------------------------------------------------

  useEffect(() => {
    const organizationId = user?.organizationId;

    if (!organizationId) {
      setConfig(null);
      setConfigError(null);
      setIsConfigLoading(false);
      return;
    }

    let cancelled = false;

    // Eviter d'afficher la configuration de l'organisation precedente
    // pendant le chargement de la nouvelle organisation.
    setConfig(null);
    setIsConfigLoading(true);
    setConfigError(null);

    async function loadConfig() {

      try {
        const response = await apiFetch(
          `/organizations/${organizationId}/config`
        );

        if (!response.ok) {
          throw new Error(
            `Erreur ${response.status} lors du chargement de la configuration`
          );
        }

        const data = (await response.json()) as Organization;

        if (cancelled) return;

        setConfig(data);
      } catch (err) {
        if (cancelled) return;

        const message =
          err instanceof Error ? err.message : 'Erreur inconnue';

        console.error('organization-context config:', message);
        setConfigError(message);
        setConfig(null);
      } finally {
        if (!cancelled) {
          setIsConfigLoading(false);
        }
      }
    }

    loadConfig();

    return () => {
      cancelled = true;
    };
  }, [user?.organizationId]);

  // ---------------------------------------------------------
  // Fusion : config V2 enrichit organization de base
  // ---------------------------------------------------------

  const mergedOrganization = useMemo<Organization | null>(() => {
    if (!organization) return null;

    if (!config) return organization;

    return {
      ...organization,
      ...config,
      businessActivities: config.businessActivities ?? [],
    };
  }, [organization, config]);

  const activities = useMemo<BusinessActivity[]>(
    () => mergedOrganization?.businessActivities ?? [],
    [mergedOrganization]
  );

  // ---------------------------------------------------------
  // Helpers V2
  // ---------------------------------------------------------

  const hasActivity = useCallback(
    (type: BusinessActivityType): boolean => {
      return activities.some((a) => a.type === type);
    },
    [activities]
  );

  const getActivityServices = useCallback(
    (type: BusinessActivityType): Service[] => {
      const activity = activities.find((a) => a.type === type);
      return activity?.services ?? [];
    },
    [activities]
  );

  const hasService = useCallback(
    (code: string): boolean => {
      return activities.some((a) =>
        a.services.some((s) => s.code === code)
      );
    },
    [activities]
  );

  const getService = useCallback(
    (code: string): Service | null => {
      for (const activity of activities) {
        const service = activity.services.find((s) => s.code === code);
        if (service) return service;
      }
      return null;
    },
    [activities]
  );

  const getTariff = useCallback(
    (
      serviceCode: string,
      vehicleCategoryCode?: string
    ): ServiceTariff | null => {
      const service = getService(serviceCode);
      if (!service) return null;

      if (!vehicleCategoryCode) {
        return service.tariffs.length === 1
          ? service.tariffs[0]
          : null;
      }

      return (
        service.tariffs.find(
          (t) => t.vehicleCategory?.code === vehicleCategoryCode
        ) ?? null
      );
    },
    [getService]
  );

  // ---------------------------------------------------------
  // Flags deprecated (transition)
  // ---------------------------------------------------------

  const isUrbain = hasActivity('URBAN');
  const isInterurbain = hasActivity('INTERURBAN');

  const isLoading = authLoading || isConfigLoading;

  return (
    <OrganizationContext.Provider
      value={{
        organization: mergedOrganization,
        activities,
        isLoading,
        isConfigLoading,
        configError,
        hasActivity,
        hasService,
        getService,
        getTariff,
        getActivityServices,
        isUrbain,
        isInterurbain,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  return useContext(OrganizationContext);
}
