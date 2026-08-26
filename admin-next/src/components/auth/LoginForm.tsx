'use client';

import { useState } from 'react';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  Truck,
  Building2,
  Shield,
} from 'lucide-react';

export interface LoginFormConfig {
  endpoint: string;
  defaultRedirect: string;
  title: string;
  description: string;
  badge: string;
  emailPlaceholder: string;
  submitLabel: string;
  loadingLabel: string;
  accent: 'blue' | 'emerald';
  icon: 'truck' | 'building' | 'shield';
  registration?: boolean;
}

const accentStyles = {
  blue: {
    button: 'bg-blue-600 hover:bg-blue-700',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  emerald: {
    button: 'bg-emerald-600 hover:bg-emerald-700',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

export default function LoginForm({
  config,
}: {
  config: LoginFormConfig;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const styles =
    accentStyles[config.accent] || accentStyles.blue;

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Erreur de connexion');
        return;
      }

      if (!data.user) {
        setError(
          'RÃ©ponse de connexion invalide. Veuillez rÃ©essayer.'
        );
        return;
      }

      const redirectPath = data.redirectPath || config.defaultRedirect;

      setTimeout(() => {
        window.location.href = redirectPath;
      }, 200);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Erreur de connexion'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className={`w-16 h-16 ${styles.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}
          >
            {config.icon === 'truck' ? (
              <Truck size={32} className={styles.iconColor} />
            ) : config.icon === 'building' ? (
              <Building2 size={32} className={styles.iconColor} />
            ) : (
              <Shield size={32} className={styles.iconColor} />
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-800">
            {config.title}
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            {config.description}
          </p>

          <span
            className={`inline-block mt-3 text-xs px-3 py-1 rounded-full border ${styles.badgeBg}`}
          >
            {config.badge}
          </span>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="login-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={config.emailPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
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
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                className="w-full pl-10 pr-11 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                required
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={
                  showPassword
                    ? 'Masquer le mot de passe'
                    : 'Afficher le mot de passe'
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${styles.button} text-white py-2.5 rounded-lg font-medium transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {config.loadingLabel}
              </>
            ) : (
              config.submitLabel
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
