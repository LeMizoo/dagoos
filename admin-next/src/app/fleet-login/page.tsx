'use client';

import { Suspense } from 'react';

import LoginForm, {
  type LoginFormConfig,
} from '@/components/auth/LoginForm';

const config: LoginFormConfig = {
  endpoint: '/api/auth/fleet-login',
  defaultRedirect: '/fleet',
  title: 'Dagoo Fleet',
  description: 'Gérez votre flotte de véhicules',
  badge: 'Gestionnaire de flotte',
  emailPlaceholder: 'fleet@exemple.mg',
  submitLabel: 'Accéder à mon espace',
  loadingLabel: 'Connexion...',
  accent: 'blue',
  icon: 'truck',
  registration: true,
};

export default function FleetLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Chargement...
        </div>
      }
    >
      <LoginForm config={config} />
    </Suspense>
  );
}
