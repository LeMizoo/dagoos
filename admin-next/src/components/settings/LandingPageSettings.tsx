'use client';

import { useCallback, useEffect, useState } from 'react';
import { Save, Globe, Upload, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';

interface LandingService {
  icon: string;
  title: string;
  desc: string;
}

interface LandingConfig {
  hero?: {
    title?: string;
    subtitle?: string;
  };
  about?: {
    text?: string;
  };
  services?: LandingService[];
}

interface LandingData {
  slug: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  aboutText: string;
  services: LandingService[];
  contactEmail: string;
  contactPhone: string;
  primaryColor: string;
  secondaryColor: string;
  slogan: string;
  address: string;
  facebook: string;
  whatsapp: string;
  landingEnabled: boolean;
  landingTemplate: string;
}

const defaultServices: LandingService[] = [
  {
    icon: '🛵',
    title: 'Transport rapide',
    desc: 'Courses urbaines et interurbaines',
  },
  {
    icon: '🔧',
    title: 'Véhicules entretenus',
    desc: 'Parc régulièrement vérifié',
  },
  {
    icon: '👨‍✈️',
    title: 'Chauffeurs qualifiés',
    desc: 'Professionnels expérimentés',
  },
  {
    icon: '📍',
    title: 'Suivi en temps réel',
    desc: 'Localisation GPS',
  },
  {
    icon: '💳',
    title: 'Paiement sécurisé',
    desc: 'Multiples options',
  },
  {
    icon: '📞',
    title: 'Support 24/7',
    desc: 'Assistance à tout moment',
  },
];

export default function LandingPageSettings({
  app,
}: {
  app: 'fleet' | 'coop';
}) {
  const { organization, isLoading: organizationLoading } = useOrganization();

  const [data, setData] = useState<LandingData>({
    slug: '',
    heroTitle: '',
    heroSubtitle: '',
    heroImage: '',
    aboutText: '',
    services: defaultServices,
    contactEmail: '',
    contactPhone: '',
    primaryColor: app === 'fleet' ? '#2563EB' : '#059669',
    secondaryColor: app === 'fleet' ? '#1D4ED8' : '#047857',
    slogan: '',
    address: '',
    facebook: '',
    whatsapp: '',
    landingEnabled: false,
    landingTemplate: app === 'fleet' ? 'premium-fleet' : 'premium-coop',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const loadLanding = useCallback(async () => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiFetch(
        `/organizations/${organization.id}/landing`
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error || 'Impossible de charger la landing page'
        );
      }

      const config: LandingConfig =
        result?.landingConfig &&
        typeof result.landingConfig === 'object' &&
        !Array.isArray(result.landingConfig)
          ? result.landingConfig
          : {};

      setData({
        slug: result?.slug || '',
        heroTitle:
          config.hero?.title ||
          result?.name ||
          '',
        heroSubtitle:
          config.hero?.subtitle ||
          result?.description ||
          result?.slogan ||
          '',
        heroImage:
          result?.coverImage ||
          '',
        aboutText:
          config.about?.text ||
          result?.description ||
          '',
        services:
          Array.isArray(config.services) && config.services.length > 0
            ? config.services
            : defaultServices,
        contactEmail:
          organization.email ||
          '',
        contactPhone:
          organization.phone ||
          '',
        primaryColor:
          result?.primaryColor ||
          (app === 'fleet' ? '#2563EB' : '#059669'),
        secondaryColor:
          result?.secondaryColor ||
          (app === 'fleet' ? '#1D4ED8' : '#047857'),
        slogan:
          result?.slogan ||
          '',
        address:
          result?.address ||
          '',
        facebook:
          result?.facebook ||
          '',
        whatsapp:
          result?.whatsapp ||
          '',
        landingEnabled:
          Boolean(result?.landingEnabled),
        landingTemplate:
          result?.landingTemplate ||
          (app === 'fleet' ? 'premium-fleet' : 'premium-coop'),
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement'
      );
    } finally {
      setLoading(false);
    }
  }, [organization?.id, organization?.email, organization?.phone, app]);

  useEffect(() => {
    if (!organizationLoading) {
      loadLanding();
    }
  }, [organizationLoading, loadLanding]);

  function updateService(
    index: number,
    field: keyof LandingService,
    value: string
  ) {
    setData((previous) => {
      const services = [...previous.services];

      services[index] = {
        ...services[index],
        [field]: value,
      };

      return {
        ...previous,
        services,
      };
    });
  }

  async function handleSave() {
    if (!organization?.id) {
      setError('Organisation non trouvée');
      return;
    }

    setSaving(true);
    setSaved(false);
    setError('');

    try {
      const landingConfig: LandingConfig = {
        hero: {
          title: data.heroTitle,
          subtitle: data.heroSubtitle,
        },
        about: {
          text: data.aboutText,
        },
        services: data.services,
      };

      const response = await apiFetch(
        `/organizations/${organization.id}/landing`,
        {
          method: 'PUT',
          body: JSON.stringify({
            slogan: data.slogan || null,
            coverImage: data.heroImage || null,
            primaryColor: data.primaryColor || null,
            secondaryColor: data.secondaryColor || null,
            landingEnabled: data.landingEnabled,
            landingTemplate: app === 'fleet' ? 'premium-fleet' : 'premium-coop',
            address: data.address || null,
            facebook: data.facebook || null,
            whatsapp: data.whatsapp || null,
            landingConfig,
          }),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error || 'Erreur lors de la sauvegarde'
        );
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la sauvegarde'
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading || organizationLoading) {
    return (
      <div className="p-8 text-center text-gray-400">
        Chargement de la landing page...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Globe size={20} />
            Landing Page
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Personnalisez votre page publique
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          <input
            type="checkbox"
            checked={data.landingEnabled}
            onChange={(e) =>
              setData({
                ...data,
                landingEnabled: e.target.checked,
              })
            }
            className="h-4 w-4 rounded"
          />
          Landing active
        </label>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle size={16} />
          Landing page sauvegardée avec succès !
        </div>
      )}

      {/* Hero */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border p-6">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
          🎯 Section Hero
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Titre principal
            </label>

            <input
              type="text"
              value={data.heroTitle}
              onChange={(e) =>
                setData({
                  ...data,
                  heroTitle: e.target.value,
                })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Nom de votre organisation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Sous-titre
            </label>

            <input
              type="text"
              value={data.heroSubtitle}
              onChange={(e) =>
                setData({
                  ...data,
                  heroSubtitle: e.target.value,
                })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Une expérience de transport moderne et fiable"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Slogan
            </label>

            <input
              type="text"
              value={data.slogan}
              onChange={(e) =>
                setData({
                  ...data,
                  slogan: e.target.value,
                })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Votre mobilité, notre engagement"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Image de fond (URL)
            </label>

            <div className="flex gap-2">
              <input
                type="url"
                value={data.heroImage}
                onChange={(e) =>
                  setData({
                    ...data,
                    heroImage: e.target.value,
                  })
                }
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                placeholder="https://exemple.com/image.jpg"
              />

              <button
                type="button"
                disabled
                title="Upload d'image à implémenter"
                className="px-3 py-2 border rounded-lg text-sm text-gray-400 flex items-center gap-1 cursor-not-allowed"
              >
                <Upload size={14} />
                Upload
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-1">
              Pour le moment, utilisez une URL publique d'image.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Couleur principale
              </label>

              <input
                type="color"
                value={data.primaryColor}
                onChange={(e) =>
                  setData({
                    ...data,
                    primaryColor: e.target.value,
                  })
                }
                className="w-16 h-10 border rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Couleur secondaire
              </label>

              <input
                type="color"
                value={data.secondaryColor}
                onChange={(e) =>
                  setData({
                    ...data,
                    secondaryColor: e.target.value,
                  })
                }
                className="w-16 h-10 border rounded cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Template
            </label>

            <div className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              {app === 'fleet' ? 'Premium Fleet' : 'Premium Coop'}
            </div>

            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Le template est automatiquement défini selon le type d’organisation.
            </p>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border p-6">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
          🔧 Services
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.services.map((service, index) => (
            <div
              key={index}
              className="border rounded-lg p-3"
            >
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={service.icon}
                  onChange={(e) =>
                    updateService(index, 'icon', e.target.value)
                  }
                  className="w-10 px-2 py-1 border rounded text-center text-lg"
                  aria-label={`Icône du service ${index + 1}`}
                />

                <input
                  type="text"
                  value={service.title}
                  onChange={(e) =>
                    updateService(index, 'title', e.target.value)
                  }
                  className="flex-1 px-2 py-1 border rounded text-sm font-medium"
                  placeholder="Nom du service"
                />
              </div>

              <input
                type="text"
                value={service.desc}
                onChange={(e) =>
                  updateService(index, 'desc', e.target.value)
                }
                className="w-full px-2 py-1 border rounded text-xs text-gray-500"
                placeholder="Description du service"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border p-6">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
          📞 Contact
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Email
            </label>

            <input
              type="email"
              value={data.contactEmail}
              readOnly
              className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-500"
            />

            <p className="text-xs text-gray-400 mt-1">
              Email de l'organisation — géré dans les paramètres administratifs.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Téléphone
            </label>

            <input
              type="text"
              value={data.contactPhone}
              readOnly
              className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 text-gray-500"
            />

            <p className="text-xs text-gray-400 mt-1">
              Téléphone de l'organisation — géré dans les paramètres administratifs.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Adresse
            </label>

            <input
              type="text"
              value={data.address}
              onChange={(e) =>
                setData({
                  ...data,
                  address: e.target.value,
                })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="Adresse de votre organisation"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              WhatsApp
            </label>

            <input
              type="text"
              value={data.whatsapp}
              onChange={(e) =>
                setData({
                  ...data,
                  whatsapp: e.target.value,
                })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="+261 34 00 000 00"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Facebook
            </label>

            <input
              type="url"
              value={data.facebook}
              onChange={(e) =>
                setData({
                  ...data,
                  facebook: e.target.value,
                })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="https://facebook.com/..."
            />
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border p-6">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
          📝 À propos
        </h3>

        <textarea
          value={data.aboutText}
          onChange={(e) =>
            setData({
              ...data,
              aboutText: e.target.value,
            })
          }
          className="w-full px-3 py-2 border rounded-lg text-sm h-32"
          placeholder="Décrivez votre organisation..."
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? (
            '⏳ Enregistrement...'
          ) : saved ? (
            '✅ Sauvegardé !'
          ) : (
            <>
              <Save size={18} />
              Enregistrer les modifications
            </>
          )}
        </button>

        {data.slug && (
          <a
            href={
              app === 'fleet'
                ? `/fleet/${data.slug}`
                : `/coop/${data.slug}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <Eye size={18} />
            Voir la page
          </a>
        )}
      </div>
    </div>
  );
}
