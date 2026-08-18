import Link from 'next/link';
import { Rocket, ArrowDown, Building2, Truck, Smartphone, Users, Shield, Zap, Car } from 'lucide-react';
import HeroSlider from '@/components/landing/HeroSlider';
import HeroParticles from '@/components/landing/HeroParticles';
import PlansSection from '@/components/landing/PlansSection';
import TrustSection from '@/components/landing/TrustSection';
import AnimatedSection from '@/components/landing/AnimatedSection';

async function getStats() {
  try {
    const res = await fetch(
      '/api/proxy/public/organizations',
      { cache: 'no-store' }
    );

    if (!res.ok) {
      return { fleets: 0, coops: 0, total: 0 };
    }

    const organizations = await res.json();

    const fleets = organizations.filter(
      (org: { type: string }) => org.type === 'FLEET_MANAGER'
    ).length;

    const coops = organizations.filter(
      (org: { type: string }) => org.type === 'COOPERATIVE'
    ).length;

    return {
      fleets,
      coops,
      total: organizations.length,
    };
  } catch {
    return { fleets: 0, coops: 0, total: 0 };
  }
}

export default async function LandingPage() {
  const stats = await getStats();

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 bg-dark/90 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/b-trans.svg" alt="Dagoo Mobility" className="h-10 w-auto" />
            <span className="text-white font-bold text-lg">DAGOO MOBILITY</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#services" className="text-gray-300 hover:text-secondary transition text-sm">Services</a>
            <a href="#plans" className="text-gray-300 hover:text-secondary transition text-sm">Plans</a>
            <a href="#stats" className="text-gray-300 hover:text-secondary transition text-sm">Chiffres</a>
            <a href="#about" className="text-gray-300 hover:text-secondary transition text-sm">À propos</a>
            <Link href="#plans" className="bg-secondary text-dark px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-400 transition animate-pulse">Commencer</Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center bg-dark overflow-hidden">
        <HeroParticles />
        <HeroSlider />
        <div className="absolute inset-0 bg-gradient-to-br from-dark/80 via-dark/70 to-primary/50 z-10" />
        <div className="relative z-20 max-w-7xl mx-auto px-4 py-20 text-center">
          <AnimatedSection animation="fade-up">
            <span className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm mb-6 backdrop-blur-sm border border-white/20">
              <Rocket size={16} className="text-secondary" /> Dago Mobility
            </span>
          </AnimatedSection>
          <AnimatedSection animation="scale-in">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
              La mobilité connectée...
              <br />
              <span className="text-secondary bg-gradient-to-r from-secondary to-yellow-300 bg-clip-text text-transparent">Chez les potes, ça roule.</span>
            </h1>
          </AnimatedSection>
          <AnimatedSection animation="fade-up">
            <p className="text-gray-400 text-lg mb-8 italic max-w-xl mx-auto">
              &ldquo;Ny asa tsy mba vintana, fa fitsirihana&rdquo; — Le succès dépend de votre persévérance.
            </p>
          </AnimatedSection>
          <AnimatedSection animation="slide-left">
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="#plans" className="bg-secondary text-dark px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-400 transition flex items-center gap-2 hover:scale-105 transform">
                <Rocket size={20} /> Commencer
              </Link>
              <a href="#services" className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition flex items-center gap-2 hover:scale-105 transform">
                <ArrowDown size={20} /> Découvrir
              </a>
            </div>
          </AnimatedSection>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <ArrowDown size={24} className="text-white/50" />
        </div>
      </section>

      {/* CHIFFRES CLÉS */}
      <AnimatedSection animation="fade-up">
        <section id="stats" className="py-16 bg-gradient-to-r from-blue-600 to-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-60 h-60 bg-secondary rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-white mb-8">Chiffres clés</h2>
            <div className="grid grid-cols-3 gap-8 text-center">
              {[
                { value: stats.fleets, label: 'Flottes actives', color: 'from-blue-400 to-blue-300' },
                { value: stats.coops, label: 'Coopératives', color: 'from-emerald-400 to-emerald-300' },
                { value: stats.total, label: 'Total organisations', color: 'from-secondary to-yellow-300' },
              ].map(s => (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition">
                  <div className={`text-5xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</div>
                  <div className="text-white/80 text-sm mt-2">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* PLANS */}
      <PlansSection />

      {/* ILS NOUS FONT CONFIANCE */}
      <TrustSection />

      {/* SERVICES */}
      <AnimatedSection animation="fade-up">
        <section id="services" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Nos Services</h2>
            <p className="text-center text-gray-500 mb-12">Tout pour gérer votre mobilité</p>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Car, title: 'Flotte', desc: 'Suivi en temps réel de vos véhicules, entretien, assurance.', color: 'blue', gradient: 'from-blue-500 to-blue-600' },
                { icon: Users, title: 'Chauffeurs', desc: 'Recrutement, assignation, permutation et performances.', color: 'green', gradient: 'from-emerald-500 to-emerald-600' },
                { icon: Shield, title: 'Sécurité', desc: 'Documents légaux, contrats, assurances tout-en-un.', color: 'purple', gradient: 'from-purple-500 to-purple-600' },
                { icon: Zap, title: 'Temps réel', desc: 'Suivi GPS, statut des courses, notifications.', color: 'yellow', gradient: 'from-yellow-500 to-orange-500' },
                { icon: Truck, title: 'Livraisons', desc: 'Gérez vos livraisons avec suivi en temps réel.', color: 'orange', gradient: 'from-orange-500 to-red-500' },
                { icon: Smartphone, title: 'Mobile', desc: 'PWA disponible sur tous les appareils, hors ligne.', color: 'red', gradient: 'from-red-500 to-pink-500' },
              ].map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.title} className="group bg-white rounded-2xl p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-transparent hover:-translate-y-1">
                    <div className={`w-14 h-14 bg-gradient-to-br ${s.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                      <Icon size={24} className="text-white" />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-2">{s.title}</h3>
                    <p className="text-gray-500 text-sm">{s.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* ABOUT */}
      <AnimatedSection animation="fade-up">
        <section id="about" className="py-20 bg-dark text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">À propos de <span className="text-secondary">Dagoo</span></h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Dagoo est la première plateforme malgache de mobilité connectée. Nous accompagnons les gestionnaires de flotte,
              les coopératives et les chauffeurs avec des outils modernes, simples et adaptés au contexte local.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {['Innovation', 'Proximité', 'Fiabilité', 'Made in Madagascar', 'Support local', 'Écologique'].map(v => (
                <span key={v} className="bg-white/10 px-4 py-2 rounded-full text-sm hover:bg-secondary/20 hover:text-secondary transition cursor-default">{v}</span>
              ))}
            </div>
          </div>
        </section>
      </AnimatedSection>

      {/* CTA Final */}
      <section className="py-16 bg-gradient-to-r from-primary to-blue-800 text-white text-center">
        <AnimatedSection animation="scale-in">
          <h2 className="text-3xl font-bold mb-4">Prêt à nous rejoindre ?</h2>
          <p className="text-white/80 mb-8">Créez votre compte gratuitement et commencez à gérer votre flotte</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-secondary text-dark px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-400 transition hover:scale-105 transform">
            <Rocket size={20} /> Créer un compte gratuit
          </Link>
        </AnimatedSection>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>© {new Date().getFullYear()} Dagoo Mobility. Chez les potes, ça roule.</p>
      </footer>
    </div>
  );
}
