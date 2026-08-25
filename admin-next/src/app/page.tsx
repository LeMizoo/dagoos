import Link from 'next/link';
import { Route, Users, Wallet, Zap, Smartphone, Building2 } from 'lucide-react';
import HeroWithDriverModal from '@/components/landing/HeroWithDriverModal';
import PlansSection from '@/components/landing/PlansSection';
import ServiceCards from '@/components/landing/ServiceCards';
import RouteDivider from '@/components/landing/RouteDivider';
import { API_BASE_URL } from '@/lib/config';
import TrustSection from '@/components/landing/TrustSection';

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
    <div id="top" className="min-h-screen bg-white">
      {/* HERO */}
      <HeroWithDriverModal />

      {/* SÉPARATEUR — ligne de route, signature visuelle du réseau Dago */}
      <RouteDivider />

      {/* NOS PARTENAIRES */}
      <TrustSection />

      {/* SECTION SERVICES AVEC CARTES */}
      <ServiceCards organizations={organizations} coopsAvecDeparts={coopsAvecDeparts} />

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
      <section className="py-16 bg-gradient-to-r from-primary to-dark text-white text-center">
        <h2 className="font-display text-3xl font-bold mb-4">Rejoignez le réseau Dago</h2>
        <p className="text-white/80 mb-8">Gérez votre activité de transport depuis un espace unique</p>
        <Link href="/flotte-login" className="inline-block bg-secondary text-dark px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-400 transition">
          Accéder à mon espace
        </Link>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12 text-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Logo + description */}
            <div>
              <div className="font-display text-white font-bold text-lg mb-3">DAGO MOBILITY</div>
              <p className="text-gray-400 text-sm leading-relaxed">
                La mobilité connectée... Chez les potes, ça roule.
              </p>
            </div>

            {/* Produit */}
            <div>
              <h4 className="text-white font-semibold mb-3">Produit</h4>
              <ul className="space-y-2">
                <li><a href="#services-de-mobilite" className="hover:text-emerald-400 transition">Fonctionnalités</a></li>
                <li><a href="#plans" className="hover:text-emerald-400 transition">Tarifs</a></li>
                <li><a href="#faq" className="hover:text-emerald-400 transition">FAQ</a></li>
              </ul>
            </div>

            {/* Entreprise */}
            <div>
              <h4 className="text-white font-semibold mb-3">Entreprise</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-emerald-400 transition">À propos</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Blog</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Carrières</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold mb-3">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-emerald-400 transition">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Contact</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition">Statut</a></li>
              </ul>
            </div>
          </div>

          {/* Bas de page */}
          <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© {new Date().getFullYear()} Dago Mobility. Tous droits réservés.</p>
            <a
              href="#top"
              className="bg-emerald-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-emerald-700 transition"
              aria-label="Revenir en haut"
            >
              ↑
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
