'use client';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Truck, Building2, Check, Zap, Mail } from 'lucide-react';
import Link from 'next/link';

interface Plan {
  id?: string;
  type: string;
  name: string;
  price: number;
  vehiclesMax: number;
  driversMax: number;
}

export default function PlansSection() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeTab, setActiveTab] = useState<'FLEET_MANAGER' | 'COOPERATIVE'>('FLEET_MANAGER');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/plans')
      .then(r => r.json())
      .then(data => setPlans(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredPlans = plans.filter(p => p.type === activeTab);

  return (
    <section id="plans" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Plans</h2>
        <p className="text-center text-gray-500 mb-4">Choisissez votre formule</p>
        <p className="text-center text-gray-400 text-sm mb-8">Créez votre compte gratuitement ou connectez-vous</p>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-10">
          <button type="button" aria-pressed={activeTab === 'FLEET_MANAGER'} onClick={() => setActiveTab('FLEET_MANAGER')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition text-sm ${
              activeTab === 'FLEET_MANAGER' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100 border'
            }`}>
            <Truck size={18} /> Gestion de Flotte
          </button>
          <button type="button" aria-pressed={activeTab === 'COOPERATIVE'} onClick={() => setActiveTab('COOPERATIVE')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition text-sm ${
              activeTab === 'COOPERATIVE' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100 border'
            }`}>
            <Building2 size={18} /> Coopérative
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mb-8">
          {activeTab === 'FLEET_MANAGER' ? 'Gérez vos véhicules et chauffeurs' : 'Multi-sociétés et livraisons'}
        </p>

        {loading ? (
          <div className="text-center text-gray-400 py-8">Chargement des plans...</div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredPlans.map(plan => (
              <div key={plan.name}
                className={`bg-white rounded-2xl p-5 text-center border-2 transition hover:shadow-lg relative ${
                  plan.name === 'Premium' ? 'border-yellow-400' :
                  plan.name === 'Sur devis' ? 'border-purple-400' : 'border-gray-100'
                }`}>
                {plan.name === 'Premium' && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                    <Zap size={12} /> Recommandé
                  </span>
                )}
                {plan.name === 'Sur devis' && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-400 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    Sur mesure
                  </span>
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 ${
                  plan.name === 'Freemium' ? 'bg-gray-100' :
                  plan.name === 'Basic' ? 'bg-blue-100' :
                  plan.name === 'Standard' ? 'bg-green-100' :
                  plan.name === 'Premium' ? 'bg-yellow-100' : 'bg-purple-100'
                }`}>
                  <Check size={20} className={
                    plan.name === 'Freemium' ? 'text-gray-500' :
                    plan.name === 'Basic' ? 'text-blue-600' :
                    plan.name === 'Standard' ? 'text-green-600' :
                    plan.name === 'Premium' ? 'text-yellow-600' : 'text-purple-600'
                  } />
                </div>
                <span className="text-xs text-gray-400 uppercase tracking-wider">{plan.name}</span>
                <div className="text-xl font-bold text-gray-800 mt-2">
                  {plan.price === -1 ? 'Sur devis' : plan.price === 0 ? 'Gratuit' : `${plan.price.toLocaleString()} Ar`}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {plan.vehiclesMax >= 999 ? 'Illimité' : `${plan.vehiclesMax} véhicule${plan.vehiclesMax > 1 ? 's' : ''}`} · {plan.driversMax >= 999 ? 'Illimité' : `${plan.driversMax} chauffeur${plan.driversMax > 1 ? 's' : ''}`}
                </p>
                <div className="mt-4 space-y-2">
                  {plan.name === 'Sur devis' ? (
                    <a href="mailto:contact@dagoos.mg"
                      className="block w-full py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition flex items-center justify-center gap-1">
                      <Mail size={14} /> Nous contacter
                    </a>
                  ) : (
                    <>
                      <Link href="/register"
                        className={`block w-full py-2 rounded-lg text-sm font-semibold transition ${
                          plan.name === 'Premium' ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}>
                        Créer un compte
                      </Link>
                      <Link href={activeTab === 'FLEET_MANAGER' ? '/fleet-login' : '/coop-login'}
                        className="block w-full py-2 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                        Se connecter
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
