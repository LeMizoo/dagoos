'use client';
import { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Globe } from 'lucide-react';
import Link from 'next/link';

interface Org {
  id: string;
  name: string;
  slug: string;
  type: string;
  plan: string;
  phone?: string;
  routes?: string;
}

export default function TrustSection() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/organizations')
      .then(r => r.json())
      .then(data => setOrgs(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-400">
          Chargement...
        </div>
      </section>
    );
  }

  if (orgs.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="text-secondary font-semibold text-sm uppercase tracking-wider">Confiance</span>
          <h2 className="text-3xl font-bold text-gray-800 mt-2">Ils nous font confiance</h2>
          <p className="text-gray-500 mt-2">Des coopératives et flottes qui utilisent Dagoo au quotidien</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {orgs.map(org => (
            <Link
              key={org.id}
              href={`/${org.type === 'FLEET_MANAGER' ? 'fleet' : 'coop'}/${org.slug}`}
              className="group bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg hover:border-secondary/30 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-secondary/20 to-yellow-100 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <Building2 size={20} className="text-primary" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm group-hover:text-primary transition truncate">
                {org.name}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  org.plan === 'Premium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                }`}>
                  {org.plan}
                </span>
                <span className="capitalize">{org.type === 'FLEET_MANAGER' ? 'Flotte' : 'Coop'}</span>
              </div>
              {org.phone && (
                <div className="flex items-center gap-1 mt-2 text-[11px] text-gray-400">
                  <Phone size={10} /> {org.phone.substring(0, 20)}
                </div>
              )}
              <div className="mt-3 flex items-center gap-1 text-[11px] text-secondary font-medium opacity-0 group-hover:opacity-100 transition">
                <Globe size={10} /> Voir la page
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-400">
            Rejoignez les {orgs.length} organisations qui nous font confiance
          </p>
          <Link href="/register" className="inline-block mt-3 text-primary font-semibold text-sm hover:underline">
            Créer votre compte gratuitement →
          </Link>
        </div>
      </div>
    </section>
  );
}
