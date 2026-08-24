'use client';

import { Suspense } from 'react';

import LoginForm, {
  type LoginFormConfig,
} from '@/components/auth/LoginForm';

const config: LoginFormConfig = {
  endpoint: '/api/auth/login',
  defaultRedirect: '/dashboard',
  title: 'Dagoo Admin',
  description: "Plateforme d'administration",
  badge: 'Réservé aux administrateurs',
  emailPlaceholder: 'votre-email@exemple.mg',
  submitLabel: 'Se connecter',
  loadingLabel: 'Connexion...',
  accent: 'blue',
  icon: 'shield',
};

export default function LoginPage() {
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
