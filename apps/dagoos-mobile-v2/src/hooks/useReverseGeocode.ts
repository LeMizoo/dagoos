// ============================================================
// Hooks — useReverseGeocode
// Phase 2 — Étape 2.1.b.2
//
// GET /public/reverse-geocode?lat=...&lng=...
// Convertit une position GPS en adresse lisible.
//
// Responsabilité unique :
//   - ne gère pas la géolocalisation navigateur
//   - reçoit lat/lng
//   - appelle l'API backend
//   - retourne l'adresse ou null
// ============================================================

import { useCallback, useState } from 'react';
import { apiGetSafe } from '../services/api';
import type { ReverseGeocodeResponse } from '../types/api';

export interface UseReverseGeocodeResult {
  address: string | null;
  loading: boolean;
  error: Error | null;
  reverseGeocode: (
    lat: number,
    lng: number
  ) => Promise<string | null>;
  reset: () => void;
}

export function useReverseGeocode(): UseReverseGeocodeResult {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reverseGeocode = useCallback(
    async (
      lat: number,
      lng: number
    ): Promise<string | null> => {
      setLoading(true);
      setError(null);

      const endpoint =
        '/public/reverse-geocode?lat=' +
        encodeURIComponent(lat) +
        '&lng=' +
        encodeURIComponent(lng);

      const result = await apiGetSafe<ReverseGeocodeResponse | null>(
        endpoint,
        null
      );

      if (result?.adresse) {
        setAddress(result.adresse);
        setError(null);
        setLoading(false);
        return result.adresse;
      }

      const e = new Error(
        'Adresse introuvable à partir de votre position.'
      );

      setAddress(null);
      setError(e);
      setLoading(false);
      return null;
    },
    []
  );

  const reset = useCallback(() => {
    setAddress(null);
    setError(null);
  }, []);

  return {
    address,
    loading,
    error,
    reverseGeocode,
    reset,
  };
}
