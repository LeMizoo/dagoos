'use client';
import { useState, useEffect, useRef } from 'react';
import { Building2, Phone, Globe, ChevronLeft, ChevronRight, Star, CheckCircle } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(orgs.length / itemsPerPage);

  useEffect(() => {
    fetch('/api/public/organizations')
      .then(r => r.json())
      .then(data => setOrgs(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Auto-rotation
  useEffect(() => {
    if (totalPages <= 1 || isPaused) return;
    
    intervalRef.current = setInterval(() => {
      setCurrentPage(prev => (prev + 1) % totalPages);
    }, 4000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [totalPages, isPaused]);

  const currentOrgs = orgs.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  if (orgs.length === 0) return null;

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Décorations d'arrière-plan */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-50 rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-emerald-50 rounded-full blur-3xl opacity-60" />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* En-tête */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-secondary/10 text-primary text-xs font-semibold px-4 py-2 rounded-full uppercase tracking-wider mb-4">
            <Building2 size={14} /> Confiance
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ils nous font <span className="text-secondary">confiance</span>
          </h2>
          <p className="text-gray-500 text-lg">
            Des coopératives et flottes qui utilisent Dagoo au quotidien
          </p>
        </div>

        {/* Carrousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Flèches de navigation */}
          {totalPages > 1 && (
            <>
              <button
                onClick={() => setCurrentPage(prev => (prev - 1 + totalPages) % totalPages)}
                className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition border border-gray-100"
              >
                <ChevronLeft size={20} className="text-gray-600" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => (prev + 1) % totalPages)}
                className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition border border-gray-100"
              >
                <ChevronRight size={20} className="text-gray-600" />
              </button>
            </>
          )}

          {/* Grille animée */}
          <div className="overflow-hidden">
            <div
              className="grid grid-cols-2 md:grid-cols-3 gap-4 transition-all duration-700 ease-in-out"
              key={currentPage}
              style={{
                animation: 'slideIn 0.5s ease-out',
              }}
            >
              {currentOrgs.map((org, index) => (
                <Link
                  key={org.id}
                  href={`/${org.type === 'FLEET_MANAGER' ? 'fleet' : 'coop'}/${org.slug}`}
                  className="group relative bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-secondary/30"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.5s ease-out both',
                  }}
                >
                  {/* Badge */}
                  <div className="absolute top-3 right-3">
                    {org.plan === 'Premium' ? (
                      <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-[10px] px-2 py-1 rounded-full font-bold flex items-center gap-1">
                        <Star size={8} /> PREMIUM
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                        <CheckCircle size={8} /> STANDARD
                      </span>
                    )}
                  </div>

                  {/* Icône */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition ${
                    org.plan === 'Premium'
                      ? 'bg-gradient-to-br from-yellow-100 to-amber-100'
                      : 'bg-gradient-to-br from-green-100 to-emerald-100'
                  }`}>
                    <Building2 size={20} className={org.plan === 'Premium' ? 'text-yellow-700' : 'text-green-700'} />
                  </div>

                  {/* Nom */}
                  <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2 group-hover:text-primary transition">
                    {org.name}
                  </h4>

                  {/* Type */}
                  <span className="text-xs text-gray-400 capitalize">
                    {org.type === 'FLEET_MANAGER' ? '🚛 Flotte' : '🏢 Coop'}
                  </span>

                  {/* Téléphone */}
                  {org.phone && (
                    <div className="flex items-center gap-1 mt-2 text-[11px] text-gray-400 truncate">
                      <Phone size={10} /> {org.phone}
                    </div>
                  )}

                  {/* Hover : Voir la page */}
                  <div className="mt-3 flex items-center gap-1 text-xs text-secondary font-medium opacity-0 group-hover:opacity-100 transition">
                    <Globe size={10} /> Voir la page
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Pagination dots */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentPage
                      ? 'bg-secondary w-8'
                      : 'bg-gray-300 hover:bg-gray-400 w-2'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Compteur */}
        <div className="text-center mt-10">
          <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-6 py-3">
            <span className="text-2xl font-bold text-primary">{orgs.length}</span>
            <span className="text-gray-500 text-sm">organisations nous font confiance</span>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-6">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-800 transition"
          >
            Rejoignez-les →
          </Link>
        </div>
      </div>

      {/* Styles d'animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  );
}
