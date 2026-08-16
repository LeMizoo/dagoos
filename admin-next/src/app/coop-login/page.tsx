'use client';

import { Suspense } from 'react';

import LoginForm, {
  type LoginFormConfig,
} from '@/components/auth/LoginForm';

const config: LoginFormConfig = {
  endpoint: '/api/auth/coop-login',
  defaultRedirect: '/coop',
  title: 'Dagoo Coop',
  description: 'Gérez votre coopérative de chauffeurs',
  badge: 'Coopérative',
  emailPlaceholder: 'coop@exemple.mg',
  submitLabel: 'Accéder à mon espace',
  loadingLabel: 'Connexion...',
  accent: 'emerald',
  icon: 'building',
  registration: true,
};

export default function CoopLoginPage() {
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
