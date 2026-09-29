// ============================================================
// Pages — Course
// Phase 1 — Étape 1.6.d
//
// Parcours urbain : demande de taxi.
//   - 2 modes de mise en relation : 'choisir' | 'toutes'
//   - mode 'proche' (géoloc) reporté en Phase 2
//   - estimation via POST /public/estimate
//   - envoi via POST /public/actions (type COURSE_REQUEST)
//   - garde défensive : /course réservé aux FLEET_MANAGER
//
// Porté de apps/dagoos-mobile/pages/course.js
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Car } from 'lucide-react';
import { useBranding } from '../hooks/useBranding';
import { useCourseRequest } from '../hooks/useCourseRequest';
import { useEstimate } from '../hooks/useEstimate';
import { useOrganizations } from '../hooks/useOrganizations';
import { storage } from '../services/storage';
import type { TypeVehicule } from '../types/api';

// ------------------------------------------------------------
// Constantes
// ------------------------------------------------------------

type Mode = 'choisir' | 'toutes';

const VEHICULES: { value: TypeVehicule; label: string }[] = [
  { value: 'moto', label: 'Taxi moto' },
  { value: 'voiture', label: 'Taxi voiture' },
];

const ERROR_MESSAGES: Record<string, string> = {
  'Service TAXI non configuré':
    "Cette flotte n'a pas encore configuré ses tarifs",
  'Activité urbaine non configurée':
    "Cette flotte n'a pas encore configuré ses tarifs",
  'Tarif V2 non configuré pour MOTO sur TAXI':
    "Cette flotte n'a pas encore configuré ses tarifs",
  'Tarif V2 non configuré pour VOITURE sur TAXI':
    "Cette flotte n'a pas encore configuré ses tarifs",
  'Organisation introuvable':
    'Flotte introuvable, veuillez recharger la page',
};

function formatEstimateError(message: string): string {
  return ERROR_MESSAGES[message] ?? message;
}

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------

export function CoursePage() {
  const navigate = useNavigate();

  const {
    slug: brandingSlug,
    organization,
    selectOrganization,
  } = useBranding();

  const { organizations, loading: loadingOrganizations } =
    useOrganizations();

  const {
    estimate,
    loading: estimating,
    error: estimateError,
    compute,
    reset: resetEstimate,
  } = useEstimate();

  const { submit, loading: submitting } = useCourseRequest();

  // ----------------------------------------------------------
  // État du formulaire
  // ----------------------------------------------------------

  const passenger = useMemo(() => storage.getPassenger(), []);

  const [mode, setMode] = useState<Mode>('choisir');
  const [nom, setNom] = useState(passenger?.name ?? '');
  const [tel, setTel] = useState(passenger?.phone ?? '');
  const [depart, setDepart] = useState(storage.getTripDepart() ?? '');
  const [arrivee, setArrivee] = useState(storage.getTripArrivee() ?? '');
  const [typeVehicule, setTypeVehicule] =
    useState<TypeVehicule>('moto');
  const [flotteSlug, setFlotteSlug] = useState<string>(
    brandingSlug ?? ''
  );
  const [offreClient, setOffreClient] = useState<string>('');

  // ----------------------------------------------------------
  // Garde défensive : /course est réservé aux FLEET_MANAGER.
  // Si une autre organisation est sélectionnée, on redirige.
  // ----------------------------------------------------------

  useEffect(() => {
    if (organization && organization.type !== 'FLEET_MANAGER') {
      navigate('/location', { replace: true });
    }
  }, [organization, navigate]);

  // Flottes urbaines uniquement.
  const flottes = useMemo(
    () =>
      organizations.filter(
        (organization) => organization.type === 'FLEET_MANAGER'
      ),
    [organizations]
  );

  // ----------------------------------------------------------
  // Reset estimation quand les champs changent
  // ----------------------------------------------------------

  useEffect(() => {
    resetEstimate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depart, arrivee, typeVehicule, flotteSlug, mode]);

  // ----------------------------------------------------------
  // Sélection de flotte
  // ----------------------------------------------------------

  function handleFlotteChange(slug: string) {
    setFlotteSlug(slug);

    if (slug) {
      void selectOrganization(slug);
    }
  }

  // ----------------------------------------------------------
  // Estimation
  // ----------------------------------------------------------

  async function handleEstimate() {
    const slug = mode === 'toutes' ? flottes[0]?.slug : flotteSlug;

    if (!slug) {
      alert('Veuillez choisir une flotte');
      return;
    }

    if (!depart || !arrivee) {
      alert('Renseignez départ et arrivée');
      return;
    }

    storage.setTripDepart(depart);
    storage.setTripArrivee(arrivee);

    await compute({
      organizationSlug: slug,
      depart,
      arrivee,
      typeVehicule,
    });
  }

  // ----------------------------------------------------------
  // Envoi de la demande
  // ----------------------------------------------------------

  async function handleSubmit() {
    const trimmedNom = nom.trim();
    const trimmedTel = tel.trim();

    if (!trimmedNom || !trimmedTel) {
      alert('Remplissez votre nom et téléphone');
      return;
    }

    if (!depart || !arrivee) {
      alert('Remplissez départ et arrivée');
      return;
    }

    const hasOffre = Number(offreClient) > 0;

    if (!estimate && !hasOffre) {
      alert(
        "Veuillez d'abord obtenir une estimation ou saisir votre offre en Ar"
      );
      return;
    }

    storage.setPassenger({
      name: trimmedNom,
      phone: trimmedTel,
    });

    storage.setTripDepart(depart);
    storage.setTripArrivee(arrivee);

    const details = {
      depart,
      arrivee,
      typeVehicule,
      mode,
      ...(hasOffre ? { offreClient: Number(offreClient) } : {}),
    };

    if (mode === 'toutes') {
      if (flottes.length === 0) {
        alert('Aucune flotte disponible');
        return;
      }

      let sent = 0;

      for (const fleet of flottes) {
        const result = await submit({
          organizationSlug: fleet.slug,
          type: 'COURSE_REQUEST',
          clientNom: trimmedNom,
          clientTel: trimmedTel,
          details,
        });

        if (result && result.ok !== false) {
          sent++;
        }
      }

      if (sent === 0) {
        alert('Aucune demande n’a pu être envoyée');
        return;
      }

      alert(`Demande envoyée à ${sent} flotte(s) !`);
      navigate('/suivi');
      return;
    }

    if (!flotteSlug) {
      alert('Veuillez choisir une flotte');
      return;
    }

    const result = await submit({
      organizationSlug: flotteSlug,
      type: 'COURSE_REQUEST',
      clientNom: trimmedNom,
      clientTel: trimmedTel,
      details,
    });

    if (result?.codeSuivi) {
      storage.setLastCode(result.codeSuivi);

      alert(
        `Demande envoyée !\n\nCode de suivi : ${result.codeSuivi}`
      );

      navigate('/suivi');
      return;
    }

    alert(result?.error ?? 'Erreur envoi');
  }

  // ----------------------------------------------------------
  // Rendu
  // ----------------------------------------------------------

  const canEstimate =
    mode === 'toutes' || Boolean(flotteSlug);

  return (
    <div>
      <div
        style={{
          background: 'var(--bg-surface)',
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Car size={22} aria-hidden="true" />

        <div
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: 'var(--accent)',
          }}
        >
          Demander un taxi
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          Choisissez comment vous voulez être mis en relation
        </p>

        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 16,
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => setMode('choisir')}
            style={{
              padding: '8px 12px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid var(--accent)',
              background:
                mode === 'choisir'
                  ? 'var(--accent)'
                  : 'var(--bg-surface)',
              color:
                mode === 'choisir'
                  ? 'var(--text-on-accent)'
                  : 'var(--accent)',
            }}
          >
            Choisir une flotte
          </button>

          <button
            type="button"
            onClick={() => setMode('toutes')}
            style={{
              padding: '8px 12px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid var(--accent)',
              background:
                mode === 'toutes'
                  ? 'var(--accent)'
                  : 'var(--bg-surface)',
              color:
                mode === 'toutes'
                  ? 'var(--text-on-accent)'
                  : 'var(--accent)',
            }}
          >
            Toutes les flottes
          </button>
        </div>

        <div
          style={{
            background: 'var(--bg-surface)',
            borderRadius: 14,
            padding: 16,
          }}
        >
          <input
            type="text"
            placeholder="Votre nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            style={inputStyle}
          />

          <input
            type="tel"
            placeholder="Votre téléphone"
            value={tel}
            onChange={(e) => setTel(e.target.value)}
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Adresse de départ"
            value={depart}
            onChange={(e) => setDepart(e.target.value)}
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Adresse d'arrivée"
            value={arrivee}
            onChange={(e) => setArrivee(e.target.value)}
            style={inputStyle}
          />

          <select
            value={typeVehicule}
            onChange={(e) =>
              setTypeVehicule(e.target.value as TypeVehicule)
            }
            style={inputStyle}
          >
            {VEHICULES.map((vehicle) => (
              <option key={vehicle.value} value={vehicle.value}>
                {vehicle.label}
              </option>
            ))}
          </select>

          {mode === 'choisir' && (
            <>
              <select
                value={flotteSlug}
                onChange={(e) =>
                  handleFlotteChange(e.target.value)
                }
                style={inputStyle}
                disabled={loadingOrganizations}
              >
                <option value="">-- Choisir une flotte --</option>

                {flottes.map((fleet) => (
                  <option key={fleet.slug} value={fleet.slug}>
                    {fleet.name}
                  </option>
                ))}
              </select>

              <p
                style={{
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: 11,
                  marginBottom: 8,
                }}
              >
                Choisissez une flotte puis saisissez départ et
                arrivée pour voir l'estimation
              </p>
            </>
          )}

          <button
            type="button"
            onClick={handleEstimate}
            disabled={!canEstimate || estimating}
            style={{
              width: '100%',
              padding: 10,
              marginTop: 4,
              background: 'var(--bg-soft)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
              cursor: canEstimate ? 'pointer' : 'not-allowed',
              opacity:
                !canEstimate || estimating ? 0.5 : 1,
            }}
          >
            {estimating
              ? 'Estimation en cours…'
              : "Obtenir l'estimation"}
          </button>

          {(estimate || estimateError) && (
            <div
              style={{
                marginTop: 12,
                background: 'var(--bg-soft)',
                borderRadius: 12,
                padding: 16,
                border: `1px solid ${
                  estimateError
                    ? 'var(--error-fg)'
                    : 'var(--accent)'
                }`,
              }}
            >
              {estimateError ? (
                <p
                  style={{
                    textAlign: 'center',
                    color: 'var(--error-fg)',
                    fontSize: 12,
                    padding: 4,
                  }}
                >
                  {formatEstimateError(estimateError.message)}
                </p>
              ) : (
                <>
                  <p
                    style={{
                      textAlign: 'center',
                      color: 'var(--accent)',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Estimation
                  </p>

                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Distance approximative
                  </div>

                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 800,
                      color: 'var(--accent)',
                    }}
                  >
                    {estimate?.distanceKm} km
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                      marginTop: 8,
                    }}
                  >
                    Prix de la course
                  </div>

                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      color: 'var(--accent)',
                    }}
                  >
                    {Number(
                      estimate?.prixEstime
                    ).toLocaleString('fr-FR')}{' '}
                    Ar
                  </div>
                </>
              )}

              <input
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="Votre offre (Ar)"
                value={offreClient}
                onChange={(e) =>
                  setOffreClient(e.target.value)
                }
                style={{
                  ...inputStyle,
                  textAlign: 'center',
                  marginTop: 8,
                }}
              />

              <p
                style={{
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: 10,
                  marginTop: 4,
                }}
              >
                Proposez votre prix — le chauffeur accepte ou
                refuse
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%',
              padding: 14,
              marginTop: 12,
              background: 'var(--accent)',
              color: 'var(--text-on-accent)',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              cursor: submitting ? 'wait' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting
              ? 'Envoi en cours…'
              : mode === 'toutes'
                ? 'Envoyer à toutes les flottes'
                : 'Demander un taxi'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Styles partagés
// ------------------------------------------------------------

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 12,
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg-page)',
  color: 'var(--text-primary)',
  marginBottom: 8,
  fontSize: 14,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};