'use client';
import { useState, Suspense } from 'react';
import PasswordInput from '@/components/ui/PasswordInput';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2 } from 'lucide-react';

function CoopLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/coop';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (res.ok) { router.push(redirect); router.refresh(); }
    else { const data = await res.json(); setError(data.error || 'Email ou mot de passe incorrect'); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 to-green-700">
      <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Dagoo Coop</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez votre coopérative de chauffeurs</p>
          <span className="inline-block bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full mt-3">🏢 Coopérative</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="coop@exemple.mg" required /></div>
          <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" placeholder="••••••••" required /></div>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-gray-400 transition">{loading ? '⏳ Connexion...' : '🏢 Accéder à mon espace'}</button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-6">Vous n&apos;avez pas de compte ? <a href="/register" className="text-emerald-600 hover:underline">Inscrivez-vous</a></p>
      </div>
    </div>
  );
}

export default function CoopLoginPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}><CoopLoginForm /></Suspense>;
}
