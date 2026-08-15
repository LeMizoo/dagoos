import { Building2, Phone, Mail, Users, Car } from 'lucide-react';
import Link from 'next/link';
import { API_BASE_URL } from '@/lib/config';

export const dynamic = 'force-dynamic';

interface Cooperative {
  id: string;
  name: string;
  code?: string;
  slug: string;
  type: string;
  email?: string | null;
  phone?: string | null;
  logo?: string | null;
  description?: string | null;
  plan?: string | null;
  status: string;
  vehicles?: Array<{
    id: string;
    plate: string;
    model?: string | null;
    year?: number | null;
    status: string;
  }>;
  drivers?: Array<{
    id: string;
    driverCode: string;
    status: string;
    user?: {
      name?: string | null;
    } | null;
    vehicle?: {
      id: string;
      plate: string;
      model?: string | null;
    } | null;
  }>;
  _count?: {
    vehicles: number;
    drivers: number;
  };
}

async function getCooperative(
  slug: string
): Promise<Cooperative | null> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/organizations/coop/${encodeURIComponent(slug)}`,
      {
        cache: 'no-store',
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[coop landing]', error);
    return null;
  }
}

export default async function CooperativeLandingPage({
  params,
}: {
  params: { slug: string };
}) {
  const cooperative = await getCooperative(params.slug);

  if (!cooperative) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <Building2
            size={48}
            className="mx-auto text-gray-300 mb-4"
          />

          <h1 className="text-3xl font-bold text-gray-300 mb-2">
            Coopérative introuvable
          </h1>

          <p className="text-gray-500 mb-6">
            Cette page n&apos;existe pas ou a été déplacée.
          </p>

          <Link
            href="/"
            className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-800 transition"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  const eligible =
    cooperative.plan === 'Premium' ||
    cooperative.plan === 'Standard' ||
    cooperative.plan === 'Sur devis';

  if (!eligible) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Building2
              size={40}
              className="text-emerald-600"
            />
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {cooperative.name}
          </h1>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mt-6">
            <p className="text-yellow-800 font-semibold mb-2">
              Landing page non disponible
            </p>

            <p className="text-yellow-700 text-sm mb-4">
              Votre plan{' '}
              <strong>{cooperative.plan || 'actuel'}</strong>{' '}
              n&apos;inclut pas de landing page personnalisée.
              Passez au plan <strong>Standard</strong> ou{' '}
              <strong>Premium</strong> pour en bénéficier.
            </p>

            <Link
              href="/register"
              className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-800 transition text-sm"
            >
              Voir les plans
            </Link>
          </div>

          <Link
            href="/"
            className="inline-block mt-6 text-gray-400 hover:text-gray-600 text-sm"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6">
            {cooperative.logo ? (
              <img
                src={cooperative.logo}
                alt={cooperative.name}
                className="w-full h-full object-cover rounded-3xl"
              />
            ) : (
              <Building2
                size={48}
                className="text-white"
              />
            )}
          </div>

          <h1 className="text-4xl font-bold mb-3">
            {cooperative.name}
          </h1>

          <p className="text-emerald-100 text-lg">
            Coopérative Dagoo
          </p>

          {cooperative.description && (
            <p className="text-emerald-100/80 max-w-2xl mx-auto mt-4">
              {cooperative.description}
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-6 mt-8">
            {cooperative.phone && (
              <div className="flex items-center gap-2 text-white/80">
                <Phone size={18} />
                {cooperative.phone}
              </div>
            )}

            {cooperative.email && (
              <div className="flex items-center gap-2 text-white/80">
                <Mail size={18} />
                {cooperative.email}
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="py-20 max-w-5xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Notre coopérative
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-emerald-50 rounded-2xl p-6 text-center">
            <Car
              size={32}
              className="mx-auto text-emerald-600 mb-3"
            />

            <div className="text-3xl font-bold text-gray-800">
              {cooperative._count?.vehicles ??
                cooperative.vehicles?.length ??
                0}
            </div>

            <p className="text-gray-500 mt-1">
              Véhicules actifs
            </p>
          </div>

          <div className="bg-blue-50 rounded-2xl p-6 text-center">
            <Users
              size={32}
              className="mx-auto text-blue-600 mb-3"
            />

            <div className="text-3xl font-bold text-gray-800">
              {cooperative._count?.drivers ??
                cooperative.drivers?.length ??
                0}
            </div>

            <p className="text-gray-500 mt-1">
              Chauffeurs actifs
            </p>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mb-12">
          Nos services de transport
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Car,
              title: 'Transport rapide',
              desc: 'Courses urbaines et interurbaines',
            },
            {
              icon: Building2,
              title: 'Organisation coopérative',
              desc: 'Une gestion structurée au service des membres',
            },
            {
              icon: Users,
              title: 'Chauffeurs qualifiés',
              desc: 'Professionnels expérimentés',
            },
            {
              icon: Car,
              title: 'Véhicules entretenus',
              desc: 'Parc régulièrement vérifié',
            },
            {
              icon: Phone,
              title: 'Support',
              desc: 'Une équipe disponible pour vous accompagner',
            },
            {
              icon: Building2,
              title: 'Proximité',
              desc: 'Un service adapté aux réalités locales',
            },
          ].map((service) => {
            const Icon = service.icon;

            return (
              <div
                key={service.title}
                className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-lg transition"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Icon
                    size={26}
                    className="text-emerald-600"
                  />
                </div>

                <h3 className="font-bold text-gray-800 mb-2">
                  {service.title}
                </h3>

                <p className="text-gray-500 text-sm">
                  {service.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Contactez-nous
          </h2>

          <div className="flex flex-col items-center gap-4 text-gray-600">
            {cooperative.email && (
              <p className="flex items-center gap-2">
                <Mail size={18} />
                {cooperative.email}
              </p>
            )}

            {cooperative.phone && (
              <p className="flex items-center gap-2">
                <Phone size={18} />
                {cooperative.phone}
              </p>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Building2 size={16} />

          <span className="font-bold text-white">
            {cooperative.name}
          </span>
        </div>

        <p>
          Propulsé par{' '}
          <Link
            href="/"
            className="text-secondary hover:underline"
          >
            Dagoo Mobility
          </Link>
        </p>

        <p className="mt-1">
          Chez les potes, ça roule.
        </p>
      </footer>
    </div>
  );
}
