// ============================================================
// Pages — Reservations
// Phase 1 — Étape 1.7.b
//
// Parcours réservation interurbaine :
//   Écran 1 → liste des départs
//   Écran 2 → choix des places + informations passagers
//
// Source métier :
//   GET  /public/organizations
//   POST /public/reservations/batch
//
// Règles backend conservées côté serveur :
//   - maximum 5 places par téléphone
//   - places déjà réservées
//   - départ publié et futur
//   - génération OTP
//
// La référence de paiement n'est pas envoyée :
// le backend actuel ne la consomme pas.
// ============================================================

import { ArrowLeft, CalendarDays, Clock, RefreshCw } from 'lucide-react';
import { useMemo, useState, type CSSProperties } from 'react';
import { BusSeatMap } from '../components/BusSeatMap';
import { PassengerForm } from '../components/PassengerForm';
import { useDeparts } from '../hooks/useDeparts';
import { useReservations } from '../hooks/useReservations';
import { storage } from '../services/storage';
import type { Depart } from '../types/api';

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

// ------------------------------------------------------------
// Écran 1 — Liste des départs
// ------------------------------------------------------------

interface DepartListProps {
  departs: Depart[];
  loading: boolean;
  error: Error | null;
  onRefresh: () => void;
  onSelect: (depart: Depart) => void;
}

function DepartList({
  departs,
  loading,
  error,
  onRefresh,
  onSelect,
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

      {error ? (
        <div
          role="alert"
          style={{
            ...cardStyle,
            borderColor: 'var(--error-fg)',
            color: 'var(--error-fg)',
          }}
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
          style={{
            ...cardStyle,
            borderColor: 'var(--error-fg)',
            color: 'var(--error-fg)',
          }}
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
          style={{
            ...cardStyle,
            borderColor: 'var(--error-fg)',
            color: 'var(--error-fg)',
          }}
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
// Page principale
// ------------------------------------------------------------

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

  const [selectedDepart, setSelectedDepart] = useState<Depart | null>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [passengers, setPassengers] = useState<Record<string, string>>({});
  const [telephone, setTelephone] = useState('');

  const sortedSelectedPlaces = useMemo(
    () => sortPlaces(selectedPlaces),
    [selectedPlaces]
  );

  const handleSelectDepart = (depart: Depart) => {
    reset();
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
      storage.setLastCode(response.otpCode);

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

  return (
    <DepartList
      departs={departs}
      loading={departsLoading}
      error={departsError}
      onRefresh={refetch}
      onSelect={handleSelectDepart}
    />
  );
}