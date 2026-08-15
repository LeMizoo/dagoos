'use client';
import { apiFetch } from '@/lib/api';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PasswordInput from '@/components/ui/PasswordInput';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await apiFetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (res.ok) { router.push(redirect); router.refresh(); }
    else { const data = await res.json().catch(() => ({})); setError(data.error || 'Erreur de connexion'); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark to-blue-900">
      <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Dagoo Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Plateforme d'administration</p>
          <span className="inline-block bg-primary text-white text-xs px-3 py-1 rounded-full mt-3">Réservé aux administrateurs</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="votre-email@exemple.mg" required /></div>
          <div className="mb-6"><PasswordInput value={password} onChange={e => setPassword(e.target.value)} required /></div>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-blue-800 disabled:bg-gray-400 transition">{loading ? 'Connexion...' : 'Se connecter'}</button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() { return <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}><LoginForm /></Suspense>; }
