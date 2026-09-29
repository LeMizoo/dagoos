// ============================================================
// Pages — Home
// Phase 1 — Catalogue partenaires
//
// Routage selon le type d'organisation :
//   FLEET_MANAGER  → /course       (taxi urbain)
//   COOPERATIVE    → /location     (location interurbaine)
//   Autre          → /home         (fallback)
//
// ⚠️ Ce routage pourra être affiné en 1.8 selon les services
// réels de chaque organisation (LOCATION_INTERURBAINE,
// LOCATION_URBAINE, TAXI, etc.).
// ============================================================

import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { PartnerCarousel } from '../components/PartnerCarousel';
import { PartnerSearch } from '../components/PartnerSearch';
import { useBranding } from '../hooks/useBranding';
import { useOrganizations } from '../hooks/useOrganizations';
import type { Organization } from '../types/api';

export function HomePage() {
  const navigate = useNavigate();
  const { selectOrganization } = useBranding();
  const { organizations, loading, error, refetch } = useOrganizations();
  const [query, setQuery] = useState('');

  const handleSelect = async (organization: Organization) => {
    await selectOrganization(organization.slug);

    if (organization.type === 'FLEET_MANAGER') {
      navigate('/course');
      return;
    }

    if (organization.type === 'COOPERATIVE') {
      navigate('/location');
      return;
    }

    navigate('/home');
  };

  return (
    <main className="home-page">
      <header className="home-page__header">
        <div className="home-page__brand">
          <Building2 size={28} aria-hidden="true" />

          <div>
            <strong>DAGOO’S</strong>
            <span>Mobilité simple, rapide et accessible</span>
          </div>
        </div>
      </header>

      <section className="home-page__intro">
        <h1>Choisissez un service</h1>
        <p>
          Sélectionnez un partenaire pour accéder aux services
          disponibles.
        </p>
      </section>

      <section className="home-page__partners">
        <div className="home-page__section-title">
          <div>
            <h2>Nos partenaires</h2>
            <p>
              Choisissez la flotte ou la coopérative avec laquelle
              vous souhaitez continuer.
            </p>
          </div>
        </div>

        <PartnerSearch
          organizations={organizations}
          query={query}
          onQueryChange={setQuery}
          onSelect={handleSelect}
        />

        {loading && (
          <div className="home-page__state">
            Chargement des partenaires…
          </div>
        )}

        {error && !loading && (
          <div className="home-page__state home-page__state--error">
            <p>
              Impossible de charger les partenaires.
            </p>

            <button type="button" onClick={refetch}>
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && organizations.length === 0 && (
          <div className="home-page__state">
            Aucun partenaire disponible.
          </div>
        )}

        {!loading && !error && organizations.length > 0 && (
          <>
            <PartnerCarousel
              organizations={organizations}
              onSelect={handleSelect}
            />

            <div className="home-page__count">
              {organizations.length}{' '}
              {organizations.length > 1
                ? 'partenaires disponibles'
                : 'partenaire disponible'}
            </div>
          </>
        )}
      </section>
    </main>
  );
}