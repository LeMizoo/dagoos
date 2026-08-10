'use client';
import { useState, Suspense } from 'react';
import PasswordInput from '@/components/ui/PasswordInput';
import { useRouter, useSearchParams } from 'next/navigation';
import { Truck } from 'lucide-react';

function FleetLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/fleet';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/fleet-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) { const data = await res.json(); localStorage.removeItem('token'); localStorage.removeItem('dagoos_token'); if (data.user) localStorage.setItem("dagoos_user", JSON.stringify(data.user)); router.push(redirect); router.refresh(); }
    else { const data = await res.json().catch(() => ({})); setError(data.error || 'Email ou mot de passe incorrect'); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-cyan-700">
      <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Truck size={32} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Dagoo Fleet</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez votre flotte de véhicules</p>
          <span className="inline-block bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full mt-3">🚛 Gestionnaire de flotte</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="fleet@exemple.mg" required /></div>
          <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="••••••••" required /></div>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition">{loading ? '⏳ Connexion...' : '🚛 Accéder à mon espace'}</button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-6">Vous n&apos;avez pas de compte ? <a href="/register" className="text-blue-600 hover:underline">Inscrivez-vous</a></p>
      </div>
    </div>
  );
}

export default function FleetLoginPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}><FleetLoginForm /></Suspense>;
}
