'use client';
import { useState, useEffect } from 'react';
import { User, Save } from 'lucide-react';
import PasswordInput from '@/components/ui/PasswordInput';

export default function CoopProfilPage() {
  const [user, setUser] = useState({ name: '', email: '', phone: '' });
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.email) setUser({ name: d.name || '', email: d.email, phone: d.phone || '' });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    // API call à implémenter
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <div className="text-center py-12 text-gray-400">⏳ Chargement...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">👤 Mon Profil</h1>
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 max-w-lg">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <User size={32} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user.name || 'Utilisateur'}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom</label><input type="text" value={user.name} onChange={e => setUser({ ...user, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={user.email} disabled className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label><input type="tel" value={user.phone} onChange={e => setUser({ ...user, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <PasswordInput label="Nouveau mot de passe (laisser vide si inchangé)" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 caractères" className="text-sm" />
          <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition text-sm">
            <Save size={14} /> {saved ? '✓ Sauvegardé !' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  );
}
