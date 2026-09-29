// ============================================================
// Components — BottomNav
// Phase 1 — Étape 1.3
//
// Barre de navigation basse avec 3 onglets :
//   Urbain       → /course
//   Accueil      → /home
//   Interurbain  → /reservations
//
// Porté de apps/dagoos-mobile/index.html (.nav-bottom)
// ============================================================

import { NavLink } from 'react-router';
import { Building2, Home as HomeIcon, Bus } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  Icon: typeof Building2;
}

const ITEMS: NavItem[] = [
  { to: '/course', label: 'Urbain', Icon: Building2 },
  { to: '/home', label: 'Accueil', Icon: HomeIcon },
  { to: '/reservations', label: 'Interurbain', Icon: Bus },
];

export function BottomNav() {
  return (
    <nav className="nav-bottom" id="bottomNav">
      {ITEMS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            isActive ? 'active' : undefined
          }
        >
          <Icon size={22} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}