import { Search, X } from 'lucide-react';
import type { Organization } from '../types/api';

interface PartnerSearchProps {
  organizations: Organization[];
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (organization: Organization) => void;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function PartnerSearch({
  organizations,
  query,
  onQueryChange,
  onSelect,
}: PartnerSearchProps) {
  const normalizedQuery = normalize(query.trim());

  const results =
    normalizedQuery.length === 0
      ? []
      : organizations
          .filter((organization) => {
            const haystack = normalize(
              [
                organization.name,
                organization.slug,
                organization.plan,
                organization.type,
              ].join(' ')
            );

            return haystack.includes(normalizedQuery);
          })
          .slice(0, 8);

  return (
    <div className="partner-search">
      <div className="partner-search__input-wrapper">
        <Search size={20} aria-hidden="true" />

        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Rechercher un partenaire..."
          aria-label="Rechercher un partenaire"
        />

        {query && (
          <button
            type="button"
            className="partner-search__clear"
            onClick={() => onQueryChange('')}
            aria-label="Effacer la recherche"
          >
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {results.length > 0 && (
        <div className="partner-search__results">
          {results.map((organization) => (
            <button
              key={organization.slug}
              type="button"
              className="partner-search__result"
              onClick={() => onSelect(organization)}
            >
              <span>{organization.name}</span>
              <small>{organization.plan}</small>
            </button>
          ))}
        </div>
      )}

      {normalizedQuery.length > 0 && results.length === 0 && (
        <div className="partner-search__empty">
          Aucun partenaire trouvé
        </div>
      )}
    </div>
  );
}