interface VehicleIconProps {
  type: 'moto' | 'bus' | 'truck' | 'van' | 'semi';
  className?: string;
}

export default function VehicleIcon({ type, className = '' }: VehicleIconProps) {
  const icons: Record<string, JSX.Element> = {
    moto: (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <circle cx="24" cy="30" r="10" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="14" cy="30" r="5" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="34" cy="30" r="5" stroke="currentColor" strokeWidth="2.5" />
        <path d="M10 24h8l4-10h4l4 10h8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M26 14l2 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <line x1="24" y1="8" x2="24" y2="14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    bus: (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <rect x="4" y="10" width="40" height="24" rx="4" stroke="currentColor" strokeWidth="2.5" />
        <line x1="14" y1="10" x2="14" y2="34" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="10" cy="36" r="3" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="38" cy="36" r="3" stroke="currentColor" strokeWidth="2.5" />
        <rect x="18" y="14" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="30" y="14" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    truck: (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <rect x="2" y="14" width="28" height="18" rx="3" stroke="currentColor" strokeWidth="2.5" />
        <path d="M30 14h6l8 10v8h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="10" cy="34" r="3.5" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="38" cy="34" r="3.5" stroke="currentColor" strokeWidth="2.5" />
      </svg>
    ),
    van: (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <rect x="4" y="14" width="40" height="20" rx="4" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="12" cy="36" r="3.5" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="36" cy="36" r="3.5" stroke="currentColor" strokeWidth="2.5" />
        <rect x="14" y="18" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="28" y="18" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
        <line x1="26" y1="18" x2="26" y2="26" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    semi: (
      <svg viewBox="0 0 48 48" className={className} fill="none">
        <rect x="2" y="10" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2.5" />
        <path d="M20 10h18l6 14v10h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="8" cy="36" r="3.5" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="36" cy="36" r="3.5" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="20" cy="36" r="2" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  };

  return icons[type] || icons.truck;
}
