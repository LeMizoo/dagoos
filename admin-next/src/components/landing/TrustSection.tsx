'use client';
import { useState, useEffect, useRef } from 'react';
import { Building2, Phone, Star, CheckCircle } from 'lucide-react';
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
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/public/organizations')
      .then(r => r.json())
      .then(data => setOrgs(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Défilement automatique
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || orgs.length === 0 || isPaused) return;

    let animationId: number;
    let scrollPos = 0;
    const speed = 0.5; // pixels par frame

    function animate() {
      if (!container) return;
      scrollPos += speed;
      
      // Reset quand on atteint la moitié (les éléments sont dupliqués)
      if (scrollPos >= container.scrollWidth / 2) {
        scrollPos = 0;
      }
      
      container.scrollLeft = scrollPos;
      animationId = requestAnimationFrame(animate);
    }

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [orgs, isPaused]);

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
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

  // Dupliquer pour l'effet infini
  const displayOrgs = [...orgs, ...orgs];

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* En-tête */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 bg-secondary/10 text-primary text-xs font-semibold px-4 py-2 rounded-full uppercase tracking-wider mb-4">
            <Building2 size={14} /> Confiance
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ils nous font <span className="text-secondary">confiance</span>
          </h2>
          <p className="text-gray-500 text-lg">
            {orgs.length} organisations utilisent Dagoo au quotidien
          </p>
        </div>
      </div>

      {/* Ticker */}
      <div
        className="relative group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Dégradés sur les bords */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-gray-50 z-10 pointer-events-none" />

        {/* Piste de défilement */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-hidden py-4 px-4"
          style={{ scrollBehavior: 'auto' }}
        >
          {displayOrgs.map((org, index) => (
            <Link
              key={`${org.id}-${index}`}
              href={`/${org.type === 'FLEET_MANAGER' ? 'fleet' : 'coop'}/${org.slug}`}
              className="flex-shrink-0 w-64 bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg hover:border-secondary/30 transition-all duration-300 hover:-translate-y-1 group/card"
            >
              {/* Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  org.plan === 'Premium'
                    ? 'bg-gradient-to-br from-yellow-100 to-amber-100'
                    : 'bg-gradient-to-br from-green-100 to-emerald-100'
                }`}>
                  <Building2 size={20} className={org.plan === 'Premium' ? 'text-yellow-700' : 'text-green-700'} />
                </div>
                {org.plan === 'Premium' ? (
                  <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Star size={8} /> PREMIUM
                  </span>
                ) : (
                  <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <CheckCircle size={8} /> STANDARD
                  </span>
                )}
              </div>

              {/* Nom */}
              <h4 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2 group-hover/card:text-primary transition">
                {org.name}
              </h4>

              {/* Type */}
              <span className="text-xs text-gray-400 capitalize">
                {org.type === 'FLEET_MANAGER' ? '🚛 Flotte' : '🏢 Coopérative'}
              </span>

              {/* Téléphone */}
              {org.phone && (
                <div className="flex items-center gap-1 mt-2 text-[11px] text-gray-400 truncate">
                  <Phone size={10} /> {org.phone}
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Indicateur de pause */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition">
          ⏸️ Défilement en pause
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-8">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-800 transition"
        >
          Rejoignez-les →
        </Link>
      </div>
    </section>
  );
}
