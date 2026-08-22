'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, Truck } from 'lucide-react';
import Link from 'next/link';

import { apiJson } from '@/lib/api';
import PasswordInput from '@/components/ui/PasswordInput';

export interface LoginFormConfig {
  endpoint: string;
  defaultRedirect: string;
  title: string;
  description: string;
  badge: string;
  emailPlaceholder: string;
  submitLabel: string;
  loadingLabel: string;
  accent: 'primary' | 'blue' | 'emerald';
  icon?: 'truck' | 'building';
  registration?: boolean;
}

interface LoginResponse {
  user?: Record<string, unknown>;
  token?: string;
  [key: string]: unknown;
}

interface LoginFormProps {
  config: LoginFormConfig;
}

const accentStyles = {
  primary: {
    gradient: 'from-dark to-blue-900',
    badge: 'bg-primary text-white',
    button: 'bg-primary hover:bg-blue-800',
    focus: 'focus:ring-primary',
    iconBackground: 'bg-blue-100',
    iconColor: 'text-blue-600',
    link: 'text-blue-600',
  },
  blue: {
    gradient: 'from-blue-900 to-cyan-700',
    badge: 'bg-blue-100 text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700',
    focus: 'focus:ring-blue-500',
    iconBackground: 'bg-blue-100',
    iconColor: 'text-blue-600',
    link: 'text-blue-600',
  },
  emerald: {
    gradient: 'from-emerald-900 to-green-700',
    badge: 'bg-emerald-100 text-emerald-700',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    focus: 'focus:ring-emerald-500',
    iconBackground: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    link: 'text-emerald-600',
  },
} as const;

function LoginIcon({
  icon,
  config,
}: {
  icon?: LoginFormConfig['icon'];
  config: LoginFormConfig;
}) {
  if (!icon) {
    return null;
  }

  const styles = accentStyles[config.accent];

  return (
    <div
      className={`w-16 h-16 ${styles.iconBackground} rounded-2xl flex items-center justify-center mx-auto mb-4`}
    >
      {icon === 'truck' ? (
        <Truck size={32} className={styles.iconColor} />
      ) : (
        <Building2 size={32} className={styles.iconColor} />
      )}
    </div>
  );
}

export default function LoginForm({ config }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const redirect =
    searchParams.get('redirect') || config.defaultRedirect;

  const styles = accentStyles[config.accent];

  async function handleSubmit(event?: FormEvent<HTMLFormElement> | React.MouseEvent) {
    if (event && 'preventDefault' in event) event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const proxyUrl = config.endpoint.replace('/api/', '/api/proxy/');
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      }).then(r => r.json());

      // Stocker le token selon l'espace
      if (response.token) {
        const tokenKey = config.endpoint === '/api/auth/login'
          ? 'dagoos_admin_token'
          : 'dagoos_org_token';
        localStorage.setItem(tokenKey, response.token);
        // Aussi stocker dans un cookie non-HttpOnly pour le middleware
        document.cookie = tokenKey + '=' + response.token + '; path=/; max-age=604800; SameSite=Lax';
      }

      // Attendre que le cookie soit défini avant de rediriger
      setTimeout(function() {
        window.location.href = window.location.origin + redirect;
      }, 100);
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
    <div
      className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${styles.gradient} px-4`}
    >
      <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <LoginIcon icon={config.icon} config={config} />

          <h1 className="text-2xl font-bold text-gray-800">
            {config.title}
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            {config.description}
          </p>

          <span
            className={`inline-block text-xs px-3 py-1 rounded-full mt-3 ${styles.badge}`}
          >
            {config.badge}
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>

            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 ${styles.focus} focus:border-transparent`}
              placeholder={config.emailPlaceholder}
              autoComplete="email"
              required
            />
          </div>

          <div className="mb-6">
            <PasswordInput
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              label="Mot de passe"
              placeholder="••••••••"
              required
              className={styles.focus}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-red-500 text-sm mb-4 text-center"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className={`w-full text-white py-3 rounded-lg font-semibold disabled:bg-gray-400 transition ${styles.button}`}
          >
            {loading ? config.loadingLabel : config.submitLabel}
          </button>
        </form>

        {config.registration && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Vous n'avez pas de compte ?{' '}
            <Link
              href="/register"
              className={`${styles.link} hover:underline`}
            >
              Inscrivez-vous
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
