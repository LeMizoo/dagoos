// ============================================================
// Hooks — useGeolocation
// Phase 2.1.b.1
//
// Wrapper React autour de navigator.geolocation.
// Aucun appel réseau : uniquement la position GPS brute.
//
// Fallback :
//   - géoloc non supportée → error explicite
//   - permission refusée   → error explicite
//   - timeout              → error explicite
//
// L'appelant (Course.tsx mode 'proche') peut alors :
//   - soit utiliser position,
//   - soit laisser l'utilisateur saisir manuellement (fallback Q1=B).
// ============================================================

import { useCallback, useState } from 'react';
import type { ActionPosition } from '../types/api';

// ------------------------------------------------------------
// Options par défaut
// ------------------------------------------------------------

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
};

// ------------------------------------------------------------
// Messages d'erreur lisibles
// ------------------------------------------------------------

function describeGeolocationError(
  err: GeolocationPositionError
): string {
  switch (err.code) {
    case 1:
      return 'Géolocalisation refusée. Saisissez votre départ manuellement.';
    case 2:
      return 'Position indisponible. Vérifiez votre GPS.';
    case 3:
      return 'Délai dépassé lors de la recherche de votre position.';
    default:
      return 'Impossible d’obtenir votre position.';
  }
}

// ------------------------------------------------------------
// Hook
// ------------------------------------------------------------

export interface UseGeolocationResult {
  position: ActionPosition | null;
  loading: boolean;
  error: Error | null;

  /** Demande la position courante. Retourne la position ou null. */
  getPosition: () => Promise<ActionPosition | null>;

  /** Réinitialise position et error. */
  reset: () => void;
}

export function useGeolocation(): UseGeolocationResult {
  const [position, setPosition] = useState<ActionPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getPosition = useCallback(
    async (): Promise<ActionPosition | null> => {
      setLoading(true);
      setError(null);

      // Cas 1 : API absente
      if (
        typeof navigator === 'undefined' ||
        !('geolocation' in navigator)
      ) {
        const e = new Error(
          'Géolocalisation non supportée par ce navigateur.'
        );
        setError(e);
        setLoading(false);
        return null;
      }

      // Cas 2 : tentative de position
      return new Promise<ActionPosition | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const next: ActionPosition = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            };
            setPosition(next);
            setError(null);
            setLoading(false);
            resolve(next);
          },
          (err) => {
            const e = new Error(describeGeolocationError(err));
            setPosition(null);
            setError(e);
            setLoading(false);
            resolve(null);
          },
          GEOLOCATION_OPTIONS
        );
      });
    },
    []
  );

  const reset = useCallback(() => {
    setPosition(null);
    setError(null);
  }, []);

  return { position, loading, error, getPosition, reset };
}
