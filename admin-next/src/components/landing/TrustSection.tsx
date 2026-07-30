'use client';
import { useState, useEffect } from 'react';
import { Building2, Phone, Globe, X, MapPin, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Org {
  id: string;
  name: string;
  slug: string;
  type: string;
  plan: string;
  phone?: string;
}

export default function TrustSection() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);

  useEffect(() => {
    fetch('/api/public/organizations')
      .then(r => r.json())
      .then(data => setOrgs(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-100 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (orgs.length === 0) return null;

  const premium = orgs.filter(o => o.plan === 'Premium');
  const standard = orgs.filter(o => o.plan === 'Standard');

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Décorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-50 rounded-full blur-3xl opacity-50 translate-x-1/2 translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* En-tête */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 bg-secondary/10 text-primary text-xs font-semibold px-4 py-2 rounded-full uppercase tracking-wider mb-4">
            <Building2 size={14} /> Confiance
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ils nous font <span className="text-secondary">confiance</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Des coopératives et flottes qui utilisent Dagoo au quotidien pour gérer leur mobilité
          </p>
        </div>

        {/* Section Premium */}
        {premium.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                <span className="text-yellow-900 text-sm font-bold">★</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Premium</h3>
              <span className="text-sm text-gray-400">({premium.length})</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {premium.map(org => (
                <button
                  key={org.id}
                  onClick={() => setSelectedOrg(org)}
                  className="group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-yellow-300 hover:shadow-xl transition-all duration-300 text-left hover:-translate-y-1"
                >
                  {/* Badge Premium */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-[10px] px-2 py-1 rounded-full font-bold">
                      ★ PREMIUM
                    </span>
                  </div>

                  {/* Icône */}
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <Building2 size={24} className="text-yellow-700" />
                  </div>

                  {/* Nom */}
                  <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2 group-hover:text-yellow-700 transition">
                    {org.name}
                  </h4>

                  {/* Type */}
                  <span className="text-xs text-gray-400 capitalize">
                    {org.type === 'FLEET_MANAGER' ? '🚛 Flotte' : '🏢 Coopérative'}
                  </span>

                  {/* Téléphone */}
                  {org.phone && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                      <Phone size={10} /> {org.phone.substring(0, 25)}
                    </div>
                  )}

                  {/* Voir la page */}
                  <div className="mt-3 flex items-center gap-1 text-xs text-yellow-600 font-medium opacity-0 group-hover:opacity-100 transition">
                    Voir la page <ArrowRight size={10} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section Standard */}
        {standard.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Standard</h3>
              <span className="text-sm text-gray-400">({standard.length})</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {standard.map(org => (
                <button
                  key={org.id}
                  onClick={() => setSelectedOrg(org)}
                  className="group relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-green-300 hover:shadow-lg transition-all duration-300 text-left hover:-translate-y-1"
                >
                  <div className="absolute top-3 right-3">
                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-semibold">
                      STANDARD
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <Building2 size={24} className="text-green-700" />
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2 group-hover:text-green-700 transition">
                    {org.name}
                  </h4>
                  <span className="text-xs text-gray-400 capitalize">
                    {org.type === 'FLEET_MANAGER' ? '🚛 Flotte' : '🏢 Coopérative'}
                  </span>
                  {org.phone && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                      <Phone size={10} /> {org.phone.substring(0, 25)}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-1 text-xs text-green-600 font-medium opacity-0 group-hover:opacity-100 transition">
                    Voir la page <ArrowRight size={10} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Compteur */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-6 py-3">
            <span className="text-2xl font-bold text-primary">{orgs.length}</span>
            <span className="text-gray-500 text-sm">organisations nous font confiance</span>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-800 transition"
          >
            Rejoignez-les <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* MODAL - Détail organisation */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrg(null)} />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl animate-in zoom-in-95">
            <button
              onClick={() => setSelectedOrg(null)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-xl transition"
            >
              <X size={20} className="text-gray-400" />
            </button>

            <div className="text-center mb-6">
              <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
                selectedOrg.plan === 'Premium'
                  ? 'bg-gradient-to-br from-yellow-100 to-amber-200'
                  : 'bg-gradient-to-br from-green-100 to-emerald-200'
              }`}>
                <Building2 size={40} className={selectedOrg.plan === 'Premium' ? 'text-yellow-700' : 'text-green-700'} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{selectedOrg.name}</h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedOrg.plan === 'Premium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {selectedOrg.plan}
                </span>
                <span className="text-sm text-gray-400 capitalize">
                  {selectedOrg.type === 'FLEET_MANAGER' ? 'Flotte' : 'Coopérative'}
                </span>
              </div>
            </div>

            {selectedOrg.phone && (
              <div className="flex items-center justify-center gap-2 text-gray-500 mb-6">
                <Phone size={16} /> {selectedOrg.phone}
              </div>
            )}

            <div className="space-y-3">
              <a
                href={`/${selectedOrg.type === 'FLEET_MANAGER' ? 'fleet' : 'coop'}/${selectedOrg.slug}`}
                className="flex items-center justify-center gap-2 w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition"
              >
                <Globe size={16} /> Voir la page complète
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
