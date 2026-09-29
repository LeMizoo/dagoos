import { createContext } from 'react';
import type { Organization } from '../types/api';

export interface BrandingContextValue {
  organization: Organization | null;
  slug: string | null;
  selectOrganization: (slug: string) => Promise<Organization | null>;
  clearOrganization: () => void;
}

export const BrandingContext = createContext<BrandingContextValue | null>(null);
