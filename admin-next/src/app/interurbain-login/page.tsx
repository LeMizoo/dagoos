'use client';

import { Suspense } from 'react';
import LoginForm, { type LoginFormConfig } from '@/components/auth/LoginForm';

const config: LoginFormConfig = {
  endpoint: '/api/auth/interurbain-login',
  defaultRedirect: '/flotte/interurbain',
  title: 'Transport Interurbain',
  description: 'Taxi-brousse, Transferts privés entre villes',
  badge: 'Inter-urbain',
  emailPlaceholder: 'votre@email.mg',
  submitLabel: 'Accéder à l\'espace Inter-urbain',
  loadingLabel: 'Connexion...',
  accent: 'emerald',
  icon: 'building',
  registration: false,
};

export default function InterurbainLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <LoginForm config={config} />
    </Suspense>
  );
}
