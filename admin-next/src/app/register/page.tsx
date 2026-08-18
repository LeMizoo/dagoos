'use client';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Truck, Building2 } from 'lucide-react';
import PasswordInput from '@/components/ui/PasswordInput';
import Link from 'next/link';

interface Plan {
  id?: string;
  type: 'FLEET_MANAGER' | 'COOPERATIVE';
  name: string;
  price: number;
  vehiclesMax: number;
  driversMax: number;
  features?: string[];
}

export default function RegisterPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    planId: '',
    organizationName: '',
    organizationType: 'FLEET_MANAGER' as 'FLEET_MANAGER' | 'COOPERATIVE',
    mvolaNumber: '',
    orangeNumber: '',
    airtelNumber: '',
    paiementRef: '',
  });
  const [captchaQ, setCaptchaQ] = useState({ a: 0, b: 0 });
  const [captchaA, setCaptchaA] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setCaptchaQ({ a: Math.floor(Math.random() * 10) + 1, b: Math.floor(Math.random() * 10) + 1 });
    apiFetch('/public/plans')
      .then(r => r.json())
      .then(data => {
        setPlans(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        // Fallback plans
        setPlans([
          { type: 'FLEET_MANAGER', name: 'Freemium', price: 0, vehiclesMax: 1, driversMax: 1 },
          { type: 'FLEET_MANAGER', name: 'Basic', price: 15000, vehiclesMax: 5, driversMax: 10 },
          { type: 'FLEET_MANAGER', name: 'Standard', price: 35000, vehiclesMax: 20, driversMax: 50 },
          { type: 'FLEET_MANAGER', name: 'Premium', price: 75000, vehiclesMax: 100, driversMax: 200 },
          { type: 'COOPERATIVE', name: 'Freemium', price: 0, vehiclesMax: 1, driversMax: 2 },
          { type: 'COOPERATIVE', name: 'Basic', price: 20000, vehiclesMax: 5, driversMax: 15 },
          { type: 'COOPERATIVE', name: 'Standard', price: 45000, vehiclesMax: 20, driversMax: 60 },
          { type: 'COOPERATIVE', name: 'Premium', price: 90000, vehiclesMax: 100, driversMax: 300 },
        ]);
        setLoading(false);
      });
  }, []);

  const filteredPlans = plans.filter(p => p.type === form.organizationType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!form.planId) {
      setError('Veuillez sélectionner un plan');
      return;
    }

    if (Number(captchaA) !== captchaQ.a + captchaQ.b) {
      setError('Captcha incorrect');
      setCaptchaQ({ a: Math.floor(Math.random() * 10) + 1, b: Math.floor(Math.random() * 10) + 1 });
      setCaptchaA('');
      return;
    }

    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.organizationType,
          organizationName: form.organizationName,
          planId: form.planId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'inscription');
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }
  };

  const getPlanEmoji = (name: string) => {
    switch(name) {
      case 'Freemium': return '🟢';
      case 'Basic': return '📘';
      case 'Standard': return '🟣';
      case 'Premium': return '💡';
      default: return '⚪';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Créer un compte</h1>
          <p className="text-gray-500">Choisissez votre type d'organisation et votre plan</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Formulaire */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type d'organisation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'organisation
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, organizationType: 'FLEET_MANAGER', planId: '' })}
                    className={`p-3 rounded-xl border-2 transition flex items-center justify-center gap-2 ${
                      form.organizationType === 'FLEET_MANAGER'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Truck size={18} />
                    Flotte
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, organizationType: 'COOPERATIVE', planId: '' })}
                    className={`p-3 rounded-xl border-2 transition flex items-center justify-center gap-2 ${
                      form.organizationType === 'COOPERATIVE'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Building2 size={18} />
                    Coopérative
                  </button>
                </div>
              </div>

              {/* Nom de l'organisation */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom de l'organisation</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.organizationName}
                  onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                  placeholder="Nom de votre flotte ou coopérative"
                />
              </div>

              {/* Plan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionnez votre plan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {filteredPlans.map(plan => (
                    <button
                      key={plan.name}
                      type="button"
                      onClick={() => setForm({ ...form, planId: plan.id || plan.name })}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        form.planId === (plan.id || plan.name)
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{getPlanEmoji(plan.name)}</span>
                        <span className="font-semibold text-sm">{plan.name}</span>
                      </div>
                      <div className="text-lg font-bold text-gray-800">
                        {plan.price === 0 ? 'Gratuit' : `${plan.price.toLocaleString()} Ar`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {plan.vehiclesMax} véhicules · {plan.driversMax} chauffeurs
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Informations utilisateur */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Votre nom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <PasswordInput
                  label="Mot de passe"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimum 6 caractères"
                  required
                  className="mt-1 border-gray-300 rounded-xl focus:ring-blue-500"
                />
              </div>

              <div>
                <PasswordInput
                  label="Confirmer le mot de passe"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="Confirmez votre mot de passe"
                  required
                  className="mt-1 border-gray-300 rounded-xl focus:ring-blue-500"
                />
              </div>

              {/* Numéros Mobile Money */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">📱 Numéros Mobile Money (pour recevoir les paiements)</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-yellow-400 rounded-lg px-3 py-2">
                    <span className="font-bold text-black text-xs w-16">MVola</span>
                    <input type="text" placeholder="034 00 000 00" value={form.mvolaNumber} onChange={e => setForm({ ...form, mvolaNumber: e.target.value })} className="flex-1 px-3 py-2 rounded bg-white text-black text-sm font-semibold outline-none" />
                  </div>
                  <div className="flex items-center gap-2 bg-black rounded-lg px-3 py-2">
                    <span className="font-bold text-orange-500 text-xs w-16">Orange</span>
                    <input type="text" placeholder="032 00 000 00" value={form.orangeNumber} onChange={e => setForm({ ...form, orangeNumber: e.target.value })} className="flex-1 px-3 py-2 rounded bg-gray-800 text-orange-400 text-sm font-semibold outline-none border border-orange-500/30" />
                  </div>
                  <div className="flex items-center gap-2 bg-red-600 rounded-lg px-3 py-2">
                    <span className="font-bold text-white text-xs w-16">Airtel</span>
                    <input type="text" placeholder="033 00 000 00" value={form.airtelNumber} onChange={e => setForm({ ...form, airtelNumber: e.target.value })} className="flex-1 px-3 py-2 rounded bg-white text-sm font-semibold outline-none" />
                  </div>
                </div>
              </div>

              {/* Réf de paiement */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Réf du transfert Mobile Money (optionnel)</label>
                <input
                  type="text"
                  value={form.paiementRef}
                  onChange={e => setForm({ ...form, paiementRef: e.target.value })}
                  placeholder="Ex: MVOLA123456789"
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Captcha */}
              <div className="flex items-center gap-2">
                <span className="font-semibold whitespace-nowrap">{captchaQ.a} + {captchaQ.b} = ?</span>
                <input
                  type="number"
                  value={captchaA}
                  onChange={e => setCaptchaA(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm">
                  ✅ Inscription réussie ! Redirection vers la connexion...
                </div>
              )}

              <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Chargement...' : 'Créer un compte'}
              </button>

              <p className="text-center text-sm text-gray-500">
                Déjà un compte ?{' '}
                <Link href="/login" className="text-blue-600 hover:underline">
                  Se connecter
                </Link>
              </p>
            </form>
          </div>

          {/* Résumé des plans */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Récapitulatif</h2>
            {loading ? (
              <p className="text-gray-400">Chargement...</p>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-semibold">
                    {form.organizationType === 'FLEET_MANAGER' ? '🚛 Gestion de Flotte' : '🏢 Coopérative'}
                  </p>
                </div>

                {form.organizationName && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Organisation</p>
                    <p className="font-semibold">{form.organizationName}</p>
                  </div>
                )}

                {form.planId && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Plan sélectionné</p>
                    {(() => {
                      const selected = filteredPlans.find(p => (p.id || p.name) === form.planId);
                      return selected ? (
                        <div>
                          <p className="font-semibold text-lg">{selected.name}</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {selected.price === 0 ? 'Gratuit' : `${selected.price.toLocaleString()} Ar`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {selected.vehiclesMax} véhicules · {selected.driversMax} chauffeurs
                          </p>
                          {selected.name === 'Premium' && (
                            <p className="text-xs text-yellow-600 mt-2">
                              ✨ Inclut une landing page personnalisée
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-400">Plan non trouvé</p>
                      );
                    })()}
                  </div>
                )}

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2">💡 Les avantages</h3>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li className="flex items-center gap-2"><Check size={14} /> Support 24/7</li>
                    <li className="flex items-center gap-2"><Check size={14} /> Gestion des véhicules et chauffeurs</li>
                    <li className="flex items-center gap-2"><Check size={14} /> Tableau de bord en temps réel</li>
                    <li className="flex items-center gap-2"><Check size={14} /> Suivi des livraisons</li>
                    {(() => {
                      const selected = filteredPlans.find(p => (p.id || p.name) === form.planId);
                      if (selected && (selected.name === 'Standard' || selected.name === 'Premium' || selected.name === 'Sur devis')) {
                        return (
                          <li className="flex items-center gap-2 font-semibold text-green-700">
                            <Check size={14} /> 🌐 Landing page personnalisée incluse
                          </li>
                        );
                      }
                      return null;
                    })()}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
