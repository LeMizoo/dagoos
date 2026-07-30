import { Building2, Phone, Mail, Globe, MapPin } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getOrg(slug: string) {
  try {
    const loginRes = await fetch('https://dagoos-api.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@dagoos.mg', password: 'admin123' }),
    });
    if (!loginRes.ok) return null;
    const { token } = await loginRes.json();

    const res = await fetch('https://dagoos-api.onrender.com/api/organizations', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const orgs = await res.json();
    return orgs.find((o: any) => o.slug === slug && o.type === 'COOPERATIVE') || null;
  } catch {
    return null;
  }
}

export default async function FleetLandingPage({ params }: { params: { slug: string } }) {
  const org = await getOrg(params.slug);

  if (!org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
          <h1 className="text-3xl font-bold text-gray-300 mb-2">Coopérative introuvable</h1>
          <p className="text-gray-500 mb-6">Cette page n&apos;existe pas ou a été déplacée.</p>
          <Link href="/" className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-800 transition">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Building2 size={48} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-3">{org.name}</h1>
          <p className="text-emerald-100 text-lg">Coopérative Dagoo</p>
          <div className="flex justify-center gap-8 mt-8">
            {org.phone && (
              <div className="flex items-center gap-2 text-white/80">
                <Phone size={18} /> {org.phone}
              </div>
            )}
            {org.email && (
              <div className="flex items-center gap-2 text-white/80">
                <Mail size={18} /> {org.email}
              </div>
            )}
          </div>
          <div className="mt-6">
            <span className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold">
              ★ {org.plan || 'Premium'}
            </span>
          </div>
        </div>
      </header>

      {/* Services */}
      <section className="py-20 max-w-5xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Nos services de transport</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: '🛵', title: 'Transport rapide', desc: 'Courses urbaines et interurbaines avec des chauffeurs qualifiés' },
            { icon: '🔧', title: 'Véhicules entretenus', desc: 'Parc régulièrement vérifié pour votre sécurité' },
            { icon: '👨‍✈️', title: 'Chauffeurs qualifiés', desc: 'Professionnels expérimentés et courtois' },
            { icon: '📍', title: 'Suivi en temps réel', desc: 'Localisation GPS de votre course' },
            { icon: '💳', title: 'Paiement sécurisé', desc: 'Multiples options de paiement disponibles' },
            { icon: '📞', title: 'Support 24/7', desc: 'Assistance téléphonique à tout moment' },
          ].map(s => (
            <div key={s.title} className="bg-gray-50 rounded-2xl p-6 text-center hover:shadow-lg transition">
              <div className="text-4xl mb-3">{s.icon}</div>
              <h3 className="font-bold text-gray-800 mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Contactez-nous</h2>
          <div className="flex flex-col items-center gap-4 text-gray-600 mb-8">
            {org.email && <p className="flex items-center gap-2"><Mail size={18} /> {org.email}</p>}
            {org.phone && <p className="flex items-center gap-2"><Phone size={18} /> {org.phone}</p>}
          </div>
          <a
            href={`tel:${org.phone?.replace(/\s/g, '')}`}
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition"
          >
            <Phone size={20} /> Appeler maintenant
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Building2 size={16} />
          <span className="font-bold text-white">{org.name}</span>
        </div>
        <p>Propulsé par <Link href="/" className="text-secondary hover:underline">Dagoo Mobility</Link></p>
        <p className="mt-1">Chez les potes, ça roule.</p>
      </footer>
    </div>
  );
}
