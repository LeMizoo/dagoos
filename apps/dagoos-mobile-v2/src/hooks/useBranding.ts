// ============================================================
// Hooks — useBranding
// Phase 1 — Étape 1.3
// ============================================================

import { useContext } from 'react';
import {
  BrandingContext,
  type BrandingContextValue,
} from '../contexts/brandingContextValue';

export function useBranding(): BrandingContextValue {
  const ctx = useContext(BrandingContext);

  if (!ctx) {
    throw new Error(
      'useBranding doit être utilisé dans <BrandingProvider>'
    );
  }

  return ctx;
}
