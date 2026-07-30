'use client';
import { useState } from 'react';
import { Settings, Globe, User, CreditCard, Bell } from 'lucide-react';
import LandingPageSettings from '@/components/settings/LandingPageSettings';

export default function CoopSettingsPage() {
  const [tab, setTab] = useState('landing');

  const tabs = [
    { id: 'landing', icon: Globe, label: 'Landing Page' },
    { id: 'profile', icon: User, label: 'Profil' },
    { id: 'plan', icon: CreditCard, label: 'Abonnement' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Paramètres</h1>
      <div className="flex gap-4">
        <div className="w-48 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition text-left ${
                    tab === t.id ? 'bg-emerald-600 text-white font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex-1">
          {tab === 'landing' && <LandingPageSettings app="coop" />}
          {tab === 'profile' && <div className="bg-white rounded-xl p-6 border">Profil (bientôt)</div>}
          {tab === 'plan' && <div className="bg-white rounded-xl p-6 border">Abonnement (bientôt)</div>}
        </div>
      </div>
    </div>
  );
}
