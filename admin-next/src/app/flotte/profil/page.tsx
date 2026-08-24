'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useOrganization } from '@/lib/organization-context';
import { User, Save, Building2, Shield, CheckCircle } from 'lucide-react';
import PasswordInput from '@/components/ui/PasswordInput';

export default function FlotteProfil() {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' });
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
      setLoading(false);
    }
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    // API call à implémenter
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <div className="text-center py-12 text-gray-400">⏳ Chargement...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">👤 Mon Profil</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte profil */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm border lg:col-span-2">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{profile.name || 'Utilisateur'}</h2>
              <p className="text-sm text-gray-500">{profile.email}</p>
            </div>
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
              <input
                type="text"
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
              <input
                type="tel"
                value={profile.phone}
                onChange={e => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <PasswordInput
              label="Nouveau mot de passe (laisser vide si inchangé)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 6 caractères"
              className="text-sm"
            />
            <button
              type="submit"
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition text-sm"
            >
              <Save size={14} /> {saved ? '✓ Sauvegardé !' : 'Enregistrer'}
            </button>
          </form>
        </div>

        {/* Informations organisation */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Building2 size={18} /> Organisation
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {organization?.name || 'Non définie'}
              </p>
              <p className="text-xs text-gray-500">
                Code : {organization?.code || '-'}
              </p>
              <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                organization?.type === 'FLEET_MANAGER'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {organization?.type === 'FLEET_MANAGER' ? 'URBAIN' : 'INTER-URBAIN'}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Shield size={18} /> Rôle
            </h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {user?.role === 'FLEET_MANAGER' ? 'Gestionnaire de flotte' :
                 user?.role === 'COOP_MANAGER' ? 'Gestionnaire de coopérative' :
                 user?.role || 'Utilisateur'}
              </p>
              <span className="inline-block text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {user?.role}
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle size={18} /> État du compte
            </h3>
            <p className="text-sm text-green-600 flex items-center gap-2">
              <CheckCircle size={14} /> Actif
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
