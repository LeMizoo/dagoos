'use client';

// ============================================================
// LandingContentEditor — Editeur generique d'une section
// V1 — Chantier Parametres
//
// Utilise par le super-admin pour editer les pages publiques :
// FAQ, A propos, Blog, Carrieres, Aide, Contact, Statut
//
// API : /api/landing-content/:section (permission content.manage)
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Save,
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  Loader2,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface LandingContentData {
  section: string;
  title: string;
  subtitle: string;
  body: string;
  imageUrl: string;
  active: boolean;
}

interface LandingContentEditorProps {
  section: string;
  title?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

// ============================================================
// Placeholders contextuels par section (F6.5)
// Uniquement indicatifs : ils ne creent aucune valeur par defaut.
// ============================================================

interface SectionPlaceholders {
  title: string;
  subtitle: string;
  body: string;
}

const SECTION_PLACEHOLDERS: Record<string, SectionPlaceholders> = {
  landing: {
    title: 'Dago Mobility',
    subtitle: 'La mobilite connectee',
    body: "Contenu de la page d'accueil...",
  },
  'a-propos': {
    title: 'A propos de Dago',
    subtitle: 'Notre mission',
    body: 'Decrivez votre entreprise, votre histoire, vos valeurs...',
  },
  faq: {
    title: 'Foire aux questions',
    subtitle: 'Vos questions frequentes',
    body: 'Q: Comment reserver ?\nR: Ouvrez l\'application, choisissez un service...',
  },
  blog: {
    title: 'Le blog Dago',
    subtitle: 'Actualites et conseils',
    body: 'Contenu du blog a venir...',
  },
  carrieres: {
    title: 'Rejoignez-nous',
    subtitle: 'Nos opportunites',
    body: 'Nous recherchons des talents motives...',
  },
  aide: {
    title: "Centre d'aide",
    subtitle: 'Comment pouvons-nous vous aider ?',
    body: 'Guides, tutoriels et ressources...',
  },
  contact: {
    title: 'Contactez-nous',
    subtitle: 'Notre equipe vous repond',
    body: 'Une question ? Ecrivez-nous et nous reviendrons vers vous...',
  },
  statut: {
    title: 'Etat des services',
    subtitle: 'Statut en temps reel',
    body: 'Suivi de la disponibilite de nos services...',
  },
};

const GENERIC_PLACEHOLDERS: SectionPlaceholders = {
  title: 'Titre de la section',
  subtitle: 'Sous-titre',
  body: 'Contenu de la section (texte ou Markdown)',
};

export default function LandingContentEditor({
  section,
  title,
}: LandingContentEditorProps) {
  const [data, setData] = useState<LandingContentData>({
    section,
    title: '',
    subtitle: '',
    body: '',
    imageUrl: '',
    active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Placeholders contextuels pour la section courante
  const placeholders =
    SECTION_PLACEHOLDERS[section] || GENERIC_PLACEHOLDERS;

  // ---------------------------------------------------------
  // Chargement de la section
  // ---------------------------------------------------------
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/landing-content/${section}`);
      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }
      const result = await res.json();

      if (result && typeof result === 'object') {
        setData({
          section,
          title: result.title || '',
          subtitle: result.subtitle || '',
          body: result.body || '',
          imageUrl: result.imageUrl || '',
          active: result.active !== false,
        });
      } else {
        setData({
          section,
          title: '',
          subtitle: '',
          body: '',
          imageUrl: '',
          active: true,
        });
      }
    } catch (e: any) {
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    load();
  }, [load]);

  // ---------------------------------------------------------
  // Upload image editoriale
  // ---------------------------------------------------------
  async function handleFile(file: File) {
    setError('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Fichier non supporte. Utilisez JPEG, PNG, WebP ou HEIC.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(
        `Image trop lourde (${Math.round(file.size / 1024)} KB). Max 5 MB.`
      );
      return;
    }

    setUploading(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const res = await apiFetch('/landing-content/upload', {
        method: 'POST',
        body: JSON.stringify({ image: base64 }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.error || `Erreur ${res.status}`);
      }

      setData((prev) => ({ ...prev, imageUrl: result.url || '' }));
    } catch (e: any) {
      setError(e.message || 'Erreur upload');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // ---------------------------------------------------------
  // Sauvegarde de la section
  // ---------------------------------------------------------
  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const res = await apiFetch(`/landing-content/${section}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: data.title || null,
          subtitle: data.subtitle || null,
          body: data.body || null,
          imageUrl: data.imageUrl || null,
          active: data.active,
        }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(result?.error || `Erreur ${res.status}`);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message || 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-gray-500">
        <Loader2 className="animate-spin" size={16} />
        Chargement de la section {section}...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        {title || section}
      </h2>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {saved && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-600 dark:text-green-400">
          <CheckCircle size={16} />
          Section enregistree !
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Titre principal
          </label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            placeholder={placeholders.title}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-white"
            maxLength={255}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sous-titre
          </label>
          <input
            type="text"
            value={data.subtitle}
            onChange={(e) => setData({ ...data, subtitle: e.target.value })}
            placeholder={placeholders.subtitle}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-white"
            maxLength={255}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contenu
          </label>
          <textarea
            value={data.body}
            onChange={(e) => setData({ ...data, body: e.target.value })}
            rows={10}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-white font-mono"
            placeholder={placeholders.body}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Image
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            {data.imageUrl && (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.imageUrl}
                  alt="Apercu"
                  className="h-20 w-20 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setData({ ...data, imageUrl: '' })}
                  className="absolute -top-2 -right-2 rounded-full bg-red-500 p-0.5 text-white hover:bg-red-600"
                  title="Retirer l'image"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Upload...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Choisir une image
                </>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              className="hidden"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Max 5 MB. Formats : JPEG, PNG, WebP, HEIC.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={data.active}
              onChange={(e) => setData({ ...data, active: e.target.checked })}
              className="h-4 w-4 rounded"
            />
            Section active
          </label>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || uploading}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save size={16} />
              Enregistrer
            </>
          )}
        </button>
      </div>
    </div>
  );
}
