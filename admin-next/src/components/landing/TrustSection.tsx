'use client';
import { apiFetch } from '@/lib/api';
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Org {
  id: string;
  name: string;
  slug: string;
  type: string;
  plan: string;
  phone?: string;
}

const gradients = [
  'from-blue-600 to-blue-800', 'from-emerald-600 to-emerald-800',
  'from-purple-600 to-purple-800', 'from-orange-600 to-orange-800',
  'from-cyan-600 to-cyan-800', 'from-rose-600 to-rose-800',
  'from-amber-600 to-amber-800', 'from-indigo-600 to-indigo-800',
];

export default function TrustSection() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    apiFetch('/public/organizations')
      .then(r => r.json())
      .then(data => { setOrgs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (orgs.length === 0 || isPaused) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % orgs.length);
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [orgs, isPaused]);

  if (loading || orgs.length === 0) return null;

  // Positions : -2, -1, 0 (centre), 1, 2
  const getVisibleOrgs = () => {
    const result = [];
    for (let i = -2; i <= 2; i++) {
      const index = (activeIndex + i + orgs.length) % orgs.length;
      result.push({ org: orgs[index], position: i });
    }
    return result;
  };

  const visibleOrgs = getVisibleOrgs();

  const getTransform = (position: number) => {
    const angle = position * 25; // degrés entre chaque carte
    const translateX = position * 140; // espacement horizontal
    const translateZ = -Math.abs(position) * 150; // profondeur
    const scale = position === 0 ? 1 : 0.75;
    const opacity = position === 0 ? 1 : 0.5;

    return {
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${-angle}deg) scale(${scale})`,
      zIndex: 5 - Math.abs(position),
      opacity,
      filter: position === 0 ? 'blur(0px)' : 'blur(1px)',
    };
  };

  return (
    <section className="py-6 bg-gray-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-4">
        <div className="text-center">
          <span className="text-sm font-semibold text-gray-400 uppercase tracking-[0.2em]">Nos</span>
          <h2 className="text-2xl md:text-3xl font-bold text-white mt-1 mb-2">partenaires</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Des établissements d&apos;exception soigneusement choisis pour vous
          </p>
        </div>
      </div>

      {/* Carrousel 3D */}
      <div
        className="relative h-[280px] flex items-center justify-center overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{ perspective: '1200px' }}
      >
        {/* Flèches */}
        <button
          type="button"
          aria-label="Partenaire précédent"
          onClick={() => setActiveIndex(prev => (prev - 1 + orgs.length) % orgs.length)}
          className="absolute left-4 md:left-10 z-30 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition border border-white/20 text-white"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          type="button"
          aria-label="Partenaire suivant"
          onClick={() => setActiveIndex(prev => (prev + 1) % orgs.length)}
          className="absolute right-4 md:right-10 z-30 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition border border-white/20 text-white"
        >
          <ChevronRight size={24} />
        </button>

        {/* Scène 3D */}
        <div
          className="relative flex items-center justify-center"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateY(0deg)',
            width: '800px',
            height: '220px',
          }}
        >
          {visibleOrgs.map(({ org, position }) => (
            <a
              key={org.id}
              href={`/${org.type === 'FLEET_MANAGER' ? 'fleet' : 'coop'}/${org.slug}`}
              className="absolute w-48 cursor-pointer transition-all duration-700 ease-out"
              style={{
                ...getTransform(position),
                transformStyle: 'preserve-3d',
                left: '50%',
                marginLeft: '-96px',
              }}
            >
              <div className={`relative bg-gray-800 rounded-2xl p-3 text-center border border-gray-700 hover:border-gray-500 transition-all duration-500 overflow-hidden group ${
                position === 0 ? 'shadow-2xl shadow-primary/20 ring-1 ring-primary/30' : ''
              }`}>
                {/* Motif unique par partenaire avec animation au survol */}
                <div className="absolute inset-0 opacity-15 pointer-events-none transition-all duration-700 group-hover:opacity-40 group-hover:scale-110">
                  {(() => {
                    const patterns = [
                      // Partenaire 1 : cercles concentriques
                      <div key="p1" className="absolute inset-0 flex items-center justify-center">
                        <div className="w-40 h-40 rounded-full border-4 border-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
                        <div className="absolute w-28 h-28 rounded-full border-4 border-blue-400 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
                        <div className="absolute w-16 h-16 rounded-full border-4 border-secondary animate-spin" style={{ animationDuration: '4s' }} />
                      </div>,
                      // Partenaire 2 : vagues
                      <div key="p2" className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-1/4 left-0 w-full h-2 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
                        <div className="absolute top-1/2 left-0 w-full h-2 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }} />
                        <div className="absolute top-3/4 left-0 w-full h-2 bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
                      </div>,
                      // Partenaire 3 : diagonales
                      <div key="p3" className="absolute inset-0">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-transparent rotate-12 animate-pulse" />
                        <div className="absolute top-1/3 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-transparent rotate-12 animate-pulse" style={{ animationDelay: '0.3s' }} />
                        <div className="absolute top-2/3 left-0 w-full h-1 bg-gradient-to-r from-secondary to-transparent rotate-12 animate-pulse" style={{ animationDelay: '0.6s' }} />
                      </div>,
                      // Partenaire 4 : points
                      <div key="p4" className="absolute inset-0 flex flex-wrap items-center justify-center gap-3">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" style={{ animationDelay: `${i * 0.3}s` }} />
                        ))}
                      </div>,
                      // Partenaire 5 : carrés rotatifs
                      <div key="p5" className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 border-4 border-blue-400 rotate-45 animate-spin" style={{ animationDuration: '5s' }} />
                        <div className="absolute w-14 h-14 border-4 border-emerald-400 rotate-45 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }} />
                      </div>,
                    ];
                    const idx = orgs.indexOf(org) % patterns.length;
                    return patterns[idx];
                  })()}
                </div>
                {/* Icône */}
                <div className={`w-12 h-12 bg-gradient-to-br ${gradients[orgs.indexOf(org) % gradients.length]} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                  <span className="text-white font-bold text-xl">{org.name.charAt(0)}</span>
                </div>

                {/* Nom */}
                <h4 className="font-bold text-white text-sm line-clamp-2 mb-1">{org.name}</h4>

                {/* Type */}
                <p className="text-gray-400 text-xs capitalize mb-2">
                  {org.type === 'FLEET_MANAGER' ? 'Flotte' : 'Coopérative'}
                </p>

                {/* Badge */}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  org.plan === 'Premium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                }`}>
                  {org.plan === 'Premium' ? '★ Premium' : '✓ Standard'}
                </span>

                {org.phone && position === 0 && (
                  <p className="text-gray-500 text-xs mt-2">{org.phone}</p>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-3">
        {orgs.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Afficher le partenaire ${i + 1}`}
            aria-pressed={i === activeIndex}
            onClick={() => setActiveIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeIndex ? 'bg-white w-8' : 'bg-gray-600 hover:bg-gray-500 w-2'
            }`}
          />
        ))}
      </div>

      <div className="text-center mt-3">
        <p className="text-gray-500 text-sm">
          <span className="text-white font-bold text-lg">{orgs.length}</span> organisations partenaires
        </p>
      </div>
    </section>
  );
}
