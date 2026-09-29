import { Building2, ChevronRight } from 'lucide-react';
import type { Organization } from '../types/api';

interface PartnerCardProps {
  organization: Organization;
  active?: boolean;
  onClick: (organization: Organization) => void;
}

export function PartnerCard({
  organization,
  active = false,
  onClick,
}: PartnerCardProps) {
  return (
    <button
      type="button"
      className={`partner-card${active ? ' partner-card--active' : ''}`}
      onClick={() => onClick(organization)}
    >
      <div className="partner-card__logo">
        {organization.logo ? (
          <img
            src={organization.logo}
            alt=""
            className="partner-card__logo-image"
          />
        ) : (
          <Building2 size={32} aria-hidden="true" />
        )}
      </div>

      <div className="partner-card__content">
        <strong className="partner-card__name">
          {organization.name}
        </strong>

        <span className="partner-card__plan">
          {organization.plan}
        </span>
      </div>

      <ChevronRight size={22} aria-hidden="true" />
    </button>
  );
}