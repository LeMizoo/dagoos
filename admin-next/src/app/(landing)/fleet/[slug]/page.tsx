'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

interface LandingService {
  icon?: string;
  title?: string;
  desc?: string;
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

interface Fleet {
  id?: string;
  name?: string;
  slug?: string;
  email?: string;
  phone?: string;
  logo?: string;
  description?: string;

  slogan?: string;
  coverImage?: string;
  primaryColor?: string;
  secondaryColor?: string;
  landingEnabled?: boolean;
  landingTemplate?: string;
  address?: string;
  facebook?: string;
  whatsapp?: string;
  landingConfig?: LandingConfig;
}

const DEFAULT_SERVICES: LandingService[] = [
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

export default function FleetLandingPage({
  params,
}: {
  params: { slug: string };
}) {
  const [fleet, setFleet] = useState<Fleet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadFleet();
  }, [params.slug]);

  async function loadFleet() {
    try {
      setLoading(true);
      setError('');

      const res = await apiFetch(
        `/public/organizations/${params.slug}`
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error || 'Organisation introuvable'
        );
      }

      setFleet(data);
    } catch (e: any) {
      setError(e?.message || 'Impossible de charger la flotte');
    } finally {
      setLoading(false);
    }
  }

  async function submitAction(
    type: string,
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const form = e.currentTarget;
    setSending(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch('/public/actions', {
        method: 'POST',
        body: JSON.stringify({
          organizationSlug: params.slug,
          type,
          clientNom: form.elements.namedItem('nom')
            ? (form.elements.namedItem('nom') as HTMLInputElement).value
            : '',
          clientTel: form.elements.namedItem('tel')
            ? (form.elements.namedItem('tel') as HTMLInputElement).value
            : '',
          details: Object.fromEntries(new FormData(form)),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error || 'Impossible d’envoyer la demande'
        );
      }

      form.reset();
      setSuccess('Votre demande a bien été envoyée.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de l’envoi');
    } finally {
      setSending(false);
    }
  }

  const config = fleet?.landingConfig || {};

  const primary =
    fleet?.primaryColor || '#2563EB';

  const secondary =
    fleet?.secondaryColor || '#1D4ED8';

  const heroTitle =
    config.hero?.title ||
    fleet?.name ||
    'Votre mobilité, simplement';

  const heroSubtitle =
    config.hero?.subtitle ||
    fleet?.slogan ||
    fleet?.description ||
    'Réservez votre transport rapidement et en toute simplicité.';

  const aboutText =
    config.about?.text ||
    fleet?.description ||
    'Une solution de transport pensée pour vous accompagner au quotidien.';

  const services = useMemo(() => {
    if (
      Array.isArray(config.services) &&
      config.services.length > 0
    ) {
      return config.services;
    }

    return DEFAULT_SERVICES;
  }, [config.services]);

  const whatsappUrl = fleet?.whatsapp
    ? `https://wa.me/${fleet.whatsapp.replace(/\D/g, '')}`
    : null;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-white/20 border-t-white animate-spin"
            aria-hidden="true"
          />
          <p className="text-white/70">
            Chargement de votre espace...
          </p>
        </div>
      </main>
    );
  }

  if (error && !fleet) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Truck size={26} />
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Page indisponible
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: primary }}
          >
            Retour à l'accueil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-slate-50 text-slate-900"
      style={
        {
          '--primary': primary,
          '--secondary': secondary,
        } as React.CSSProperties
      }
    >
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        {fleet?.coverImage ? (
          <>
            <img
              src={fleet.coverImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/65" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/30" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${primary}, ${secondary})`,
            }}
          />
        )}

        <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-md transition hover:bg-white/20"
            >
              ← Dagoo Mobility
            </Link>

            {fleet?.phone && (
              <a
                href={`tel:${fleet.phone}`}
                className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur-md sm:inline-flex"
              >
                <Phone size={14} />
                {fleet.phone}
              </a>
            )}
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 sm:pb-32 lg:px-8 lg:pt-24">
          <div className="max-w-3xl">
            {fleet?.logo ? (
              <div className="mb-7 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-2xl">
                <img
                  src={fleet.logo}
                  alt={fleet.name || 'Logo'}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div
                className="mb-7 flex h-20 w-20 items-center justify-center rounded-2xl text-white shadow-2xl"
                style={{ backgroundColor: primary }}
              >
                <Truck size={36} />
              </div>
            )}

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur-md">
              <Sparkles size={14} />
              Flotte Premium
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              {heroTitle}
            </h1>

            {fleet?.slogan && fleet.slogan !== heroTitle && (
              <p className="mt-4 text-lg font-medium text-white/90 sm:text-2xl">
                {fleet.slogan}
              </p>
            )}

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
              {heroSubtitle}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#course"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold text-white shadow-xl transition hover:-translate-y-0.5"
                style={{ backgroundColor: primary }}
              >
                Demander une course
                <ArrowRight size={18} />
              </a>

              <a
                href="#reservation"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                <Calendar size={18} />
                Réserver un taxi
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-50 to-transparent" />
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: primary }}
          >
            Nos services
          </span>

          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Une mobilité pensée pour vous
          </h2>

          <p className="mt-4 text-slate-500">
            Découvrez les services proposés par {fleet?.name || 'notre flotte'}.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <article
              key={`${service.title || 'service'}-${index}`}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                style={{
                  backgroundColor: `${primary}15`,
                }}
              >
                {service.icon || '✓'}
              </div>

              <h3 className="mt-5 text-lg font-bold">
                {service.title || 'Service'}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {service.desc || ''}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-20">
          <div>
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: primary }}
            >
              À propos
            </span>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Votre partenaire mobilité
            </h2>

            <p className="mt-5 whitespace-pre-line text-base leading-8 text-slate-600">
              {aboutText}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold">
                <ShieldCheck
                  size={17}
                  style={{ color: primary }}
                />
                Service professionnel
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold">
                <CheckCircle2
                  size={17}
                  style={{ color: primary }}
                />
                Réservation en ligne
              </div>
            </div>
          </div>

          <div
            className="relative min-h-[280px] overflow-hidden rounded-[2rem]"
            style={{
              background: `linear-gradient(135deg, ${primary}, ${secondary})`,
            }}
          >
            {fleet?.coverImage && (
              <img
                src={fleet.coverImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-25"
              />
            )}

            <div className="relative flex h-full min-h-[280px] flex-col justify-end p-8 text-white">
              <Truck size={42} />
              <p className="mt-5 text-2xl font-black">
                {fleet?.name || 'Votre flotte'}
              </p>
              {fleet?.slogan && (
                <p className="mt-2 text-white/75">
                  {fleet.slogan}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FEEDBACK */}
      {(error || success) && (
        <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {success}
            </div>
          )}
        </div>
      )}

      {/* COURSE */}
      <section
        id="course"
        className="mx-auto max-w-4xl scroll-mt-8 px-4 py-16 sm:px-6 lg:py-20"
      >
        <div className="mb-8 text-center">
          <span
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: primary }}
          >
            Réservation instantanée
          </span>

          <h2 className="mt-3 text-3xl font-black">
            Demander une course
          </h2>

          <p className="mt-3 text-slate-500">
            Indiquez votre trajet et nous traiterons votre demande.
          </p>
        </div>

        <form
          onSubmit={(e) => submitAction('COURSE_REQUEST', e)}
          className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              name="nom"
              placeholder="Votre nom"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-[var(--primary)] focus:bg-white"
              required
            />

            <input
              name="tel"
              type="tel"
              placeholder="Votre téléphone"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-[var(--primary)] focus:bg-white"
              required
            />

            <input
              name="depart"
              placeholder="Adresse de départ"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-[var(--primary)] focus:bg-white"
              required
            />

            <input
              name="arrivee"
              placeholder="Adresse d'arrivée"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-[var(--primary)] focus:bg-white"
              required
            />

            <select
              name="typeVehicule"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-[var(--primary)] focus:bg-white sm:col-span-2"
            >
              <option value="moto">Taxi Moto</option>
              <option value="voiture">Taxi</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ backgroundColor: primary }}
          >
            <Send size={18} />
            {sending ? 'Envoi en cours...' : 'Envoyer ma demande'}
          </button>
        </form>
      </section>

      {/* TAXI RESERVATION */}
      <section
        id="reservation"
        className="scroll-mt-8 bg-slate-100"
      >
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="mb-8 text-center">
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: primary }}
            >
              Planifier
            </span>

            <h2 className="mt-3 text-3xl font-black">
              Réserver un taxi
            </h2>
          </div>

          <form
            onSubmit={(e) => submitAction('TAXI_RESERVATION', e)}
            className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl sm:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="nom"
                placeholder="Votre nom"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none"
                required
              />

              <input
                name="tel"
                type="tel"
                placeholder="Votre téléphone"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none"
                required
              />

              <label className="relative">
                <Calendar
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  name="date"
                  type="date"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none"
                  required
                />
              </label>

              <label className="relative">
                <Clock
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  name="heure"
                  type="time"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none"
                  required
                />
              </label>

              <input
                name="priseEnCharge"
                placeholder="Adresse de prise en charge"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none sm:col-span-2"
                required
              />

              <input
                name="destination"
                placeholder="Destination"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none sm:col-span-2"
                required
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-bold text-white transition disabled:opacity-60"
              style={{ backgroundColor: primary }}
            >
              <Calendar size={18} />
              {sending ? 'Envoi en cours...' : 'Confirmer la réservation'}
            </button>
          </form>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:py-20"
      >
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: primary }}
            >
              Contact
            </span>

            <h2 className="mt-3 text-3xl font-black">
              Parlons de votre trajet
            </h2>

            <p className="mt-4 text-slate-500">
              Une question ? Une demande particulière ? Notre équipe est à votre écoute.
            </p>

            <div className="mt-7 space-y-4">
              {fleet?.phone && (
                <a
                  href={`tel:${fleet.phone}`}
                  className="flex items-center gap-3 text-sm font-semibold"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${primary}15` }}
                  >
                    <Phone size={18} style={{ color: primary }} />
                  </span>
                  {fleet.phone}
                </a>
              )}

              {fleet?.email && (
                <a
                  href={`mailto:${fleet.email}`}
                  className="flex items-center gap-3 text-sm font-semibold"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${primary}15` }}
                  >
                    <Mail size={18} style={{ color: primary }} />
                  </span>
                  {fleet.email}
                </a>
              )}

              {fleet?.address && (
                <div className="flex items-center gap-3 text-sm font-semibold">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${primary}15` }}
                  >
                    <MapPin size={18} style={{ color: primary }} />
                  </span>
                  {fleet.address}
                </div>
              )}

              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-sm font-semibold"
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${primary}15` }}
                  >
                    <MessageCircle
                      size={18}
                      style={{ color: primary }}
                    />
                  </span>
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          <form
            onSubmit={(e) => submitAction('CONTACT', e)}
            className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl sm:p-8"
          >
            <div className="grid gap-4">
              <input
                name="nom"
                placeholder="Votre nom"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none"
                required
              />

              <input
                name="tel"
                type="tel"
                placeholder="Votre téléphone"
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none"
                required
              />

              <textarea
                name="message"
                placeholder="Votre message"
                rows={5}
                className="resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none"
                required
              />

              <button
                type="submit"
                disabled={sending}
                className="flex items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: primary }}
              >
                <Send size={18} />
                Envoyer le message
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                {fleet?.logo ? (
                  <img
                    src={fleet.logo}
                    alt=""
                    className="h-10 w-10 rounded-xl bg-white object-contain p-1"
                  />
                ) : (
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: primary }}
                  >
                    <Truck size={20} />
                  </div>
                )}

                <div>
                  <p className="font-bold">
                    {fleet?.name || 'Flotte'}
                  </p>
                  <p className="text-xs text-white/50">
                    Propulsé par Dagoo Mobility
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/"
              className="text-sm text-white/60 transition hover:text-white"
            >
              ← Retour à Dagoo Mobility
            </Link>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6 text-xs text-white/40">
            © {new Date().getFullYear()} {fleet?.name || 'Flotte'}. Tous droits réservés.
          </div>
        </div>
      </footer>
    </main>
  );
}
