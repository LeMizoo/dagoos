'use client';

import { useState } from 'react';
import { X, Truck, Bus, Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LoginMode = 'urbain' | 'interurbain';

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [mode, setMode] = useState<LoginMode>('urbain');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'urbain' ? '/api/auth/urbain-login' : '/api/auth/interurbain-login';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Erreur de connexion');
        return;
      }

      const redirectPath = data.redirectPath || (mode === 'urbain' ? '/flotte/urbain' : '/flotte/interurbain');
      
      setTimeout(() => {
        window.open(redirectPath, '_blank', 'noopener,noreferrer');
        onClose();
      }, 200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition"
          aria-label="Fermer"
        >
          <X size={20} className="text-gray-500" />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
            Accéder à mon espace
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            Choisissez votre type de transport
          </p>

          {/* Onglets */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => { setMode('urbain'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition text-sm ${
                mode === 'urbain'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Truck size={18} />
              Urbain
            </button>
            <button
              type="button"
              onClick={() => { setMode('interurbain'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition text-sm ${
                mode === 'interurbain'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Bus size={18} />
              Interurbain
            </button>
          </div>

          {/* Description du mode */}
          <p className={`text-sm mb-6 text-center ${
            mode === 'urbain' ? 'text-blue-600' : 'text-emerald-600'
          }`}>
            {mode === 'urbain'
              ? 'Taxis, Tuk-tuk, Pousse-pousse en ville'
              : 'Taxi-brousse, Transferts privés entre villes'}
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.mg"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  className="w-full pl-10 pr-11 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white py-3 rounded-lg font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                mode === 'urbain' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Liens vers les pages dédiées */}
          <div className="mt-6 text-center text-xs text-gray-400">
            <a href="/urbain-login" className="hover:text-blue-600 transition">
              Page Urbain dédiée
            </a>
            <span className="mx-2">·</span>
            <a href="/interurbain-login" className="hover:text-emerald-600 transition">
              Page Interurbain dédiée
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
