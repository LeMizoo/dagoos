'use client';
import { useState, useEffect } from 'react';
import { Truck, Building2, Check, Zap } from 'lucide-react';
import Link from 'next/link';

interface Plan {
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
    fetch('/api/public/plans')
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
          <button
            onClick={() => setActiveTab('FLEET_MANAGER')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition text-sm ${
              activeTab === 'FLEET_MANAGER'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-100 border'
            }`}
          >
            <Truck size={18} /> Gestion de Flotte
          </button>
          <button
            onClick={() => setActiveTab('COOPERATIVE')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition text-sm ${
              activeTab === 'COOPERATIVE'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-100 border'
            }`}
          >
            <Building2 size={18} /> Coopérative
          </button>
        </div>

        {/* Description */}
        <p className="text-center text-gray-500 text-sm mb-8">
          {activeTab === 'FLEET_MANAGER' ? 'Gérez vos véhicules et chauffeurs' : 'Multi-sociétés et livraisons'}
        </p>

        {/* Plans */}
        {loading ? (
          <div className="text-center text-gray-400 py-8">Chargement des plans...</div>
        ) : (
          <div className="grid md:grid-cols-4 gap-4">
            {filteredPlans.map(plan => (
              <div
                key={plan.name}
                className={`bg-white rounded-2xl p-6 text-center border-2 transition hover:shadow-lg ${
                  plan.name === 'Premium' ? 'border-yellow-400 relative' : 'border-gray-100'
                }`}
              >
                {plan.name === 'Premium' && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                    <Zap size={12} /> Recommandé
                  </span>
                )}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 ${
                  plan.name === 'Freemium' ? 'bg-gray-100' :
                  plan.name === 'Basic' ? 'bg-blue-100' :
                  plan.name === 'Standard' ? 'bg-purple-100' : 'bg-yellow-100'
                }`}>
                  <Check size={20} className={
                    plan.name === 'Freemium' ? 'text-gray-500' :
                    plan.name === 'Basic' ? 'text-blue-600' :
                    plan.name === 'Standard' ? 'text-purple-600' : 'text-yellow-600'
                  } />
                </div>
                <span className="text-xs text-gray-400 uppercase tracking-wider">{plan.name}</span>
                <div className="text-2xl font-bold text-gray-800 mt-2">
                  {plan.price === 0 ? 'Gratuit' : `${plan.price.toLocaleString()} Ar`}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {plan.vehiclesMax} véhicule{plan.vehiclesMax > 1 ? 's' : ''} · {plan.driversMax} chauffeur{plan.driversMax > 1 ? 's' : ''}
                </p>
                <div className="mt-4 space-y-2">
                  <Link
                    href="/register"
                    className={`block w-full py-2 rounded-lg text-sm font-semibold transition ${
                      plan.name === 'Premium'
                        ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Créer un compte
                  </Link>
                  <Link
                    href={activeTab === 'FLEET_MANAGER' ? '/fleet-login' : '/coop-login'}
                    className="block w-full py-2 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                  >
                    Se connecter
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Note Premium */}
        <p className="text-center text-xs text-gray-400 mt-6">
          💡 Les plans Premium incluent une landing page personnalisée accessible via dago-mobility.vercel.app/fleet/votre-nom
        </p>
      </div>
    </section>
  );
}
