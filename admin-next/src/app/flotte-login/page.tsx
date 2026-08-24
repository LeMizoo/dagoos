'use client';

import { Suspense } from 'react';
import LoginForm, { type LoginFormConfig } from '@/components/auth/LoginForm';

const config: LoginFormConfig = {
  endpoint: '/api/auth/flotte-login',
  defaultRedirect: '/flotte',
  title: "Dagoo's Flotte",
  description: 'Administration unifiée de votre flotte',
  badge: 'Espace Flotte',
  emailPlaceholder: 'votre@email.mg',
  submitLabel: 'Accéder à mon espace',
  loadingLabel: 'Connexion...',
  accent: 'blue',
  icon: 'truck',
  registration: false,
};

export default function FlotteLoginPage() {
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
