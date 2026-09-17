import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import LandingLayout from '@/components/landing/LandingLayout';

export default function BlogPage() {
  return (
    <LandingLayout>
      <main className="min-h-screen bg-white">

        {/* HERO */}
        <section className="bg-gradient-to-r from-primary to-dark text-white py-20">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              Blog
            </p>
            <h1 className="font-display text-4xl font-bold sm:text-5xl">
              Le blog Dago Mobility
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
              Actualités, produits et retours d'expérience.
            </p>
          </div>
        </section>

        {/* ÉTAT VIDE */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="h-8 w-8" />
            </div>
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-3">
              Le blog arrive bientôt
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Nous préparons des articles sur la mobilité, nos produits et nos
              retours d'expérience. Revenez bientôt, ou contactez-nous si vous
              avez une question.
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
