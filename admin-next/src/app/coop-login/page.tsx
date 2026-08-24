'use client';

import { Suspense } from 'react';

import LoginForm, {
  type LoginFormConfig,
} from '@/components/auth/LoginForm';

const config: LoginFormConfig = {
  endpoint: '/api/auth/coop-login',
  defaultRedirect: '/coop',
  title: "Dagoo's Coopérative",
  description: 'Administration de votre coopérative',
  badge: 'Espace Coopérative',
  emailPlaceholder: 'votre@email.mg',
  submitLabel: 'Accéder à mon espace',
  loadingLabel: 'Connexion...',
  accent: 'emerald',
  icon: 'building',
  registration: false,
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
