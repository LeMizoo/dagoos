import Link from 'next/link';
import { Rocket, ArrowDown, Building2, Truck, Smartphone, Users, Shield, Zap, Car } from 'lucide-react';
import HeroSlider from '@/components/landing/HeroSlider';
import PlansSection from '@/components/landing/PlansSection';

async function getStats() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:5001'}/api/public/stats`, { cache: 'no-store' });
    if (!res.ok) return null;
    const orgs = await res.json();
    // Stats fournies directement par l'API publique
    
    return res.json();
  } catch { return null; }
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
            <a href="#services" className="text-gray-300 hover:text-white text-sm">Services</a>
            <a href="#stats" className="text-gray-300 hover:text-white text-sm">Chiffres</a>
            <a href="#about" className="text-gray-300 hover:text-white text-sm">À propos</a>
            <Link href="#spaces" className="bg-secondary text-dark px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-400 transition">Commencer</Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center bg-dark overflow-hidden">
        <HeroSlider />
        <div className="absolute inset-0 bg-gradient-to-br from-dark/80 via-dark/70 to-primary/50 z-10" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm mb-6 backdrop-blur-sm">
            <Rocket size={16} /> Dago Mobility
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            La mobilité connectée...
            <br />
            <span className="text-secondary">Chez les potes, ça roule.</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8 italic max-w-xl mx-auto">
            &ldquo;Ny asa tsy mba vintana, fa fitsirihana&rdquo; — Le succès dépend de votre persévérance.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="#spaces" className="bg-secondary text-dark px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-400 transition flex items-center gap-2">
              <Rocket size={20} /> Commencer
            </Link>
            <a href="#services" className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition flex items-center gap-2">
              <ArrowDown size={20} /> Découvrir
            </a>
          </div>
        </div>
      </section>

      {/* CHIFFRES CLÉS */}
      {stats && (
        <section id="stats" className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Chiffres clés</h2>
            <div className="grid grid-cols-3 gap-8 text-center">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="text-4xl font-bold text-blue-600">{stats.fleets}</div>
                <div className="text-gray-500 text-sm mt-1">Flottes actives</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="text-4xl font-bold text-emerald-600">{stats.coops}</div>
                <div className="text-gray-500 text-sm mt-1">Coopératives</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="text-4xl font-bold text-primary">{stats.total}</div>
                <div className="text-gray-500 text-sm mt-1">Total organisations</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PLANS */}
      <PlansSection />

      {/* SERVICES */}
      <section id="services" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Nos Services</h2>
          <p className="text-center text-gray-500 mb-12">Tout pour gérer votre mobilité</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Car, title: 'Flotte', desc: 'Suivi en temps réel de vos véhicules, entretien, assurance.', color: 'blue' },
              { icon: Users, title: 'Chauffeurs', desc: 'Recrutement, assignation, permutation et performances.', color: 'green' },
              { icon: Shield, title: 'Sécurité', desc: 'Documents légaux, contrats, assurances tout-en-un.', color: 'purple' },
              { icon: Zap, title: 'Temps réel', desc: 'Suivi GPS, statut des courses, notifications.', color: 'yellow' },
              { icon: Truck, title: 'Livraisons', desc: 'Gérez vos livraisons avec suivi en temps réel.', color: 'orange' },
              { icon: Smartphone, title: 'Mobile', desc: 'PWA disponible sur tous les appareils, hors ligne.', color: 'red' },
            ].map(s => {
              const Icon = s.icon;
              const colors: Record<string, string> = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', purple: 'bg-purple-100 text-purple-600', yellow: 'bg-yellow-100 text-yellow-600', orange: 'bg-orange-100 text-orange-600', red: 'bg-red-100 text-red-600' };
              return (
                <div key={s.title} className="bg-white rounded-2xl p-6 hover:shadow-md transition">
                  <div className={`w-12 h-12 ${colors[s.color]} rounded-xl flex items-center justify-center mb-4`}><Icon size={24} /></div>
                  <h3 className="font-bold text-gray-800 mb-2">{s.title}</h3><p className="text-gray-500 text-sm">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-20 bg-dark text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">À propos de <span className="text-secondary">Dagoo</span></h2>
          <p className="text-gray-400 text-lg mb-8">Dagoo est la première plateforme malgache de mobilité connectée. Nous accompagnons les gestionnaires de flotte, les coopératives et les chauffeurs avec des outils modernes, simples et adaptés au contexte local.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {['Innovation', 'Proximité', 'Fiabilité', 'Made in Madagascar', 'Support local', 'Écologique'].map(v => <span key={v} className="bg-white/10 px-4 py-2 rounded-full text-sm">{v}</span>)}
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>© {new Date().getFullYear()} Dagoo Mobility. Chez les potes, ça roule.</p>
      </footer>
    </div>
  );
}
