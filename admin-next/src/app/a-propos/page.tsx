import Link from 'next/link';
import { Users, Shield, Sparkles, ArrowRight } from 'lucide-react';
import LandingLayout from '@/components/landing/LandingLayout';

const VALUES = [
  {
    icon: Users,
    title: 'Proximité',
    desc: 'Une équipe accessible, des outils pensés pour les réalités du terrain.',
  },
  {
    icon: Shield,
    title: 'Fiabilité',
    desc: 'Des trajets suivis, des paiements tracés, une information transparente.',
  },
  {
    icon: Sparkles,
    title: 'Innovation',
    desc: 'Simplifier la mobilité grâce à des outils numériques adaptés à Madagascar.',
  },
];

export default function AProposPage() {
  return (
    <LandingLayout>
      <main className="min-h-screen bg-white">

        {/* HERO */}
        <section className="bg-gradient-to-r from-primary to-dark text-white py-20">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              À propos
            </p>
            <h1 className="font-display text-4xl font-bold sm:text-5xl">
              Dago Mobility
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
              La mobilité connectée. Chez les potes, ça roule.
            </p>
          </div>
        </section>

        {/* MISSION */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="font-display text-3xl font-bold text-gray-900 mb-6">
              Notre mission
            </h2>
            <p className="text-lg leading-relaxed text-gray-600">
              Dago Mobility connecte les acteurs de la mobilité à Madagascar :
              chauffeurs, coopératives, flottes et clients. Notre plateforme
              permet de réserver un trajet, suivre une course, ou gérer une
              activité de transport — le tout dans un seul espace.
            </p>
          </div>
        </section>

        {/* VALEURS */}
        <section className="py-16 sm:py-20 bg-gray-50">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-display text-3xl font-bold text-gray-900 text-center mb-12">
              Nos valeurs
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {VALUES.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-gray-900 mb-2">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
              Une question sur Dago Mobility ?
            </h2>
            <p className="text-gray-600 mb-8">
              Notre équipe vous répond.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-dark"
            >
              Nous contacter
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

      </main>
    </LandingLayout>
  );
}
