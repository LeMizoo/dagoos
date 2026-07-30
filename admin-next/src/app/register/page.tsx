'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Truck, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    organizationName: '', organizationPhone: ''
  });

  function selectRole(r: string) {
    setRole(r);
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          role: role === 'fleet' ? 'FLEET_MANAGER' : 'COOPERATIVE',
          organizationName: form.organizationName,
          organizationPhone: form.organizationPhone,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }
      router.push(role === 'fleet' ? '/fleet-login' : '/coop-login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark to-primary/50 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative">
        {step === 1 ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-800">Créer un compte</h1>
              <p className="text-gray-500 text-sm mt-1">Choisissez votre type de compte</p>
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-primary mt-3"><Home size={12} /> Retour à l'accueil</Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => selectRole('fleet')}
                className="bg-blue-50 hover:bg-blue-100 rounded-2xl p-6 text-center transition border-2 border-transparent hover:border-blue-500">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Truck size={28} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-800">Flotte</h3>
                <p className="text-xs text-gray-500 mt-1">Gestionnaire de flotte</p>
              </button>
              <button onClick={() => selectRole('coop')}
                className="bg-emerald-50 hover:bg-emerald-100 rounded-2xl p-6 text-center transition border-2 border-transparent hover:border-emerald-500">
                <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Building2 size={28} className="text-white" />
                </div>
                <h3 className="font-bold text-gray-800">Coopérative</h3>
                <p className="text-xs text-gray-500 mt-1">Coopérative de chauffeurs</p>
              </button>
            </div>
            <p className="text-center text-sm text-gray-500 mt-6">
              Déjà un compte ? <Link href="/login" className="text-primary hover:underline">Connectez-vous</Link>
            </p>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className={`w-14 h-14 ${role === 'fleet' ? 'bg-blue-600' : 'bg-emerald-600'} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                {role === 'fleet' ? <Truck size={28} className="text-white" /> : <Building2 size={28} className="text-white" />}
              </div>
              <h1 className="text-xl font-bold text-gray-800">
                Inscription {role === 'fleet' ? 'Flotte' : 'Coopérative'}
              </h1>
              <button onClick={() => setStep(1)} className="text-xs text-primary hover:underline mt-1"><Link href="/" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-primary absolute left-4 top-4"><Home size={12} /> Accueil</Link>
            ← Changer de type</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Nom complet *</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Email *</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label><input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Nom de l&apos;organisation *</label><input type="text" value={form.organizationName} onChange={e => setForm({...form, organizationName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Téléphone organisation</label><input type="tel" value={form.organizationPhone} onChange={e => setForm({...form, organizationPhone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Mot de passe *</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required minLength={6} /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Confirmer *</label><input type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
              </div>
              <button type="submit" disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold text-white transition text-sm ${role === 'fleet' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'} disabled:bg-gray-400`}>
                {loading ? '⏳ Inscription...' : '✅ Créer mon compte'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
