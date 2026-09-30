// ============================================================
// Hooks — useReservationManage
// Phase 2.1.a.2
//
// POST /public/reservations/manage
// Gère la consultation, la modification et l'annulation
// d'une réservation existante via un code OTP.
//
// 3 helpers exposés :
//   - list()   : consultation des réservations PENDING du client
//   - cancel() : annulation d'une réservation
//   - modify() : changement de place
//
// Le backend renvoie les erreurs métier dans le body
// (`{ error }`) sans throw HTTP — on les convertit en `Error`
// côté hook, comme dans useReservations.
// ============================================================

import { useCallback, useState } from 'react';
import { apiPost } from '../services/api';
import type {
  ManageReservationRequest,
  ManageReservationResponse,
  ReservationFull,
} from '../types/api';

// ------------------------------------------------------------
// Paramètres exposés par les helpers
// ------------------------------------------------------------

export interface ManageListParams {
  telephone: string;
  passagerNom: string;
  otpCode: string;
}

export interface ManageCancelParams extends ManageListParams {
  reservationId: string;
}

export interface ManageModifyParams extends ManageCancelParams {
  nouvellePlace: string;
}

// ------------------------------------------------------------
// Hook
// ------------------------------------------------------------

export interface UseReservationManageResult {
  loading: boolean;
  error: Error | null;

  /** Lecture des réservations PENDING du client. */
  list: (params: ManageListParams) => Promise<ReservationFull[] | null>;

  /** Annulation d'une réservation. `true` si ok. */
  cancel: (params: ManageCancelParams) => Promise<boolean>;

  /** Changement de place. `true` si ok. */
  modify: (params: ManageModifyParams) => Promise<boolean>;

  /** Réinitialise error. */
  reset: () => void;
}

export function useReservationManage(): UseReservationManageResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // ----------------------------------------------------------
  // Appel générique /manage
  // Retourne la réponse brute ou null si erreur métier.
  // ----------------------------------------------------------
  const call = useCallback(
    async (
      payload: ManageReservationRequest
    ): Promise<ManageReservationResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiPost<ManageReservationResponse>(
          '/public/reservations/manage',
          payload
        );

        // Cas métier : backend renvoie { error } sans throw HTTP.
        if (result && typeof result === 'object' && result.error) {
          setError(new Error(result.error));
          return null;
        }

        return result;
      } catch (err) {
        const wrapped =
          err instanceof Error ? err : new Error(String(err));
        setError(wrapped);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ----------------------------------------------------------
  // list
  // ----------------------------------------------------------
  const list = useCallback(
    async (params: ManageListParams): Promise<ReservationFull[] | null> => {
      const result = await call({
        telephone: params.telephone,
        passagerNom: params.passagerNom,
        otpCode: params.otpCode,
      });

      if (!result) return null;

      return Array.isArray(result.reservations) ? result.reservations : [];
    },
    [call]
  );

  // ----------------------------------------------------------
  // cancel
  // ----------------------------------------------------------
  const cancel = useCallback(
    async (params: ManageCancelParams): Promise<boolean> => {
      const result = await call({
        telephone: params.telephone,
        passagerNom: params.passagerNom,
        otpCode: params.otpCode,
        action: 'cancel',
        reservationId: params.reservationId,
      });

      return result?.ok === true;
    },
    [call]
  );

  // ----------------------------------------------------------
  // modify
  // ----------------------------------------------------------
  const modify = useCallback(
    async (params: ManageModifyParams): Promise<boolean> => {
      const result = await call({
        telephone: params.telephone,
        passagerNom: params.passagerNom,
        otpCode: params.otpCode,
        action: 'modify',
        reservationId: params.reservationId,
        nouvellePlace: params.nouvellePlace,
      });

      return result?.ok === true;
    },
    [call]
  );

  // ----------------------------------------------------------
  // reset
  // ----------------------------------------------------------
  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { loading, error, list, cancel, modify, reset };
}
