'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Rocket } from 'lucide-react';
import HeroSlider from '@/components/landing/HeroSlider';
import HeroParticles from '@/components/landing/HeroParticles';

export default function HeroWithDriverModal() {
  const [showDriverModal, setShowDriverModal] = useState(false);

  return (
    <section className="relative flex items-center justify-center bg-dark overflow-hidden py-16 md:py-20">
      <HeroParticles />
      <HeroSlider />
      <div className="absolute inset-0 bg-gradient-to-br from-dark/80 via-dark/70 to-primary/50 z-10" />
      <div className="relative z-20 max-w-5xl mx-auto px-4 text-center">
        <span className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm mb-6 backdrop-blur-sm border border-white/20">
          <Rocket size={16} className="text-secondary" /> Dago Mobility
        </span>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
          Voyagez malin,<br />
          <span className="text-secondary">réservez votre place en ligne.</span>
        </h1>
        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
          Réservez votre trajet en toute simplicité auprès des coopératives partenaires.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/register" className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition">
            🏢 Devenir partenaire
          </Link>
          <button onClick={() => setShowDriverModal(true)} className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition">
            🧑‍✈️ Espace Chauffeur
          </button>
        </div>
      </div>

      {/* Modale Espace Chauffeur */}
      {showDriverModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowDriverModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">🧑‍✈️ Espace Chauffeur</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Choisissez votre espace de travail</p>
            <div className="flex flex-col gap-4">
              <a href="https://dago-driver.pages.dev" target="_blank" rel="noopener noreferrer" className="bg-amber-500 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-amber-600 transition">
                🚕 Chauffeur Fleet
                <span className="block text-xs font-normal mt-1">Courses à la demande</span>
              </a>
              <a href="https://dago-coop-driver.pages.dev" target="_blank" rel="noopener noreferrer" className="bg-emerald-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition">
                🚌 Chauffeur Coop
                <span className="block text-xs font-normal mt-1">Transport commun & départs</span>
              </a>
            </div>
            <button onClick={() => setShowDriverModal(false)} className="mt-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition">
              Fermer
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
