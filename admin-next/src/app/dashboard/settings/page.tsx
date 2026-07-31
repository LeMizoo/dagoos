'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { Settings, User, Shield, Palette, Bell, Globe, Save, Crown, Coffee, Zap, Check } from 'lucide-react';
import PasswordInput from '@/components/ui/PasswordInput';

export default function SettingsPage() {
  const [tab, setTab] = useState('general');
  const [saved, setSaved] = useState(false);

  // État des plans
  const [plans, setPlans] = useState({
    freemium: { name: 'Freemium', price: 0, features: ['Dashboard de base', 'Jusqu\'à 5 chauffeurs', 'Jusqu\'à 3 véhicules', 'Support email'] },
    standard: { name: 'Standard', price: 100000, features: ['Dashboard avancé', 'Jusqu\'à 20 chauffeurs', 'Jusqu\'à 10 véhicules', 'Landing page offerte', 'Support prioritaire'] },
    premium: { name: 'Premium', price: 200000, features: ['Dashboard complet', 'Chauffeurs illimités', 'Véhicules illimités', 'Landing page premium', 'Support dédié 24/7', 'API avancée', 'Exports personnalisés'] },
  });

  const [editPlan, setEditPlan] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState(0);

  const tabs = [
    { id: 'general', icon: Settings, label: 'Général' },
    { id: 'plans', icon: Crown, label: 'Plans' },
    { id: 'profile', icon: User, label: 'Profil' },
    { id: 'security', icon: Shield, label: 'Sécurité' },
    { id: 'appearance', icon: Palette, label: 'Apparence' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'api', icon: Globe, label: 'API' },
  ];

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const planIcons: Record<string, any> = { freemium: Coffee, standard: Zap, premium: Crown };
  const planColors: Record<string, string> = { 
    freemium: 'bg-gray-50 border-gray-200', 
    standard: 'bg-blue-50 border-blue-200', 
    premium: 'bg-yellow-50 border-yellow-200' 
  };
  const planBtnColors: Record<string, string> = {
    freemium: 'bg-gray-600 hover:bg-gray-700',
    standard: 'bg-blue-600 hover:bg-blue-700',
    premium: 'bg-yellow-600 hover:bg-yellow-700',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Paramètres</h1>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Tabs */}
        <div className="lg:w-48 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden lg:block flex flex-wrap">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm transition text-left w-full ${
                    tab === t.id
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          
          {/* ========== GENERAL ========== */}
          {tab === 'general' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Paramètres généraux</h2>
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la plateforme</label>
                  <input type="text" defaultValue="Dagoo's" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email de contact</label>
                  <input type="email" defaultValue="contact@dagoos.mg" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                  <select className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option>Ariary (Ar)</option>
                    <option>Euro (€)</option>
                    <option>Dollar ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fuseau horaire</label>
                  <select className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option>Indian/Antananarivo (GMT+3)</option>
                    <option>Europe/Paris (GMT+1)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ========== PLANS ========== */}
          {tab === 'plans' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">📋 Paramètres des plans</h2>
              <p className="text-sm text-gray-500 mb-6">Configurez les prix et fonctionnalités de chaque plan d'abonnement.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(plans).map(([key, plan]) => {
                  const Icon = planIcons[key as keyof typeof planIcons];
                  const planKey = key as 'freemium' | 'standard' | 'premium';
                  const isEditing = editPlan === key;
                  return (
                    <div key={key} className={`rounded-xl border p-5 ${planColors[planKey]} transition-all`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          planKey === 'freemium' ? 'bg-gray-200 text-gray-600' :
                          planKey === 'standard' ? 'bg-blue-200 text-blue-600' :
                          'bg-yellow-200 text-yellow-600'
                        }`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{plan.name}</h3>
                          {isEditing ? (
                            <div className="flex items-center gap-1 mt-1">
                              <input
                                type="number"
                                value={editPrice}
                                onChange={e => setEditPrice(Number(e.target.value))}
                                className="w-24 px-2 py-1 border rounded text-sm"
                              />
                              <span className="text-xs text-gray-500">Ar/mois</span>
                            </div>
                          ) : (
                            <p className="text-sm font-bold text-gray-700">
                              {plan.price === 0 ? 'Gratuit' : `${plan.price.toLocaleString()} Ar/mois`}
                            </p>
                          )}
                        </div>
                      </div>
                      <ul className="space-y-2 mb-4">
                        {plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                            <Check size={12} className="text-green-500 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setPlans(prev => ({ ...prev, [planKey]: { ...prev[planKey], price: editPrice } }));
                              setEditPlan(null);
                              handleSave();
                            }}
                            className="flex-1 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                          >
                            Valider
                          </button>
                          <button
                            onClick={() => setEditPlan(null)}
                            className="flex-1 py-1.5 text-xs bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition"
                          >
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditPlan(key); setEditPrice(plan.price); }}
                          className={`w-full py-1.5 text-xs text-white rounded-lg transition ${planBtnColors[planKey]}`}
                        >
                          Modifier le prix
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Actions globales */}
              <div className="mt-6 pt-4 border-t">
                <button className="text-sm text-blue-600 hover:underline">+ Ajouter une fonctionnalité personnalisée</button>
              </div>
            </div>
          )}

          {/* ========== PROFILE ========== */}
          {tab === 'profile' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Profil administrateur</h2>
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input type="text" defaultValue="Super Admin" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" defaultValue="admin@dagoos.mg" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input type="tel" defaultValue="+261 00 000 00" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* ========== SECURITY ========== */}
          {tab === 'security' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Sécurité</h2>
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ancien mot de passe</label>
                  <PasswordInput value="" onChange={() => {}} className="text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                  <PasswordInput value="" onChange={() => {}} className="text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer</label>
                  <PasswordInput value="" onChange={() => {}} className="text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* ========== APPEARANCE ========== */}
          {tab === 'appearance' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Apparence</h2>
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thème</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'light', label: '☀️ Clair', desc: 'Thème clair' },
                      { id: 'dark', label: '🌙 Sombre', desc: 'Thème sombre' },
                      { id: 'system', label: '💻 Système', desc: 'Suivre le système' },
                    ].map(theme => (
                      <button
                        key={theme.id}
                        className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                          theme.id === 'light'
                            ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <div className="text-lg">{theme.label.split(' ')[0]}</div>
                        <div className="text-xs mt-1">{theme.label.split(' ')[1]}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleur principale</label>
                  <div className="flex gap-2">
                    {['#1A5276', '#059669', '#7C3AED', '#E74C3C', '#F39C12'].map(c => (
                      <button
                        key={c}
                        className="w-10 h-10 rounded-full border-2 border-white shadow ring-1 ring-gray-200 hover:ring-blue-500 hover:scale-110 transition-all"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== NOTIFICATIONS ========== */}
          {tab === 'notifications' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Préférences de notifications</h2>
              <div className="space-y-3 max-w-lg">
                {[
                  'Nouvelles inscriptions',
                  'Paiements reçus',
                  'Alertes maintenance',
                  'Messages des organisations',
                  'Rapports hebdomadaires',
                ].map(item => (
                  <label key={item} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition">
                    <input type="checkbox" defaultChecked className="rounded w-4 h-4 text-blue-600" />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ========== API ========== */}
          {tab === 'api' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Configuration API</h2>
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL de l'API</label>
                  <input type="text" defaultValue="https://dagoos-api.onrender.com" className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clé API</label>
                  <div className="flex gap-2">
                    <input type="password" defaultValue="sk-••••••••••••••••" className="flex-1 px-3 py-2 border rounded-lg text-sm bg-gray-50" readOnly />
                    <button className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 transition">Régénérer</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bouton Sauvegarder (sauf pour plans qui a son propre save) */}
          {tab !== 'plans' && (
            <div className="mt-6 pt-4 border-t flex items-center gap-3">
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition text-sm"
              >
                <Save size={14} /> {saved ? '✓ Sauvegardé !' : 'Sauvegarder'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
