import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiGetSafe } from '../services/api';
import { storage } from '../services/storage';
import type { Organization } from '../types/api';
import {
  BrandingContext,
  type BrandingContextValue,
} from './brandingContextValue';

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

const DEFAULT_PRIMARY = '#E0A01C';
const DEFAULT_SECONDARY = '#06245F';

function normalizeColor(
  value: string | null | undefined,
  fallback: string
): string {
  if (!value) {
    return fallback;
  }

  return HEX_RE.test(value) ? value : fallback;
}

function applyCssVars(primary: string, secondary: string): void {
  document.documentElement.style.setProperty('--dagoo-primary', primary);
  document.documentElement.style.setProperty('--dagoo-secondary', secondary);
}

function clearCssVars(): void {
  document.documentElement.style.removeProperty('--dagoo-primary');
  document.documentElement.style.removeProperty('--dagoo-secondary');
}

interface BrandingProviderProps {
  children: ReactNode;
}

export function BrandingProvider({
  children,
}: BrandingProviderProps): ReactNode {
  const [organization, setOrganization] =
    useState<Organization | null>(null);

  const [slug, setSlug] = useState<string | null>(() =>
    storage.getSelectedFleetSlug()
  );

  const selectOrganization = useCallback(
    async (nextSlug: string): Promise<Organization | null> => {
      if (!nextSlug) {
        return null;
      }

      setSlug(nextSlug);
      storage.setSelectedFleetSlug(nextSlug);

      const org = await apiGetSafe<Organization | null>(
        '/public/organizations/' + encodeURIComponent(nextSlug),
        null
      );

      if (!org) {
        return null;
      }

      const primary = normalizeColor(
        org.primaryColor,
        DEFAULT_PRIMARY
      );

      const secondary = normalizeColor(
        org.secondaryColor,
        DEFAULT_SECONDARY
      );

      applyCssVars(primary, secondary);

      const payload = {
        id: String(org.id ?? org.slug),
        name: org.name,
        slug: org.slug,
      } as Parameters<typeof storage.setBranding>[0];

      if (org.logo !== undefined) {
        payload.logo = org.logo;
      }

      if (org.slogan !== undefined) {
        payload.slogan = org.slogan;
      }

      if (primary !== undefined) {
        payload.primaryColor = primary;
      }

      if (secondary !== undefined) {
        payload.secondaryColor = secondary;
      }

      storage.setBranding(payload);
      setOrganization(org);

      return org;
    },
    []
  );

  const clearOrganization = useCallback(() => {
    setOrganization(null);
    setSlug(null);
    clearCssVars();
  }, []);

  useEffect(() => {
    if (!slug) {
      return;
    }

    const cachedBranding = storage.getBranding();

    if (!cachedBranding) {
      return;
    }

    const primary = normalizeColor(
      cachedBranding.primaryColor,
      DEFAULT_PRIMARY
    );

    const secondary = normalizeColor(
      cachedBranding.secondaryColor,
      DEFAULT_SECONDARY
    );

    applyCssVars(primary, secondary);
  }, [slug]);

  const value = useMemo<BrandingContextValue>(
    () => ({
      organization,
      slug,
      selectOrganization,
      clearOrganization,
    }),
    [organization, slug, selectOrganization, clearOrganization]
  );

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
}
