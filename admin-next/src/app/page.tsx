import Link from 'next/link';
import { Rocket, ArrowDown, Building2, Truck, Smartphone, Users, Shield, Zap, Car, MapPin, Calendar, Search, Phone, CheckCircle } from 'lucide-react';
import HeroSlider from '@/components/landing/HeroSlider';
import HeroParticles from '@/components/landing/HeroParticles';
import PlansSection from '@/components/landing/PlansSection';
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
            <a href="https://dago-driver.pages.dev" target="_blank" rel="noopener noreferrer" className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition">
              🧑‍✈️ Espace Chauffeur
            </a>
          </div>
        </div>
      </section>

      {/* NOS PARTENAIRES */}
      <TrustSection />

      {/* DEMANDE DE TAXI */}
      <section className="py-12 bg-white">
        <div className="max-w-md mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-4">🚕 Demander un taxi</h2>
          <p className="text-center text-gray-500 text-sm mb-6">Remplissez le formulaire, une flotte vous contactera</p>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const form = e.target as any;
            // Envoyer à la première flotte disponible
            const res = await fetch('/api/public/actions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                organizationSlug: 'flotte-alasora',
                type: 'COURSE_REQUEST',
                clientNom: form.nom.value,
                clientTel: form.tel.value,
                details: {
                  depart: form.depart.value,
                  arrivee: form.arrivee.value,
                  typeVehicule: form.type.value,
                },
              }),
            });
            if (res.ok) {
              form.reset();
              alert('✅ Demande envoyée ! Une flotte vous contactera.');
            }
          }} className="space-y-3 bg-gray-50 p-6 rounded-xl border">
            <input name="nom" placeholder="Votre nom" className="w-full px-4 py-3 border rounded-lg text-sm" required />
            <input name="tel" type="tel" placeholder="Votre téléphone" className="w-full px-4 py-3 border rounded-lg text-sm" required />
            <input name="depart" placeholder="Adresse de départ" className="w-full px-4 py-3 border rounded-lg text-sm" required />
            <input name="arrivee" placeholder="Adresse d'arrivée" className="w-full px-4 py-3 border rounded-lg text-sm" required />
            <select name="type" className="w-full px-4 py-3 border rounded-lg text-sm">
              <option value="moto">🏍️ Taxi Moto</option>
              <option value="voiture">🚗 Taxi</option>
            </select>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
              Demander un taxi
            </button>
          </form>
        </div>
      </section>

      {/* SECTION RÉSERVATION */}
      <section id="reservation" className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">🚌 Départs disponibles</h2>
          <p className="text-center text-gray-500 mb-8">Choisissez une coopérative pour voir les départs et réserver</p>

          {coopsAvecDeparts.length === 0 ? (
            <p className="text-center text-gray-400">Aucun départ disponible pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coopsAvecDeparts.map((org: any) => (
                <Link
                  key={org.id}
                  href={`/coop/${org.slug}`}
                  className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-emerald-500 hover:shadow-xl transition group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Building2 size={24} className="text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 group-hover:text-emerald-600 transition">{org.name}</h3>
                      {org.phone && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={12} /> {org.phone}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {org.departs?.slice(0, 3).map((d: any) => (
                      <div key={d.id} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-semibold text-gray-800">
                          <MapPin size={14} className="inline mr-1" />
                          {d.pointDepart} → {d.destination}
                        </p>
                        {d.vehicle && (
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            🚐 <span className="font-semibold">{d.vehicle.model || 'Véhicule'}</span>
                            <span className="text-gray-400">•</span>
                            <span className="font-mono">{d.vehicle.plate}</span>
                            <span className="text-[10px] bg-green-100 text-green-700 rounded-full px-1.5 py-0.5 ml-auto">✓ Récent</span>
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                          <Calendar size={12} className="inline mr-1" />
                          {new Date(d.date).toLocaleDateString('fr-FR')} à {d.heure}
                          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 rounded-full px-2 py-0.5 ml-auto">
                            {getCountdown(d.date, d.heure)}
                          </span>
                        </p>
                        <p className="text-sm font-bold text-emerald-600 mt-1">{Number(d.prix).toLocaleString()} Ar</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Places : {d.placesTotal || 26} · Disponible(s) : {(d.placesTotal || 26) - (d.reservations?.length || 0)} · Réservée(s) : {d.reservations?.length || 0}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-4 bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition text-sm">
                    Réserver maintenant →
                  </button>
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-1 bg-yellow-400 rounded px-2 py-1">
                      <span className="font-bold text-black text-[10px]">MVola</span>
                      <span className="text-black font-extrabold text-[10px]">{org.phone || '034 00 000 00'}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-black rounded px-2 py-1">
                      <span className="font-bold text-orange-500 text-[10px]">Orange</span>
                      <span className="text-orange-400 font-extrabold text-[10px]">{org.phone || '032 00 000 00'}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-red-600 rounded px-2 py-1">
                      <span className="font-bold text-white text-[10px]">Airtel</span>
                      <span className="text-white font-extrabold text-[10px]">{org.phone || '033 00 000 00'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

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
          <a href="https://dago-driver.pages.dev" target="_blank" rel="noopener noreferrer" className="text-white hover:text-emerald-400 transition font-semibold">
            🧑‍✈️ Espace Chauffeur
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
