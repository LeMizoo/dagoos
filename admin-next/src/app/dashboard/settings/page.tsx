'use client';
import { useState } from 'react';
import { Settings, User, Shield, Palette, Bell, Globe, Save } from 'lucide-react';

export default function SettingsPage() {
  const [tab, setTab] = useState('general');
  const [saved, setSaved] = useState(false);

  const tabs = [
    { id: 'general', icon: Settings, label: 'Général' },
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Paramètres</h1>

      <div className="flex gap-4">
        {/* Tabs */}
        <div className="w-48 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition text-left ${
                    tab === t.id
                      ? 'bg-primary text-white font-medium'
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
          {tab === 'general' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Paramètres généraux</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la plateforme</label>
                  <input type="text" defaultValue="Dagoo's" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email de contact</label>
                  <input type="email" defaultValue="contact@dagoos.mg" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                  <select className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary">
                    <option>Ariary (Ar)</option>
                    <option>Euro (€)</option>
                    <option>Dollar ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fuseau horaire</label>
                  <select className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary">
                    <option>Indian/Antananarivo (GMT+3)</option>
                    <option>Europe/Paris (GMT+1)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {tab === 'profile' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Profil administrateur</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input type="text" defaultValue="Super Admin" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" defaultValue="admin@dagoos.mg" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input type="tel" defaultValue="+261 00 000 00" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Sécurité</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ancien mot de passe</label>
                  <input type="password" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                  <input type="password" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer</label>
                  <input type="password" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            </div>
          )}

          {tab === 'appearance' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Apparence</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thème</label>
                  <select className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary">
                    <option>Clair</option>
                    <option>Sombre</option>
                    <option>Système</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleur principale</label>
                  <div className="flex gap-2">
                    {['#1A5276', '#2ECC71', '#E74C3C', '#F39C12', '#9B59B6'].map(c => (
                      <button
                        key={c}
                        className="w-8 h-8 rounded-full border-2 border-white shadow ring-1 ring-gray-200 hover:ring-primary transition"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Préférences de notifications</h2>
              <div className="space-y-3">
                {[
                  'Nouvelles inscriptions',
                  'Paiements reçus',
                  'Alertes maintenance',
                  'Messages des organisations',
                  'Rapports hebdomadaires',
                ].map(item => (
                  <label key={item} className="flex items-center gap-3 text-sm text-gray-700">
                    <input type="checkbox" defaultChecked className="rounded" />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          )}

          {tab === 'api' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Configuration API</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL de l'API</label>
                  <input type="text" defaultValue="https://dagoos-api.onrender.com" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary bg-gray-50" readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clé API</label>
                  <div className="flex gap-2">
                    <input type="password" defaultValue="sk-••••••••••••••••" className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary bg-gray-50" readOnly />
                    <button className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50">Régénérer</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t flex items-center gap-3">
            <button
              onClick={handleSave}
              className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-800 transition text-sm"
            >
              <Save size={14} /> {saved ? '✓ Sauvegardé !' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
