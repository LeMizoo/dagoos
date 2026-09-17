'use client';

import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Truck, Building2, X } from 'lucide-react';
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

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
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
  const [dagoosMM, setDagoosMM] = useState({
    mvola: '034 00 000 00',
    orange: '032 00 000 00',
    airtel: '033 00 000 00',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setCaptchaQ({
      a: Math.floor(Math.random() * 10) + 1,
      b: Math.floor(Math.random() * 10) + 1,
    });

    apiFetch('/public/dagoos-mobile-money')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setDagoosMM({
            mvola: d.mvolaNumber || '034 00 000 00',
            orange: d.orangeNumber || '032 00 000 00',
            airtel: d.airtelNumber || '033 00 000 00',
          });
        }
      })
      .catch(() => {});

    apiFetch('/public/plans')
      .then(r => r.json())
      .then(data => {
        setPlans(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setPlans([
          { type: 'FLEET_MANAGER', name: 'Freemium', price: 0, vehiclesMax: 1, driversMax: 1 },
          { type: 'FLEET_MANAGER', name: 'Basic', price: 15000, vehiclesMax: 5, driversMax: 10 },
          { type: 'FLEET_MANAGER', name: 'Standard', price: 35000, vehiclesMax: 20, driversMax: 50 },
          { type: 'FLEET_MANAGER', name: 'Premium', price: 75000, vehiclesMax: 100, driversMax: 200 },
          { type: 'COOPERATIVE', name: 'Freemium', price: 0, vehiclesMax: 1, driversMax: 2 },
          { type: 'COOPERATIVE', name: 'Basic', price: 20000, vehiclesMax: 5, driversMax: 15 },
          {
            type: 'COOPERATIVE',
            name: 'Standard',
            price: Number(process.env.NEXT_PUBLIC_DEFAULT_PLAN_PRICE || 45000),
            vehiclesMax: 20,
            driversMax: 60,
          },
          { type: 'COOPERATIVE', name: 'Premium', price: 90000, vehiclesMax: 100, driversMax: 300 },
        ]);
        setLoading(false);
      });
  }, [isOpen]);

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
      setCaptchaQ({
        a: Math.floor(Math.random() * 10) + 1,
        b: Math.floor(Math.random() * 10) + 1,
      });
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

      setTimeout(() => {
        onClose();
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }
  };

  const getPlanEmoji = (name: string) => {
    switch (name) {
      case 'Freemium': return '🟢';
      case 'Basic': return '📘';
      case 'Standard': return '🟣';
      case 'Premium': return '💡';
      default: return '⚪';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-lg transition"
          aria-label="Fermer"
        >
          <X size={20} className="text-gray-500" />
        </button>

        <div className="p-6 md:p-8">
          <div className="text-center mb-6 pr-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
              Créer un compte
            </h2>
            <p className="text-gray-500">
              Choisissez votre type d'organisation et votre plan
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-100 p-2 md:p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type d'organisation
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        organizationType: 'FLEET_MANAGER',
                        planId: '',
                      })}
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
                      onClick={() => setForm({
                        ...form,
                        organizationType: 'COOPERATIVE',
                        planId: '',
                      })}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nom de l'organisation
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.organizationName}
                    onChange={(e) => setForm({
                      ...form,
                      organizationName: e.target.value,
                    })}
                    placeholder="Nom de votre flotte ou coopérative"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sélectionnez votre plan
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    {filteredPlans.map(plan => (
                      <button
                        key={plan.name}
                        type="button"
                        onClick={() => setForm({
                          ...form,
                          planId: plan.id || plan.name,
                        })}
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
                          {plan.price === 0
                            ? 'Gratuit'
                            : `${plan.price.toLocaleString()} Ar`}
                        </div>

                        <div className="text-xs text-gray-500">
                          {plan.vehiclesMax} véhicules · {plan.driversMax} chauffeurs
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    required
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.name}
                    onChange={(e) => setForm({
                      ...form,
                      name: e.target.value,
                    })}
                    placeholder="Votre nom"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.email}
                    onChange={(e) => setForm({
                      ...form,
                      email: e.target.value,
                    })}
                    placeholder="votre@email.com"
                  />
                </div>

                <div>
                  <PasswordInput
                    label="Mot de passe"
                    value={form.password}
                    onChange={(e) => setForm({
                      ...form,
                      password: e.target.value,
                    })}
                    placeholder="Minimum 6 caractères"
                    required
                    className="mt-1 border-gray-300 rounded-xl focus:ring-primary"
                  />
                </div>

                <div>
                  <PasswordInput
                    label="Confirmer le mot de passe"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({
                      ...form,
                      confirmPassword: e.target.value,
                    })}
                    placeholder="Confirmez votre mot de passe"
                    required
                    className="mt-1 border-gray-300 rounded-xl focus:ring-primary"
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-bold text-gray-700 mb-2">
                    📱 Numéros Mobile Money (pour les abonnements)
                  </p>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 bg-yellow-400 rounded px-3 py-2">
                      <span className="font-bold text-black text-sm w-16">MVola</span>
                      <span className="text-black font-extrabold text-sm">
                        {dagoosMM.mvola}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-black rounded px-3 py-2">
                      <span className="font-bold text-orange-500 text-sm w-16">Orange</span>
                      <span className="text-orange-400 font-extrabold text-sm">
                        {dagoosMM.orange}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 bg-red-600 rounded px-3 py-2">
                      <span className="font-bold text-white text-sm w-16">Airtel</span>
                      <span className="text-white font-extrabold text-sm">
                        {dagoosMM.airtel}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Réf du transfert Mobile Money (optionnel)
                  </label>
                  <input
                    type="text"
                    value={form.paiementRef}
                    onChange={e => setForm({
                      ...form,
                      paiementRef: e.target.value,
                    })}
                    placeholder="Ex: MVOLA123456789"
                    className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold whitespace-nowrap">
                    {captchaQ.a} + {captchaQ.b} = ?
                  </span>

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
                  className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {loading ? 'Chargement...' : 'Créer un compte'}
                </button>

                <p className="text-center text-sm text-gray-500">
                  Déjà un compte ?{' '}
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="text-blue-600 hover:underline"
                  >
                    Se connecter
                  </Link>
                </p>
              </form>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                📋 Récapitulatif
              </h3>

              {loading ? (
                <p className="text-gray-400">Chargement...</p>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-semibold">
                      {form.organizationType === 'FLEET_MANAGER'
                        ? '🚛 Gestion de Flotte'
                        : '🏢 Coopérative'}
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
                        const selected = filteredPlans.find(
                          p => (p.id || p.name) === form.planId
                        );

                        return selected ? (
                          <div>
                            <p className="font-semibold text-lg">{selected.name}</p>

                            <p className="text-2xl font-bold text-blue-600">
                              {selected.price === 0
                                ? 'Gratuit'
                                : `${selected.price.toLocaleString()} Ar`}
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

                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                    <h4 className="font-semibold text-primary mb-2">
                      💡 Les avantages
                    </h4>

                    <ul className="space-y-1 text-sm text-primary">
                      <li className="flex items-center gap-2">
                        <Check size={14} />
                        Support 24/7
                      </li>

                      <li className="flex items-center gap-2">
                        <Check size={14} />
                        Gestion des véhicules et chauffeurs
                      </li>

                      <li className="flex items-center gap-2">
                        <Check size={14} />
                        Tableau de bord en temps réel
                      </li>

                      <li className="flex items-center gap-2">
                        <Check size={14} />
                        Suivi des livraisons
                      </li>

                      {(() => {
                        const selected = filteredPlans.find(
                          p => (p.id || p.name) === form.planId
                        );

                        if (
                          selected &&
                          (
                            selected.name === 'Standard' ||
                            selected.name === 'Premium' ||
                            selected.name === 'Sur devis'
                          )
                        ) {
                          return (
                            <li className="flex items-center gap-2 font-semibold text-green-700">
                              <Check size={14} />
                              🌐 Landing page personnalisée incluse
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
    </div>
  );
}
