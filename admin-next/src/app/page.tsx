import Link from 'next/link';
import { Rocket, ArrowDown, Building2, Truck, Smartphone, Users, Shield, Zap, Car, MapPin, Calendar, Search, Phone, CheckCircle } from 'lucide-react';
import HeroSlider from '@/components/landing/HeroSlider';
import HeroParticles from '@/components/landing/HeroParticles';
import PlansSection from '@/components/landing/PlansSection';
import ServiceCards from '@/components/landing/ServiceCards';
import { API_BASE_URL } from '@/lib/config';
import TrustSection from '@/components/landing/TrustSection';
import AnimatedSection from '@/components/landing/AnimatedSection';

export const dynamic = 'force-dynamic';

async function getOrganizations() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/public/organizations`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function getCountdown(dateStr: string, heure: string): string {
  const [h, m] = heure.split(':').map(Number);
  const departTime = new Date(dateStr);
  departTime.setHours(h, m, 0, 0);
  
  const diff = departTime.getTime() - Date.now();
  if (diff <= 0) return 'Départ en cours';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `dans ${days}j ${hours % 24}h`;
  }
  return `dans ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}min`;
}

export default async function LandingPage() {
  const organizations = await getOrganizations();
  const coopsAvecDeparts = organizations.filter((org: any) => {
    if (org.type !== 'COOPERATIVE' || !org.departs) return false;
    
    // Filtrer les départs déjà partis
    const departsFuturs = org.departs.filter((d: any) => {
      const [h, m] = (d.heure || '').split(':').map(Number);
      const departTime = new Date(d.date);
      departTime.setHours(h, m, 0, 0);
      return departTime.getTime() > Date.now();
    });
    
    org.departs = departsFuturs;
    return departsFuturs.length > 0;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative flex items-center justify-center bg-dark overflow-hidden py-16 md:py-20">
        <HeroParticles />
        <HeroSlider />
        <div className="absolute inset-0 bg-gradient-to-br from-dark/80 via-dark/70 to-primary/50 z-10" />
        <div className="relative z-20 max-w-5xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-sm mb-6 backdrop-blur-sm border border-white/20">
            <Rocket size={16} className="text-secondary" /> Dago Mobility
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Voyagez malin,<br />
            <span className="text-secondary">réservez votre place en ligne.</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            Réservez votre trajet en toute simplicité auprès des coopératives partenaires.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="#reservation" className="bg-secondary text-dark px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-400 transition">
              🎫 Réserver un voyage
            </a>
            <Link href="/register" className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition">
              🏢 Devenir partenaire
            </Link>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="https://dago-driver.pages.dev" target="_blank" rel="noopener noreferrer" className="bg-amber-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-amber-600 transition text-center">
                🚕 Chauffeur Fleet
              </a>
              <a href="https://dago-coop-driver.pages.dev" target="_blank" rel="noopener noreferrer" className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition text-center">
                🚌 Chauffeur Coop
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* NOS PARTENAIRES */}
      <TrustSection />

      {/* SECTION SERVICES AVEC CARTES */}
      <ServiceCards organizations={organizations} coopsAvecDeparts={coopsAvecDeparts} />

      {/* CHIFFRES CLÉS */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-primary text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Chiffres clés</h2>
          <div className="grid grid-cols-3 gap-8">
            <div><div className="text-4xl font-bold">{organizations.filter((o: any) => o.type === 'FLEET_MANAGER').length}</div><div className="text-white/70 text-sm">Flottes</div></div>
            <div><div className="text-4xl font-bold">{organizations.filter((o: any) => o.type === 'COOPERATIVE').length}</div><div className="text-white/70 text-sm">Coopératives</div></div>
            <div><div className="text-4xl font-bold">{coopsAvecDeparts.length}</div><div className="text-white/70 text-sm">Avec départs</div></div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <PlansSection />

      {/* SERVICES */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Nos services</h2>
          <p className="text-gray-500 mb-12">Tout pour gérer votre mobilité</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Car, title: 'Réservation en ligne', desc: 'Réservez vos places en quelques clics' },
              { icon: Users, title: 'Coopératives fiables', desc: 'Des partenaires de confiance' },
              { icon: Shield, title: 'Sécurité garantie', desc: 'Vos données protégées' },
              { icon: Zap, title: 'Rapide', desc: 'Confirmation immédiate' },
              { icon: Smartphone, title: 'Mobile', desc: 'Accessible sur tous les appareils' },
              { icon: Building2, title: 'Partenariat', desc: 'Rejoignez le réseau Dago' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition">
                  <Icon size={32} className="mx-auto text-emerald-600 mb-3" />
                  <h3 className="font-bold text-gray-800 mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-primary to-blue-800 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Rejoignez l'aventure</h2>
        <p className="text-white/80 mb-8">Créez votre compte et commencez à gérer votre activité</p>
        <Link href="/register" className="inline-block bg-secondary text-dark px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-400 transition">
          🏢 S'inscrire en tant qu'organisation
        </Link>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <div className="flex justify-center gap-6 mb-4">
          <a href="https://dago-driver.pages.dev" target="_blank" rel="noopener noreferrer" className="text-white hover:text-amber-400 transition font-semibold">
            🚕 Espace Fleet
          </a>
          <a href="https://dago-coop-driver.pages.dev" target="_blank" rel="noopener noreferrer" className="text-white hover:text-emerald-400 transition font-semibold">
            🚌 Espace Coop
          </a>
          <Link href="/register" className="text-white hover:text-emerald-400 transition font-semibold">
            🏢 Devenir partenaire
          </Link>
        </div>
        <p>© {new Date().getFullYear()} Dagoo Mobility. Chez les potes, ça roule.</p>
      </footer>
    </div>
  );
}
