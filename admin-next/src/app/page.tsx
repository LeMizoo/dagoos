import Link from 'next/link';
import { Rocket, ArrowDown, Building2, Truck, Smartphone, Users, Shield, Zap, Car } from 'lucide-react';

async function getStats() {
  try {
    const res = await fetch('https://dagoos-api.onrender.com/api/organizations', { cache: 'no-store' });
    if (!res.ok) return null;
    const orgs = await res.json();
    const fleets = orgs.filter((o: any) => o.type === 'FLEET_MANAGER').length;
    const coops = orgs.filter((o: any) => o.type === 'COOPERATIVE').length;
    return { fleets, coops, total: orgs.length };
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
            <img src="/logo.svg" alt="Dagoo Mobility" className="h-10 w-auto" />
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
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark to-primary/30" />
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

      {/* ESPACES */}
      <section id="spaces" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Nos Espaces</h2>
          <p className="text-center text-gray-500 mb-12">Choisissez votre espace pour commencer</p>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-lg transition border border-gray-100">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Truck size={32} className="text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Gestionnaire de Flotte</h3>
              <p className="text-gray-500 text-sm mb-6">Gérez vos véhicules, chauffeurs et finances.</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link href="/fleet-login" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">Connexion</Link>
                <Link href="/register" className="border-2 border-blue-600 text-blue-600 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-50 transition">Inscription</Link>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm hover:shadow-lg transition border border-gray-100">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 size={32} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Coopérative</h3>
              <p className="text-gray-500 text-sm mb-6">Gérez votre coopérative, contrats et livraisons.</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link href="/coop-login" className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition">Connexion</Link>
                <Link href="/register" className="border-2 border-emerald-600 text-emerald-600 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition">Inscription</Link>
              </div>
            </div>
          </div>
          <div className="mt-6 max-w-sm mx-auto">
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-lg transition border border-gray-100">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Smartphone size={28} className="text-orange-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Application Chauffeur</h3>
              <p className="text-gray-500 text-xs mb-4">Recevez des courses, suivez vos revenus.</p>
              <a href="https://dago-driver.pages.dev" className="bg-orange-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition inline-block">Ouvrir l&apos;app</a>
            </div>
          </div>
        </div>
      </section>

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
