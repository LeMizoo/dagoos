import { Building2, Star } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { PartnerCarousel } from '../components/PartnerCarousel';
import { PartnerSearch } from '../components/PartnerSearch';
import { useOrganizations } from '../hooks/useOrganizations';
import { useBranding } from '../hooks/useBranding';
import type { Organization } from '../types/api';

export function HomePage() {
  const navigate = useNavigate();
  const { selectOrganization } = useBranding();
  const { organizations, loading, error, refetch } = useOrganizations();
  const [query, setQuery] = useState('');

  const handleSelect = async (organization: Organization) => {
    await selectOrganization(organization.slug);
    navigate('/course');
  };

  return (
    <main className="home-page">
      <header className="home-page__header">
        <div className="home-page__brand">
          <Building2 size={28} aria-hidden="true" />
          <div>
            <strong>DAGOO&apos;S</strong>
            <span>Chez les potes, ça roule.</span>
          </div>
        </div>
      </header>

      <section className="home-page__intro">
        <h1>Choisissez un service</h1>
      </section>

      <section className="home-page__partners">
        <div className="home-page__section-title">
          <h2>
            <Star size={18} aria-hidden="true" />
            Nos partenaires
          </h2>
          <p>Des flottes et coopératives qui utilisent DAGOO&apos;S</p>
        </div>

        <PartnerSearch
          organizations={organizations}
          query={query}
          onQueryChange={setQuery}
          onSelect={handleSelect}
        />

        {loading && (
          <div className="home-page__state">Chargement...</div>
        )}

        {!loading && error && (
          <div className="home-page__state home-page__state--error">
            <p>Impossible de charger les partenaires</p>
            <button type="button" onClick={refetch}>
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && organizations.length === 0 && (
          <div className="home-page__state">
            Aucun partenaire disponible
          </div>
        )}

        {!loading && !error && organizations.length > 0 && (
          <>
            <PartnerCarousel
              organizations={organizations}
              onSelect={handleSelect}
            />

            <p className="home-page__count">
              {organizations.length} organisation
              {organizations.length > 1 ? 's' : ''} partenaire
              {organizations.length > 1 ? 's' : ''}
            </p>
          </>
        )}
      </section>
    </main>
  );
}