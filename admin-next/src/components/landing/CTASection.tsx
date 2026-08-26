'use client';

import { useState } from 'react';
import LoginModal from '@/components/landing/LoginModal';

export default function CTASection() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <section className="py-16 bg-gradient-to-r from-primary to-dark text-white text-center">
        <h2 className="font-display text-3xl font-bold mb-4">Rejoignez le réseau Dago</h2>
        <p className="text-white/80 mb-8">Gérez votre activité de transport depuis un espace unique</p>
        <button
          onClick={() => setShowLoginModal(true)}
          className="inline-block bg-secondary text-dark px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-400 transition"
        >
          Accéder à mon espace
        </button>
      </section>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}
