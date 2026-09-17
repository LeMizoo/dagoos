import Link from 'next/link';
import { Route, Users, Wallet, Zap, Smartphone, Building2 } from 'lucide-react';
import HeroWithDriverModal from '@/components/landing/HeroWithDriverModal';
import PlansSection from '@/components/landing/PlansSection';
import ServiceCards from '@/components/landing/ServiceCards';
import RouteDivider from '@/components/landing/RouteDivider';
import CTASection from '@/components/landing/CTASection';
import { API_BASE_URL } from '@/lib/config';
import TrustSection from '@/components/landing/TrustSection';
import LandingLayout from '@/components/landing/LandingLayout';

export const dynamic = 'force-dynamic';

async function getOrganizations() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${API_BASE_URL}/api/public/organizations`, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error('API organisations:', res.status);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Erreur fetch organisations:', e);
    return [];
  }
}

export default async function LandingPage() {
  const organizations = await getOrganizations();
  const coopsAvecDeparts = organizations.filter((org: { type?: string; departs?: any[] }) => {
    if (org.type !== 'COOPERATIVE' || !org.departs) return false;

    // Filtrer les départs déjà partis
    const departsFuturs = org.departs.filter((d: { heure?: string; date: string }) => {
      const [year, month, day] = d.date.slice(0, 10).split('-').map(Number);
      const [h, m] = (d.heure || '00:00').split(':').map(Number);
      const departTime = new Date(year, month - 1, day, h, m, 0, 0);
      return departTime.getTime() > Date.now();
    });

    org.departs = departsFuturs;
    return departsFuturs.length > 0;
  });

  return (
    <LandingLayout showHeader={false}>
      <div id="top" className="min-h-screen bg-white">
      {/* HERO */}
      <HeroWithDriverModal />

      {/* SÉPARATEUR — ligne de route, signature visuelle du réseau Dago */}
      <RouteDivider />

      {/* NOS PARTENAIRES */}
      <TrustSection />

      {/* SECTION SERVICES AVEC CARTES */}
      <ServiceCards organizations={organizations} coopsAvecDeparts={coopsAvecDeparts} />
      
      <div className="flex justify-center py-6">
        <Link
          href="/suivi"
          className="group flex items-center gap-3 bg-white border-2 border-primary rounded-2xl px-6 py-4 shadow-lg hover:shadow-xl hover:bg-primary hover:text-white transition-all duration-300"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">📋</span>
          <span className="text-left">
            <span className="block font-bold text-primary group-hover:text-white transition-colors">Suivre ma demande</span>
            <span className="block text-xs text-gray-500 group-hover:text-white/80 transition-colors">
              Vérifiez le statut avec votre code de suivi
            </span>
          </span>
          <span className="ml-2 text-primary group-hover:text-white transition-colors">→</span>
        </Link>
      </div>

      {/* CHIFFRES CLÉS */}
      <section className="py-16 bg-gradient-to-r from-primary to-dark text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold mb-8">Le réseau en un coup d'œil</h2>
          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="font-display text-4xl font-bold">{organizations.filter((o: { type?: string }) => o.type === 'FLEET_MANAGER').length}</div>
              <div className="text-white/70 text-sm mt-1">Services urbains</div>
            </div>
            <div>
              <div className="font-display text-4xl font-bold">{organizations.filter((o: { type?: string }) => o.type === 'COOPERATIVE').length}</div>
              <div className="text-white/70 text-sm mt-1">Services inter-urbains</div>
            </div>
            <div>
              <div className="font-display text-4xl font-bold text-secondary">{coopsAvecDeparts.length}</div>
              <div className="text-white/70 text-sm mt-1">Départs à venir</div>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <div id="plans"><PlansSection /></div>

      {/* POURQUOI DAGOOS */}
      <section id="pourquoi" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Pourquoi Dagoos ?</h2>
          <p className="text-gray-500 mb-12">Tout ce qu'il faut pour piloter une activité de transport, dans un seul espace</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Route, title: 'Suivi des courses en temps réel', desc: "Position et statut de chaque véhicule, du départ à l'arrivée." },
              { icon: Users, title: 'Réseau inter-urbain vérifié', desc: 'Des coopératives partenaires sur les grands axes de Madagascar.' },
              { icon: Wallet, title: 'Finances centralisées', desc: 'Courses, dépenses et versements suivis automatiquement.' },
              { icon: Zap, title: 'Confirmation immédiate', desc: 'Une réservation validée en quelques secondes, sans attente.' },
              { icon: Smartphone, title: 'Un espace pour chaque rôle', desc: 'Chauffeurs, gestionnaires et coopératives, chacun son accès.' },
              { icon: Building2, title: 'Ouvrez votre espace', desc: 'Flotte ou coopérative : votre organisation en quelques minutes.' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="bg-gray-50 rounded-2xl p-6 text-left hover:shadow-lg transition">
                  <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-gray-800 mb-2">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <CTASection />

      </div>
    </LandingLayout>
  );
}
