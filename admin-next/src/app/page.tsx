import Link from 'next/link';
import { Building2, Users, Shield, Zap, Smartphone, Car } from 'lucide-react';
import HeroWithDriverModal from '@/components/landing/HeroWithDriverModal';
import PlansSection from '@/components/landing/PlansSection';
import ServiceCards from '@/components/landing/ServiceCards';
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

      {/* NOS PARTENAIRES */}
      <TrustSection />

      {/* SECTION SERVICES AVEC CARTES */}
      <ServiceCards organizations={organizations} coopsAvecDeparts={coopsAvecDeparts} />

      {/* CHIFFRES CLÉS */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-primary text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Chiffres clés</h2>
          <div className="grid grid-cols-3 gap-8">
            <div><div className="text-4xl font-bold">{organizations.filter((o: { type?: string }) => o.type === 'FLEET_MANAGER').length}</div><div className="text-white/70 text-sm">Services urbains</div></div>
            <div><div className="text-4xl font-bold">{organizations.filter((o: { type?: string }) => o.type === 'COOPERATIVE').length}</div><div className="text-white/70 text-sm">Services inter-urbains</div></div>
            <div><div className="text-4xl font-bold">{coopsAvecDeparts.length}</div><div className="text-white/70 text-sm">Avec départs</div></div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <div id="plans"><PlansSection /></div>

      {/* POURQUOI DAGOOS */}
      <section id="pourquoi" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Pourquoi Dagoos ?</h2>
          <p className="text-gray-500 mb-12">Une plateforme unique pour votre mobilité</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Car, title: 'Réservation en ligne', desc: 'Réservez vos places en quelques clics' },
              { icon: Users, title: 'Services inter-urbains fiables', desc: 'Des partenaires de confiance' },
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
        <p className="text-white/80 mb-8">Gérez votre activité de transport depuis un espace unique</p>
        <Link href="/urbain-login" className="inline-block bg-secondary text-dark px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-400 transition">
          Accéder à mon espace
        </Link>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12 text-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Logo + description */}
            <div>
              <div className="text-white font-bold text-lg mb-3">DAGO MOBILITY</div>
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
