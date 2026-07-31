'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { Settings, User, Shield, Palette, Bell, Globe, Save, Crown, Coffee, Star, Zap, FileText } from 'lucide-react';
import PasswordInput from '@/components/ui/PasswordInput';

type PlanKey = 'freemium' | 'basic' | 'standard' | 'premium' | 'surdevis';
type EntityType = 'fleet' | 'coop';

interface Plan {
  name: string;
  price: number;
  vehiclesMax: number;
  driversMax: number;
  landingPage: boolean;
}

const defaultFleetPlans: Record<PlanKey, Plan> = {
  freemium: { name: 'Freemium', price: 0, vehiclesMax: 1, driversMax: 1, landingPage: false },
  basic: { name: 'Basic', price: 15000, vehiclesMax: 5, driversMax: 10, landingPage: false },
  standard: { name: 'Standard', price: 35000, vehiclesMax: 20, driversMax: 50, landingPage: true },
  premium: { name: 'Premium', price: 75000, vehiclesMax: 100, driversMax: 200, landingPage: true },
  surdevis: { name: 'Sur devis', price: -1, vehiclesMax: 999, driversMax: 999, landingPage: true },
};

const defaultCoopPlans: Record<PlanKey, Plan> = {
  freemium: { name: 'Freemium', price: 0, vehiclesMax: 1, driversMax: 2, landingPage: false },
  basic: { name: 'Basic', price: 20000, vehiclesMax: 5, driversMax: 15, landingPage: false },
  standard: { name: 'Standard', price: 45000, vehiclesMax: 20, driversMax: 60, landingPage: true },
  premium: { name: 'Premium', price: 90000, vehiclesMax: 100, driversMax: 300, landingPage: true },
  surdevis: { name: 'Sur devis', price: -1, vehiclesMax: 999, driversMax: 999, landingPage: true },
};

export default function SettingsPage() {
  const [tab, setTab] = useState('general');
  const [saved, setSaved] = useState(false);
  const [entityTab, setEntityTab] = useState<EntityType>('fleet');
  const [fleetPlans, setFleetPlans] = useState(defaultFleetPlans);
  const [coopPlans, setCoopPlans] = useState(defaultCoopPlans);
  const [editPlan, setEditPlan] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState(0);

  // Dark mode
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('dagoos_theme') as 'light' | 'dark' | 'system' | null;
    if (saved) setTheme(saved);
    setThemeReady(true);
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('dagoos_theme', newTheme);
    const root = document.documentElement;
    root.classList.remove('dark');
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      }
    }
    // light : rien (déjà retiré)
  };

  const currentPlans = entityTab === 'fleet' ? fleetPlans : coopPlans;
  const setCurrentPlans = entityTab === 'fleet' ? setFleetPlans : setCoopPlans;

  const tabs = [
    { id: 'general', icon: Settings, label: 'Général' },
    { id: 'plans', icon: Crown, label: 'Plans & Abonnements' },
    { id: 'profile', icon: User, label: 'Profil' },
    { id: 'security', icon: Shield, label: 'Sécurité' },
    { id: 'appearance', icon: Palette, label: 'Apparence' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'api', icon: Globe, label: 'API' },
  ];

  function handleSave() {
    setSaved(true);
    // Sauvegarder dans le localStorage pour persistance
    localStorage.setItem('dagoos_fleet_plans', JSON.stringify(fleetPlans));
    localStorage.setItem('dagoos_coop_plans', JSON.stringify(coopPlans));
    setTimeout(() => setSaved(false), 2000);
  }

  const planIcons: Record<PlanKey, any> = { freemium: Coffee, basic: Star, standard: Zap, premium: Crown, surdevis: FileText };
  const planColors: Record<PlanKey, string> = { 
    freemium: 'border-gray-200', basic: 'border-teal-200', standard: 'border-blue-200', 
    premium: 'border-yellow-200', surdevis: 'border-purple-200',
  };
  const planIconColors: Record<PlanKey, string> = {
    freemium: 'bg-gray-100 text-gray-600', basic: 'bg-teal-100 text-teal-600', 
    standard: 'bg-blue-100 text-blue-600', premium: 'bg-yellow-100 text-yellow-600', 
    surdevis: 'bg-purple-100 text-purple-600',
  };
  const planBtnColors: Record<PlanKey, string> = {
    freemium: 'bg-gray-600 hover:bg-gray-700', basic: 'bg-teal-600 hover:bg-teal-700',
    standard: 'bg-blue-600 hover:bg-blue-700', premium: 'bg-yellow-500 hover:bg-yellow-600',
    surdevis: 'bg-purple-600 hover:bg-purple-700',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">⚙️ Paramètres</h1>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Tabs */}
        <div className="lg:w-52 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden lg:block flex flex-wrap">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm transition text-left w-full ${
                    tab === t.id
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={16} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          
          {/* ========== GENERAL ========== */}
          {tab === 'general' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Paramètres généraux</h2>
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom de la plateforme</label>
                  <input type="text" defaultValue="Dagoo's" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email de contact</label>
                  <input type="email" defaultValue="contact@dagoos.mg" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Devise</label>
                  <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option>Ariary (Ar)</option><option>Euro (€)</option><option>Dollar ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fuseau horaire</label>
                  <select className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <option>Indian/Antananarivo (GMT+3)</option><option>Europe/Paris (GMT+1)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ========== PLANS ========== */}
          {tab === 'plans' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">📋 Plans & Abonnements</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Configurez les prix et limites pour chaque entité.</p>

              <div className="flex gap-2 mb-6">
                <button onClick={() => setEntityTab('fleet')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${entityTab === 'fleet' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  🚛 Flottes
                </button>
                <button onClick={() => setEntityTab('coop')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${entityTab === 'coop' ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                  🏢 Coopératives
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {(Object.entries(currentPlans) as [PlanKey, Plan][]).map(([planKey, plan]) => {
                  const Icon = planIcons[planKey];
                  const isEditing = editPlan === `${entityTab}-${planKey}`;
                  const isSurDevis = planKey === 'surdevis';
                  return (
                    <div key={planKey} className={`bg-white dark:bg-gray-750 rounded-xl border ${planColors[planKey]} dark:border-gray-600 p-4 transition-all`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${planIconColors[planKey]}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{plan.name}</h3>
                          {isEditing ? (
                            <div className="flex items-center gap-1 mt-1">
                              <input type="number" value={editPrice} onChange={e => setEditPrice(Number(e.target.value))}
                                className="w-20 px-2 py-1 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded text-xs" />
                              <span className="text-xs text-gray-500">Ar</span>
                            </div>
                          ) : (
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              {isSurDevis ? 'Sur devis' : plan.price === 0 ? 'Gratuit' : `${plan.price.toLocaleString()} Ar/mois`}
                            </p>
                          )}
                        </div>
                      </div>
                      <ul className="space-y-1.5 mb-3 text-xs text-gray-600 dark:text-gray-400">
                        <li>✓ {plan.vehiclesMax} véhicule{plan.vehiclesMax > 1 ? 's' : ''}</li>
                        <li>✓ {plan.driversMax} chauffeur{plan.driversMax > 1 ? 's' : ''}</li>
                        <li>{plan.landingPage ? '✓ Landing page' : '✗ Pas de landing page'}</li>
                      </ul>
                      {isEditing ? (
                        <div className="flex gap-1.5">
                          <button onClick={() => { setCurrentPlans((prev: Record<PlanKey, Plan>) => ({ ...prev, [planKey]: { ...prev[planKey], price: editPrice } })); setEditPlan(null); handleSave(); }}
                            className="flex-1 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700">Valider</button>
                          <button onClick={() => setEditPlan(null)} className="flex-1 py-1.5 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-300">Annuler</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditPlan(`${entityTab}-${planKey}`); setEditPrice(plan.price === -1 ? 0 : plan.price); }}
                          className={`w-full py-1.5 text-xs text-white rounded-lg transition ${planBtnColors[planKey]}`}>
                          {isSurDevis ? 'Configurer' : 'Modifier le prix'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========== PROFILE ========== */}
          {tab === 'profile' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Profil administrateur</h2>
              <div className="space-y-4 max-w-lg">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label><input type="text" defaultValue="Super Admin" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label><input type="email" defaultValue="admin@dagoos.mg" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label><input type="tel" defaultValue="+261 00 000 00" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-sm" /></div>
              </div>
            </div>
          )}

          {/* ========== SECURITY ========== */}
          {tab === 'security' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Sécurité</h2>
              <div className="space-y-4 max-w-lg">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ancien mot de passe</label><PasswordInput value="" onChange={() => {}} className="text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nouveau mot de passe</label><PasswordInput value="" onChange={() => {}} className="text-sm" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmer</label><PasswordInput value="" onChange={() => {}} className="text-sm" /></div>
              </div>
            </div>
          )}

          {/* ========== APPEARANCE ========== */}
          {tab === 'appearance' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Apparence</h2>
              <div className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Thème</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'light' as const, icon: '☀️', label: 'Clair' },
                      { id: 'dark' as const, icon: '🌙', label: 'Sombre' },
                      { id: 'system' as const, icon: '💻', label: 'Système' },
                    ].map(item => (
                      <button key={item.id} onClick={() => applyTheme(item.id)}
                        className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                          theme === item.id
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-400 shadow-sm'
                            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}>
                        <div className="text-lg">{item.icon}</div>
                        <div className="text-xs mt-1">{item.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Couleur principale</label>
                  <div className="flex gap-2">
                    {['#1A5276', '#059669', '#7C3AED', '#E74C3C', '#F39C12'].map(c => (
                      <button key={c} className="w-10 h-10 rounded-full border-2 border-white shadow ring-1 ring-gray-200 dark:ring-gray-600 hover:ring-blue-500 hover:scale-110 transition-all" style={{ backgroundColor: c }} title={c} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== NOTIFICATIONS ========== */}
          {tab === 'notifications' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Notifications</h2>
              <div className="space-y-3 max-w-lg">
                {['Nouvelles inscriptions', 'Paiements reçus', 'Alertes maintenance', 'Messages', 'Rapports hebdo'].map(item => (
                  <label key={item} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded-lg"><input type="checkbox" defaultChecked className="rounded w-4 h-4" />{item}</label>
                ))}
              </div>
            </div>
          )}

          {/* ========== API ========== */}
          {tab === 'api' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">API</h2>
              <div className="space-y-4 max-w-lg">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL API</label><input type="text" defaultValue="https://dagoos-api.onrender.com" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-sm" readOnly /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Clé API</label><div className="flex gap-2"><input type="password" defaultValue="sk-••••••••••••" className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm" readOnly /><button className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-600 dark:text-gray-300">Régénérer</button></div></div>
              </div>
            </div>
          )}

          {tab !== 'plans' && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3">
              <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition text-sm">
                <Save size={14} /> {saved ? '✓ Sauvegardé !' : 'Sauvegarder'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
