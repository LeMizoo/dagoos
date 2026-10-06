// ============================================================
// Pages — Suivi
// Phase 1 — Étape 1.9.c
//
// Écran de suivi par code :
//   - Input code (pré-rempli avec storage.getLastCode())
//   - Bouton « Suivre »
//   - Affichage du statut, du trajet, du prix, de la négociation
//
// Route plein écran : /suivi (pas d'onglet BottomNav).
// Le code est aussi lisible depuis l'URL : /suivi?code=DG-XXXX
// ============================================================

import { useEffect, useState, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router';
import {
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import { useSuivi } from '../hooks/useSuivi';
import { useSuiviEvents } from '../hooks/useSuiviEvents';
import { storage } from '../services/storage';
import type { SuiviEventsResponse, SuiviResponse } from '../types/api';

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

const inputStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: 12,
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg-page)',
  color: 'var(--text-primary)',
  fontSize: 14,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  textTransform: 'uppercase',
};

const primaryButtonStyle: CSSProperties = {
  minHeight: 44,
  border: 0,
  borderRadius: 8,
  background: 'var(--accent)',
  color: 'var(--text-on-accent)',
  fontFamily: 'inherit',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
  padding: '10px 16px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const secondaryTextStyle: CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: 12,
};

// ------------------------------------------------------------
// Libellés de statut
// ------------------------------------------------------------

const STATUT_LABELS: Record<string, string> = {
  NEW: 'En attente',
  ACCEPTED: 'Acceptée',
  REJECTED: 'Refusée',
  CANCELLED: 'Annulée',
};

function statutLabel(statut: string): string {
  return STATUT_LABELS[statut] ?? statut;
}

function statutColor(statut: string): string {
  if (statut === 'ACCEPTED') return 'var(--success-fg)';
  if (statut === 'REJECTED' || statut === 'CANCELLED') return 'var(--error-fg)';
  return 'var(--accent)';
}

function statutIcon(statut: string) {
  if (statut === 'ACCEPTED') return <CheckCircle2 size={42} />;
  if (statut === 'REJECTED' || statut === 'CANCELLED') return <XCircle size={42} />;
  return <Clock size={42} />;
}

// ------------------------------------------------------------
// Formatage
// ------------------------------------------------------------

function formatPrice(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return new Intl.NumberFormat('fr-FR').format(value) + ' Ar';
}

// ------------------------------------------------------------
// Carte résultat
// ------------------------------------------------------------

interface SuiviCardProps {
  suivi: SuiviResponse;
}

function SuiviCard({ suivi }: SuiviCardProps) {
  const color = statutColor(suivi.statut);
  const label = statutLabel(suivi.statut);

  // Prix affiché : V2 (price) en priorité, sinon legacy (prixEstime)
  const displayPrice = suivi.price ?? suivi.prixEstime ?? null;

  // Négociation éventuelle
  const neg = suivi.negotiation;
  const negotiationAwaitingDriver =
    neg && neg.status === 'EN_ATTENTE_TRANSPORTEUR';
  const negotiationPending =
    neg && neg.status === 'PROPOSITION_EN_ATTENTE_CLIENT';

  return (
    <>
      <div style={{ ...cardStyle, textAlign: 'center' }}>
        <div style={{ color, marginBottom: 8 }}>{statutIcon(suivi.statut)}</div>

        <h1
          style={{
            fontSize: 20,
            fontWeight: 800,
            margin: '0 0 4px',
            color,
          }}
        >
          {label}
        </h1>

        <p
          style={{
            ...secondaryTextStyle,
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Code : {suivi.codeSuivi}
        </p>
      </div>

      <div style={cardStyle}>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            marginBottom: 4,
          }}
        >
          Client
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 10,
          }}
        >
          {suivi.clientNom || '-'}
        </div>

        <div
          style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            marginBottom: 4,
          }}
        >
          Trajet
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 10,
          }}
        >
          {suivi.depart || '-'} → {suivi.arrivee || '-'}
        </div>

        {suivi.type && (
          <>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-secondary)',
                marginBottom: 4,
              }}
            >
              Type
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-primary)',
              }}
            >
              {suivi.type}
              {suivi.typeVehicule ? ` — ${suivi.typeVehicule}` : ''}
            </div>
          </>
        )}
      </div>

      {displayPrice !== null && (
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              marginBottom: 4,
            }}
          >
            Prix
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: 'var(--accent)',
            }}
          >
            {formatPrice(displayPrice)}
          </div>

          {suivi.estimated && (
            <div
              style={{
                ...secondaryTextStyle,
                marginTop: 6,
              }}
            >
              Estimation indicative
            </div>
          )}
        </div>
      )}

      {(suivi.offreClient !== null ||
        suivi.contreOffreChauffeur !== null ||
        negotiationAwaitingDriver ||
        negotiationPending) && (
        <div style={cardStyle}>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-secondary)',
              marginBottom: 8,
            }}
          >
            Négociation
          </div>

          {suivi.offreClient !== null && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
                fontSize: 13,
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>
                Votre offre
              </span>
              <strong style={{ color: 'var(--success-fg)' }}>
                {formatPrice(suivi.offreClient)}
              </strong>
            </div>
          )}

          {suivi.contreOffreChauffeur !== null && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
                fontSize: 13,
              }}
            >
              <span style={{ color: 'var(--text-secondary)' }}>
                Contre-offre chauffeur
              </span>
              <strong style={{ color: 'var(--info-fg)' }}>
                {formatPrice(suivi.contreOffreChauffeur)}
              </strong>
            </div>
          )}

          {negotiationAwaitingDriver && (
            <div
              style={{
                marginTop: 10,
                padding: 10,
                background: 'var(--accent-soft)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--text-primary)',
                lineHeight: 1.4,
              }}
            >
              Votre demande est en attente d'un chauffeur pour la négociation.
            </div>
          )}

          {negotiationPending && (
            <div
              style={{
                marginTop: 10,
                padding: 10,
                background: 'var(--accent-soft)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--text-primary)',
                lineHeight: 1.4,
              }}
            >
              Le chauffeur vous a proposé{' '}
              <strong>{formatPrice(neg.proposedPrice ?? null)}</strong>.
              <br />
              Consultez la page de gestion pour accepter ou refuser.
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ------------------------------------------------------------
// Timeline — rendu visuel (Phase 2.4.4.c)
// ------------------------------------------------------------

const EVENT_TYPE_LABELS: Record<string, string> = {
  LEAD_CREATED: 'Demande créée',
  PRICE_ESTIMATED: 'Prix estimé',
  NEGOTIATION_OPENED_BY_CLIENT: 'Négociation ouverte',
  NEGOTIATION_OFFERED_TO_CLIENT: 'Proposition envoyée',
  NEGOTIATION_ACCEPTED_BY_CLIENT: 'Négociation acceptée',
  NEGOTIATION_REFUSED_BY_CLIENT: 'Négociation refusée',
  NEGOTIATION_EXPIRED: 'Négociation expirée',
  LEAD_ACCEPTED: 'Demande acceptée',
  LEAD_REJECTED: 'Demande refusée',
};

function eventTypeLabel(type: string): string {
  return EVENT_TYPE_LABELS[type] ?? type;
}

const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function formatOccurredAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return dateTimeFormatter.format(date);
}

interface SuiviTimelineProps {
  data: SuiviEventsResponse;
}

function SuiviTimeline({ data }: SuiviTimelineProps) {
  return (
    <div style={cardStyle}>
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-secondary)',
          marginBottom: 8,
        }}
      >
        Historique
      </div>

      {data.partial && (
        <div
          style={{
            marginBottom: 10,
            padding: 8,
            borderRadius: 8,
            background: 'var(--accent-soft)',
            fontSize: 11,
            color: 'var(--text-secondary)',
            lineHeight: 1.4,
          }}
        >
          Historique partiel — certains événements peuvent manquer.
        </div>
      )}

      {data.events.length === 0 ? (
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}
        >
          Aucun événement
        </div>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
        >
          {data.events.map((event, index) => (
            <li
              key={event.id}
              style={{
                paddingTop: index === 0 ? 0 : 8,
                paddingBottom: 8,
                borderTop:
                  index === 0 ? 'none' : '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {eventTypeLabel(event.type)}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatOccurredAt(event.occurredAt)}
                </span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                }}
              >
                {event.actor}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------

export function SuiviPage() {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') ?? storage.getLastCode() ?? '';

  const [code, setCode] = useState(initialCode);
  const { suivi, loading, error, fetchSuivi, reset } = useSuivi();
  const {
    events,
    fetchEvents,
    reset: resetEvents,
  } = useSuiviEvents();

  // Si un code est passé dans l'URL, on lance la recherche automatiquement.
  // Snapshot et Timeline sont chargés en parallèle, indépendamment.
  useEffect(() => {
    if (initialCode) {
      void Promise.allSettled([
        fetchSuivi(initialCode),
        fetchEvents(initialCode),
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    void Promise.allSettled([fetchSuivi(code), fetchEvents(code)]);
  };

  const handleReset = () => {
    reset();
    resetEvents();
    setCode('');
  };

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: 14 }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 800,
            margin: 0,
            color: 'var(--text-primary)',
          }}
        >
          Suivi de ma demande
        </h1>
        <p style={{ ...secondaryTextStyle, margin: '4px 0 0' }}>
          Saisissez votre code de suivi (ex. DG-8F3K)
        </p>
      </div>

      <div
        style={{
          ...cardStyle,
          display: 'flex',
          gap: 8,
          alignItems: 'stretch',
        }}
      >
        <input
          type="text"
          placeholder="DG-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
          style={inputStyle}
          spellCheck={false}
          autoCapitalize="characters"
        />

        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          style={{
            ...primaryButtonStyle,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? (
            <>
              <RefreshCw
                size={16}
                aria-hidden="true"
                style={{ animation: 'spin 1s linear infinite' }}
              />
              ...
            </>
          ) : (
            <>
              <Search size={16} aria-hidden="true" />
              Suivre
            </>
          )}
        </button>
      </div>

      {error && (
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
      )}

      {suivi && (
        <>
          <SuiviCard suivi={suivi} />

          {events && <SuiviTimeline data={events} />}

          <button
            type="button"
            onClick={handleReset}
            style={{
              width: '100%',
              minHeight: 44,
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--bg-page)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              padding: '10px 14px',
            }}
          >
            Nouvelle recherche
          </button>
        </>
      )}
    </div>
  );
}