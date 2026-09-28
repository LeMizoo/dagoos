// ============================================================
// Storage — Wrapper localStorage typé
// Phase 0 — Étape 0.13.3
// Namespace : dagoos_v2_*
// ============================================================

import type { PassengerInfo, StoredBranding } from '../types/storage';

const PREFIX = 'dagoos_v2_';

// ------------------------------------------------------------
// Bas niveau : get/set avec préfixe
// ------------------------------------------------------------

function getRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch (err) {
    console.warn('[storage] getItem échoué pour', key, err);
    return null;
  }
}

function setRaw(key: string, value: string): void {
  try {
    window.localStorage.setItem(PREFIX + key, value);
  } catch (err) {
    console.warn('[storage] setItem échoué pour', key, err);
  }
}

function getJson<T>(key: string): T | null {
  const raw = getRaw(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn('[storage] JSON.parse échoué pour', key, err);
    return null;
  }
}

function setJson<T>(key: string, value: T): void {
  try {
    setRaw(key, JSON.stringify(value));
  } catch (err) {
    console.warn('[storage] JSON.stringify échoué pour', key, err);
  }
}

// ------------------------------------------------------------
// API typée
// ------------------------------------------------------------

export const storage = {
  // Passager
  getPassenger(): PassengerInfo | null {
    return getJson<PassengerInfo>('passenger_info');
  },
  setPassenger(info: PassengerInfo): void {
    setJson('passenger_info', info);
  },

  // Branding
  getBranding(): StoredBranding | null {
    return getJson<StoredBranding>('branding');
  },
  setBranding(branding: StoredBranding): void {
    setJson('branding', branding);
  },

  // Code de suivi
  getLastCode(): string | null {
    return getRaw('last_code');
  },
  setLastCode(code: string): void {
    setRaw('last_code', code);
  },

  // OTP
  getLastOtp(): string | null {
    return getRaw('last_otp');
  },
  setLastOtp(otp: string): void {
    setRaw('last_otp', otp);
  },

  // Flotte sélectionnée
  getSelectedFleetSlug(): string | null {
    return getRaw('selected_fleet_slug');
  },
  setSelectedFleetSlug(slug: string): void {
    setRaw('selected_fleet_slug', slug);
  },

  // Trajet départ
  getTripDepart(): string | null {
    return getRaw('trip_depart');
  },
  setTripDepart(depart: string): void {
    setRaw('trip_depart', depart);
  },

  // Trajet arrivée
  getTripArrivee(): string | null {
    return getRaw('trip_arrivee');
  },
  setTripArrivee(arrivee: string): void {
    setRaw('trip_arrivee', arrivee);
  },

  // Nettoyage complet du namespace dagoos_v2_*
  clear(): void {
    try {
      const keys = Object.keys(window.localStorage).filter((k) =>
        k.startsWith(PREFIX)
      );
      keys.forEach((k) => window.localStorage.removeItem(k));
    } catch (err) {
      console.warn('[storage] clear échoué', err);
    }
  },
};
