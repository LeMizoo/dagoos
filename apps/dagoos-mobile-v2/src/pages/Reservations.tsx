// ============================================================
// Pages — Reservations
// Phase 1 — Étape 1.7.b + 2.1.a.3
//
// Parcours réservation interurbaine :
//   Écran 1 → liste des départs
//   Écran 2 → choix des places + informations passagers
//   Écran 3 → gestion d'une réservation par OTP
//
// Source métier :
//   GET  /public/organizations
//   POST /public/reservations/batch
//   POST /public/reservations/manage
//
// Règles backend conservées côté serveur :
//   - maximum 5 places par téléphone
//   - places déjà réservées
//   - départ publié et futur
//   - génération OTP
//   - vérification OTP pour la gestion
//
// La référence de paiement n'est pas envoyée :
// le backend actuel ne la consomme pas.
//
// Sécurité :
//   - localStorage sert uniquement au préremplissage pratique
//   - le backend reste la source de vérité
//   - aucune décision métier critique n'est prise côté frontend
// ============================================================

import {
  ArrowLeft,
  CalendarDays,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import { BusSeatMap } from '../components/BusSeatMap';
import { PassengerForm } from '../components/PassengerForm';
import { useDeparts } from '../hooks/useDeparts';
import { useReservationManage } from '../hooks/useReservationManage';
import { useReservations } from '../hooks/useReservations';
import { storage } from '../services/storage';
import type { Depart, ReservationFull } from '../types/api';

// ------------------------------------------------------------
// Tri des places
// ------------------------------------------------------------

function sortPlaces(places: string[]): string[] {
  return [...places].sort((a, b) => {
    const numA = parseInt(a, 10);
    const numB = parseInt(b, 10);

    if (numA !== numB) {
      return numA - numB;
    }

    return a.localeCompare(b);
  });
}

// ------------------------------------------------------------
// Formatage
// ------------------------------------------------------------

function formatDate(date: string): string {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);
}

function formatPrice(prix: number): string {
  return new Intl.NumberFormat('fr-FR').format(prix);
}

// ------------------------------------------------------------
// Styles
// ------------------------------------------------------------

const pageStyle: CSSProperties = {
  padding: 16,
  paddingBottom: 96,
};

const cardStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 14,
  background: 'var(--bg-page)',
  marginBottom: 10,
};

const secondaryTextStyle: CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: 12,
};

const primaryButtonStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  border: 0,
  borderRadius: 8,
  background: 'var(--accent)',
  color: 'var(--text-on-accent)',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
  padding: '10px 14px',
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: 40,
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'var(--bg-page)',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  padding: '8px 12px',
};

const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 42,
  boxSizing: 'border-box',
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'var(--bg-page)',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  fontSize: 13,
  padding: '9px 11px',
};

const successBoxStyle: CSSProperties = {
  ...cardStyle,
  borderColor: 'var(--success-fg)',
  color: 'var(--success-fg)',
};

const errorBoxStyle: CSSProperties = {
  ...cardStyle,
  borderColor: 'var(--error-fg)',
  color: 'var(--error-fg)',
};

// ------------------------------------------------------------
// Écran 1 — Liste des départs
// ------------------------------------------------------------

interface DepartListProps {
  departs: Depart[];
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
  onSelect: (depart: Depart) => void;
  onManage: () => void;
}

function DepartList({
  departs,
  loading,
  error,
  onRefresh,
  onSelect,
  onManage,
}: DepartListProps) {
  return (
    <div style={pageStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 20,
              fontWeight: 800,
              margin: 0,
              color: 'var(--text-primary)',
            }}
          >
            Départs inter-urbains
          </h1>

          <p style={{ ...secondaryTextStyle, margin: '4px 0 0' }}>
            Choisissez votre départ
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Actualiser les départs"
          title="Actualiser"
          style={{
            ...secondaryButtonStyle,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            padding: 0,
            opacity: loading ? 0.6 : 1,
          }}
        >
          <RefreshCw
            size={18}
            aria-hidden="true"
            style={{
              animation: loading ? 'spin 1s linear infinite' : undefined,
            }}
          />
        </button>
      </div>

      <button
        type="button"
        onClick={onManage}
        style={{
          ...secondaryButtonStyle,
          width: '100%',
          marginBottom: 12,
        }}
      >
        Gérer ma réservation (OTP)
      </button>

      {error ? (
        <div
          role="alert"
          style={errorBoxStyle}
        >
          <strong>Impossible de charger les départs.</strong>

          <p style={{ fontSize: 12, margin: '6px 0 10px' }}>
            {error.message}
          </p>

          <button
            type="button"
            onClick={onRefresh}
            style={secondaryButtonStyle}
          >
            Réessayer
          </button>
        </div>
      ) : null}

      {loading && departs.length === 0 ? (
        <p style={secondaryTextStyle}>Chargement des départs...</p>
      ) : null}

      {!loading && !error && departs.length === 0 ? (
        <div style={cardStyle}>
          <p
            style={{
              ...secondaryTextStyle,
              textAlign: 'center',
              margin: 0,
            }}
          >
            Aucun départ disponible pour le moment.
          </p>
        </div>
      ) : null}

      {departs.map((depart) => {
        const reservedCount = depart.reservations?.length ?? 0;
        const totalSeats = depart.placesTotal || 26;
        const availableSeats = Math.max(totalSeats - reservedCount, 0);

        return (
          <article key={depart.id} style={cardStyle}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: 8,
              }}
            >
              {depart.pointDepart} → {depart.destination}
            </div>

            {depart.organizationName ? (
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--accent)',
                  marginBottom: 8,
                }}
              >
                {depart.organizationName}
              </div>
            ) : null}

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  ...secondaryTextStyle,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <CalendarDays size={14} aria-hidden="true" />
                {formatDate(depart.date)}
              </span>

              <span
                style={{
                  ...secondaryTextStyle,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Clock size={14} aria-hidden="true" />
                {depart.heure}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color:
                    availableSeats > 0
                      ? 'var(--text-secondary)'
                      : 'var(--error-fg)',
                  fontWeight: 700,
                }}
              >
                {availableSeats} place(s) disponible(s)
              </span>

              <strong
                style={{
                  fontSize: 15,
                  color: 'var(--text-primary)',
                }}
              >
                {formatPrice(depart.prix)} Ar
              </strong>
            </div>

            <button
              type="button"
              onClick={() => onSelect(depart)}
              disabled={availableSeats === 0}
              style={{
                ...primaryButtonStyle,
                opacity: availableSeats === 0 ? 0.5 : 1,
                cursor: availableSeats === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {availableSeats === 0 ? 'Complet' : 'Réserver'}
            </button>
          </article>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------
// Écran 2 — Réservation
// ------------------------------------------------------------

interface ReservationScreenProps {
  depart: Depart;
  selectedPlaces: string[];
  passengers: Record<string, string>;
  telephone: string;
  loading: boolean;
  error: Error | null;
  conflictPlaces: string[];
  onBack: () => void;
  onTogglePlace: (place: string) => void;
  onPassengerChange: (place: string, nom: string) => void;
  onTelephoneChange: (telephone: string) => void;
  onSubmit: () => void;
}

function ReservationScreen({
  depart,
  selectedPlaces,
  passengers,
  telephone,
  loading,
  error,
  conflictPlaces,
  onBack,
  onTogglePlace,
  onPassengerChange,
  onTelephoneChange,
  onSubmit,
}: ReservationScreenProps) {
  const reservedPlaces =
    depart.reservations?.map((reservation) => reservation.place) ?? [];

  const totalSeats = depart.placesTotal || 26;
  const availableSeats = Math.max(totalSeats - reservedPlaces.length, 0);

  const canSubmit = selectedPlaces.length > 0 && !loading;

  return (
    <div style={pageStyle}>
      <button
        type="button"
        onClick={onBack}
        style={{
          ...secondaryButtonStyle,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 12,
        }}
      >
        <ArrowLeft size={17} aria-hidden="true" />
        Retour aux départs
      </button>

      <div style={{ ...cardStyle, marginBottom: 14 }}>
        <h1
          style={{
            fontSize: 18,
            fontWeight: 800,
            margin: '0 0 8px',
            color: 'var(--text-primary)',
          }}
        >
          {depart.pointDepart} → {depart.destination}
        </h1>

        {depart.organizationName ? (
          <p
            style={{
              margin: '0 0 8px',
              color: 'var(--accent)',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {depart.organizationName}
          </p>
        ) : null}

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            ...secondaryTextStyle,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <CalendarDays size={14} aria-hidden="true" />
            {formatDate(depart.date)}
          </span>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Clock size={14} aria-hidden="true" />
            {depart.heure}
          </span>
        </div>
      </div>

      <div style={{ ...cardStyle, textAlign: 'center' }}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 800,
            margin: '0 0 12px',
            color: 'var(--text-primary)',
          }}
        >
          1. Choisissez vos places
        </h2>

        <BusSeatMap
          reservedPlaces={reservedPlaces}
          selectedPlaces={selectedPlaces}
          onToggle={onTogglePlace}
        />

        <div
          style={{
            marginTop: 14,
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 8,
            fontSize: 11,
            color: 'var(--text-secondary)',
          }}
        >
          <span>
            Disponibles : <strong>{availableSeats}</strong>
          </span>

          <span>
            Réservées : <strong>{reservedPlaces.length}</strong>
          </span>

          <span>
            Sélectionnées : <strong>{selectedPlaces.length}</strong>
          </span>
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: 12 }}>
        <PassengerForm
          selectedPlaces={selectedPlaces}
          passengers={passengers}
          onPassengerChange={onPassengerChange}
          telephone={telephone}
          onTelephoneChange={onTelephoneChange}
        />
      </div>

      {conflictPlaces.length > 0 ? (
        <div
          role="alert"
          style={errorBoxStyle}
        >
          Certaines places viennent d'être réservées :
          <strong> {conflictPlaces.join(', ')}</strong>.
          <br />
          Les disponibilités ont été rechargées.
        </div>
      ) : null}

      {error && conflictPlaces.length === 0 ? (
        <div
          role="alert"
          style={errorBoxStyle}
        >
          {error.message}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        style={{
          ...primaryButtonStyle,
          opacity: canSubmit ? 1 : 0.5,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        {loading
          ? 'Enregistrement...'
          : `Enregistrer la réservation (${selectedPlaces.length} place${
              selectedPlaces.length > 1 ? 's' : ''
            })`}
      </button>
    </div>
  );
}

// ------------------------------------------------------------
// Écran 3 — Gestion d'une réservation
// ------------------------------------------------------------

interface ReservationManageScreenProps {
  telephone: string;
  passagerNom: string;
  otpCode: string;
  reservations: ReservationFull[];
  loading: boolean;
  error: Error | null;
  validationError: string | null;
  message: string | null;
  placeEdits: Record<string, string>;
  onTelephoneChange: (value: string) => void;
  onPassagerNomChange: (value: string) => void;
  onOtpCodeChange: (value: string) => void;
  onPlaceChange: (reservationId: string, value: string) => void;
  onVerify: () => void;
  onModify: (reservation: ReservationFull) => void;
  onCancel: (reservation: ReservationFull) => void;
  onBack: () => void;
}

function ReservationManageScreen({
  telephone,
  passagerNom,
  otpCode,
  reservations,
  loading,
  error,
  validationError,
  message,
  placeEdits,
  onTelephoneChange,
  onPassagerNomChange,
  onOtpCodeChange,
  onPlaceChange,
  onVerify,
  onModify,
  onCancel,
  onBack,
}: ReservationManageScreenProps) {
  return (
    <div style={pageStyle}>
      <button
        type="button"
        onClick={onBack}
        style={{
          ...secondaryButtonStyle,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 12,
        }}
      >
        <ArrowLeft size={17} aria-hidden="true" />
        Retour aux départs
      </button>

      <div style={{ ...cardStyle, marginBottom: 14 }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 800,
            margin: '0 0 6px',
            color: 'var(--text-primary)',
          }}
        >
          Gérer ma réservation
        </h1>

        <p
          style={{
            ...secondaryTextStyle,
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Utilisez le téléphone, le nom du passager et le code OTP reçu lors
          de la réservation.
        </p>
      </div>

      <div style={cardStyle}>
        <div style={{ marginBottom: 10 }}>
          <label
            htmlFor="manage-telephone"
            style={{
              display: 'block',
              marginBottom: 5,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Téléphone
          </label>

          <input
            id="manage-telephone"
            type="tel"
            value={telephone}
            onChange={(event) => onTelephoneChange(event.target.value)}
            autoComplete="tel"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label
            htmlFor="manage-passager-nom"
            style={{
              display: 'block',
              marginBottom: 5,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Nom du passager
          </label>

          <input
            id="manage-passager-nom"
            type="text"
            value={passagerNom}
            onChange={(event) => onPassagerNomChange(event.target.value)}
            autoComplete="name"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label
            htmlFor="manage-otp"
            style={{
              display: 'block',
              marginBottom: 5,
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Code OTP
          </label>

          <input
            id="manage-otp"
            type="text"
            value={otpCode}
            onChange={(event) => onOtpCodeChange(event.target.value)}
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            style={inputStyle}
          />
        </div>

        {validationError ? (
          <div
            role="alert"
            style={{
              ...errorBoxStyle,
              marginBottom: 10,
            }}
          >
            {validationError}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onVerify}
          disabled={
            loading ||
            !telephone.trim() ||
            !passagerNom.trim() ||
            !otpCode.trim()
          }
          style={{
            ...primaryButtonStyle,
            opacity:
              loading ||
              !telephone.trim() ||
              !passagerNom.trim() ||
              !otpCode.trim()
                ? 0.5
                : 1,
            cursor:
              loading ||
              !telephone.trim() ||
              !passagerNom.trim() ||
              !otpCode.trim()
                ? 'not-allowed'
                : 'pointer',
          }}
        >
          {loading ? 'Vérification...' : 'Vérifier'}
        </button>
      </div>

      {error ? (
        <div
          role="alert"
          style={errorBoxStyle}
        >
          {error.message}
        </div>
      ) : null}

      {message ? (
        <div
          role="status"
          style={successBoxStyle}
        >
          {message}
        </div>
      ) : null}

      {reservations.length > 0 ? (
        <div>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '18px 0 10px',
            }}
          >
            Mes réservations
          </h2>

          {reservations.map((reservation) => {
            const depart = reservation.depart;
            const currentPlace =
              placeEdits[reservation.id] ?? reservation.place;

            return (
              <article
                key={reservation.id}
                style={{
                  ...cardStyle,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    marginBottom: 8,
                  }}
                >
                  {depart
                    ? `${depart.pointDepart} → ${depart.destination}`
                    : 'Trajet indisponible'}
                </div>

                {depart ? (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        ...secondaryTextStyle,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <CalendarDays size={14} aria-hidden="true" />
                      {formatDate(depart.date)}
                    </span>

                    <span
                      style={{
                        ...secondaryTextStyle,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Clock size={14} aria-hidden="true" />
                      {depart.heure}
                    </span>
                  </div>
                ) : null}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      background: 'var(--bg-secondary)',
                    }}
                  >
                    <div style={secondaryTextStyle}>Passager</div>
                    <strong
                      style={{
                        display: 'block',
                        marginTop: 3,
                        fontSize: 13,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {reservation.passagerNom}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      background: 'var(--bg-secondary)',
                    }}
                  >
                    <div style={secondaryTextStyle}>Statut</div>
                    <strong
                      style={{
                        display: 'block',
                        marginTop: 3,
                        fontSize: 13,
                        color:
                          reservation.statut === 'CANCELLED'
                            ? 'var(--error-fg)'
                            : 'var(--success-fg)',
                      }}
                    >
                      {reservation.statut}
                    </strong>
                  </div>
                </div>

                <div style={{ marginBottom: 10 }}>
                  <label
                    htmlFor={`reservation-place-${reservation.id}`}
                    style={{
                      display: 'block',
                      marginBottom: 5,
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    Place
                  </label>

                  <input
                    id={`reservation-place-${reservation.id}`}
                    type="text"
                    value={currentPlace}
                    onChange={(event) =>
                      onPlaceChange(reservation.id, event.target.value)
                    }
                    style={inputStyle}
                  />
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onModify(reservation)}
                    disabled={loading || !currentPlace.trim()}
                    style={{
                      ...primaryButtonStyle,
                      opacity:
                        loading || !currentPlace.trim() ? 0.5 : 1,
                      cursor:
                        loading || !currentPlace.trim()
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    Modifier la place
                  </button>

                  <button
                    type="button"
                    onClick={() => onCancel(reservation)}
                    disabled={loading}
                    style={{
                      ...secondaryButtonStyle,
                      width: '100%',
                      minHeight: 44,
                      opacity: loading ? 0.5 : 1,
                      cursor: loading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Annuler la réservation
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------
// Page principale
// ------------------------------------------------------------

type ReservationMode = 'create' | 'manage';

export function ReservationsPage() {
  const {
    departs,
    loading: departsLoading,
    error: departsError,
    refetch,
  } = useDeparts();

  const {
    loading: reservationLoading,
    error: reservationError,
    conflictPlaces,
    submit,
    reset,
  } = useReservations();

  const {
    loading: manageLoading,
    error: manageError,
    list: listManagedReservations,
    cancel: cancelManagedReservation,
    modify: modifyManagedReservation,
    reset: resetManage,
  } = useReservationManage();

  const [mode, setMode] = useState<ReservationMode>('create');

  const [selectedDepart, setSelectedDepart] = useState<Depart | null>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [passengers, setPassengers] = useState<Record<string, string>>({});
  const [telephone, setTelephone] = useState('');

  const [manageTelephone, setManageTelephone] = useState('');
  const [managePassagerNom, setManagePassagerNom] = useState('');
  const [manageOtpCode, setManageOtpCode] = useState('');
  const [managedReservations, setManagedReservations] = useState<
    ReservationFull[]
  >([]);
  const [manageValidationError, setManageValidationError] = useState<
    string | null
  >(null);
  const [manageMessage, setManageMessage] = useState<string | null>(null);
  const [placeEdits, setPlaceEdits] = useState<Record<string, string>>({});

  const sortedSelectedPlaces = useMemo(
    () => sortPlaces(selectedPlaces),
    [selectedPlaces]
  );

  const handleSelectDepart = (depart: Depart) => {
    reset();
    setMode('create');
    setSelectedDepart(depart);
    setSelectedPlaces([]);
    setPassengers({});
  };

  const handleBack = () => {
    reset();
    setSelectedDepart(null);
    setSelectedPlaces([]);
    setPassengers({});
  };

  const handleOpenManage = () => {
    resetManage();

    const passenger = storage.getPassenger();
    const lastOtp = storage.getLastOtp();

    setMode('manage');
    setSelectedDepart(null);
    setSelectedPlaces([]);
    setPassengers({});

    setManageTelephone(passenger?.phone ?? telephone);
    setManagePassagerNom(passenger?.name ?? '');
    setManageOtpCode(lastOtp ?? '');
    setManagedReservations([]);
    setManageValidationError(null);
    setManageMessage(null);
    setPlaceEdits({});
  };

  const handleBackFromManage = () => {
    resetManage();

    setMode('create');
    setManagedReservations([]);
    setManageValidationError(null);
    setManageMessage(null);
    setPlaceEdits({});
  };

  const handleTogglePlace = (place: string) => {
    setSelectedPlaces((current) => {
      if (current.includes(place)) {
        return current.filter((item) => item !== place);
      }

      return sortPlaces([...current, place]);
    });

    // Nettoyer le nom associé quand une place est désélectionnée
    setPassengers((current) => {
      if (!selectedPlaces.includes(place)) {
        return current;
      }
      const next = { ...current };
      delete next[place];
      return next;
    });
  };

  const handlePassengerChange = (place: string, nom: string) => {
    setPassengers((current) => ({
      ...current,
      [place]: nom,
    }));
  };

  const handleSubmit = async () => {
    if (!selectedDepart) {
      return;
    }

    if (selectedPlaces.length === 0) {
      alert('Veuillez sélectionner au moins une place.');
      return;
    }

    if (!telephone.trim()) {
      alert('Veuillez renseigner votre numéro de téléphone.');
      return;
    }

    const orderedPlaces = sortPlaces(selectedPlaces);

    const missingPassenger = orderedPlaces.find(
      (place) => !passengers[place]?.trim()
    );

    if (missingPassenger) {
      alert(
        `Veuillez renseigner le nom du passager pour la place ${missingPassenger}.`
      );
      return;
    }

    // Construction explicite avec narrowing
    const passagersPayload = orderedPlaces.map((place) => ({
      passagerNom: (passengers[place] ?? '').trim(),
      place,
    }));

    const outcome = await submit({
      departId: selectedDepart.id,
      telephone: telephone.trim(),
      passagers: passagersPayload,
    });

    // 409 — places en conflit : la valeur est disponible
    // directement via outcome.conflictPlaces (pas de stale closure).
    if (outcome.conflictPlaces.length > 0) {
      refetch();
      setSelectedPlaces([]);
      setPassengers({});
      return;
    }

    const response = outcome.response;

    if (!response) {
      // Erreur générique (réseau, 5xx, etc.) : déjà exposée via
      // reservationError du hook. On ne ré-affiche pas d'alerte ici
      // pour éviter le doublon avec le bandeau error.
      return;
    }

    if (response.otpCode) {
      const firstPassenger = orderedPlaces[0];

      if (firstPassenger) {
        const firstPassengerNom = (passengers[firstPassenger] ?? '').trim();

        if (firstPassengerNom) {
          storage.setPassenger({
            name: firstPassengerNom,
            phone: telephone.trim(),
          });
        }
      }

      storage.setLastOtp(response.otpCode);

      alert(
        `Réservation en attente !\n\nCode OTP : ${response.otpCode}\n\nConservez ce code pour gérer votre réservation.`
      );
    } else {
      alert(response.message ?? 'Réservation enregistrée avec succès.');
    }

    setSelectedPlaces([]);
    setPassengers({});
    setSelectedDepart(null);
    refetch();
  };

  const handleManageVerify = async () => {
    const telephoneValue = manageTelephone.trim();
    const passagerNomValue = managePassagerNom.trim();
    const otpCodeValue = manageOtpCode.trim();

    setManageValidationError(null);
    setManageMessage(null);
    resetManage();

    if (!telephoneValue || !passagerNomValue || !otpCodeValue) {
      setManageValidationError(
        'Veuillez renseigner le téléphone, le nom du passager et le code OTP.'
      );
      return;
    }

    const reservations = await listManagedReservations({
      telephone: telephoneValue,
      passagerNom: passagerNomValue,
      otpCode: otpCodeValue,
    });

    if (reservations === null) {
      setManagedReservations([]);
      return;
    }

    setManagedReservations(reservations);
    setPlaceEdits(
      reservations.reduce<Record<string, string>>((current, reservation) => {
        current[reservation.id] = reservation.place;
        return current;
      }, {})
    );

    if (reservations.length === 0) {
      setManageMessage('Aucune réservation à gérer.');
    }
  };

  const handleManageModify = async (reservation: ReservationFull) => {
    const nouvellePlace = (
      placeEdits[reservation.id] ?? reservation.place
    ).trim();

    if (!nouvellePlace) {
      setManageMessage(null);
      setManageValidationError('Veuillez renseigner une nouvelle place.');
      return;
    }

    setManageValidationError(null);
    setManageMessage(null);

    const success = await modifyManagedReservation({
      telephone: manageTelephone.trim(),
      passagerNom: managePassagerNom.trim(),
      otpCode: manageOtpCode.trim(),
      reservationId: reservation.id,
      nouvellePlace,
    });

    if (!success) {
      return;
    }

    setManageMessage('La place a été modifiée avec succès.');

    const reservations = await listManagedReservations({
      telephone: manageTelephone.trim(),
      passagerNom: managePassagerNom.trim(),
      otpCode: manageOtpCode.trim(),
    });

    if (reservations !== null) {
      setManagedReservations(reservations);
      setPlaceEdits(
        reservations.reduce<Record<string, string>>(
          (current, currentReservation) => {
            current[currentReservation.id] = currentReservation.place;
            return current;
          },
          {}
        )
      );
    }
  };

  const handleManageCancel = async (reservation: ReservationFull) => {
    const confirmed = window.confirm(
      'Voulez-vous vraiment annuler cette réservation ?'
    );

    if (!confirmed) {
      return;
    }

    setManageValidationError(null);
    setManageMessage(null);

    const success = await cancelManagedReservation({
      telephone: manageTelephone.trim(),
      passagerNom: managePassagerNom.trim(),
      otpCode: manageOtpCode.trim(),
      reservationId: reservation.id,
    });

    if (!success) {
      return;
    }

    setManageMessage('La réservation a été annulée avec succès.');

    const reservations = await listManagedReservations({
      telephone: manageTelephone.trim(),
      passagerNom: managePassagerNom.trim(),
      otpCode: manageOtpCode.trim(),
    });

    if (reservations !== null) {
      setManagedReservations(reservations);
      setPlaceEdits(
        reservations.reduce<Record<string, string>>(
          (current, currentReservation) => {
            current[currentReservation.id] = currentReservation.place;
            return current;
          },
          {}
        )
      );
    }
  };

  const handlePlaceChange = (reservationId: string, value: string) => {
    setPlaceEdits((current) => ({
      ...current,
      [reservationId]: value,
    }));
  };

  if (selectedDepart) {
    return (
      <ReservationScreen
        depart={selectedDepart}
        selectedPlaces={sortedSelectedPlaces}
        passengers={passengers}
        telephone={telephone}
        loading={reservationLoading}
        error={reservationError}
        conflictPlaces={conflictPlaces}
        onBack={handleBack}
        onTogglePlace={handleTogglePlace}
        onPassengerChange={handlePassengerChange}
        onTelephoneChange={setTelephone}
        onSubmit={() => {
          void handleSubmit();
        }}
      />
    );
  }

  if (mode === 'manage') {
    return (
      <ReservationManageScreen
        telephone={manageTelephone}
        passagerNom={managePassagerNom}
        otpCode={manageOtpCode}
        reservations={managedReservations}
        loading={manageLoading}
        error={manageError}
        validationError={manageValidationError}
        message={manageMessage}
        placeEdits={placeEdits}
        onTelephoneChange={setManageTelephone}
        onPassagerNomChange={setManagePassagerNom}
        onOtpCodeChange={setManageOtpCode}
        onPlaceChange={handlePlaceChange}
        onVerify={() => {
          void handleManageVerify();
        }}
        onModify={(reservation) => {
          void handleManageModify(reservation);
        }}
        onCancel={(reservation) => {
          void handleManageCancel(reservation);
        }}
        onBack={handleBackFromManage}
      />
    );
  }

  return (
    <DepartList
      departs={departs}
      loading={departsLoading}
      error={departsError}
      onRefresh={refetch}
      onSelect={handleSelectDepart}
      onManage={handleOpenManage}
    />
  );
}
