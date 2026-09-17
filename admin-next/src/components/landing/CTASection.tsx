'use client';

import { useState } from 'react';
import RegisterModal from '@/components/landing/RegisterModal';
import LoginModal from '@/components/landing/LoginModal';

export default function CTASection() {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <section className="py-16 bg-gradient-to-r from-primary to-dark text-white text-center">
        <h2 className="font-display text-3xl font-bold mb-4">
          Rejoignez le réseau Dago
        </h2>

        <p className="text-white/80 mb-8">
          Gérez votre activité de transport depuis un espace unique
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => setShowRegisterModal(true)}
            className="inline-block bg-secondary text-dark px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-400 transition"
          >
            Créer mon espace
          </button>

          <button
            type="button"
            onClick={() => setShowLoginModal(true)}
            className="inline-block border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition"
          >
            Se connecter
          </button>
        </div>
      </section>

      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}
