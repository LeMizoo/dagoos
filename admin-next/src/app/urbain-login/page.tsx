'use client';

import { Suspense } from 'react';
import LoginForm, { type LoginFormConfig } from '@/components/auth/LoginForm';

const config: LoginFormConfig = {
  endpoint: '/api/auth/urbain-login',
  defaultRedirect: '/flotte/urbain',
  title: 'Transport Urbain',
  description: 'Taxis, Tuk-tuk, Pousse-pousse en ville',
  badge: 'Urbain',
  emailPlaceholder: 'votre@email.mg',
  submitLabel: 'Accéder à l\'espace Urbain',
  loadingLabel: 'Connexion...',
  accent: 'blue',
  icon: 'truck',
  registration: false,
};

export default function UrbainLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <LoginForm config={config} />
    </Suspense>
  );
}
