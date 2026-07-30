'use client';
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, CheckCircle } from 'lucide-react';

interface Org {
  id: string;
  name: string;
  slug: string;
  type: string;
  plan: string;
  phone?: string;
}

const gradients = [
  'from-blue-600 to-blue-800',
  'from-emerald-600 to-emerald-800',
  'from-purple-600 to-purple-800',
  'from-orange-600 to-orange-800',
  'from-cyan-600 to-cyan-800',
  'from-rose-600 to-rose-800',
  'from-amber-600 to-amber-800',
  'from-indigo-600 to-indigo-800',
];

export default function TrustSection() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/public/organizations')
      .then(r => r.json())
      .then(data => {
        setOrgs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Auto-rotation
  useEffect(() => {
    if (orgs.length === 0 || isPaused) return;
    intervalRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % orgs.length);
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [orgs, isPaused]);

  if (loading || orgs.length === 0) {
    return (
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-700 rounded w-32 mx-auto" />
            <div className="h-10 bg-gray-700 rounded w-96 mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  // Calculer les indices pour le cover flow (5 éléments visibles)
  const getVisibleOrgs = () => {
    const result = [];
    for (let i = -2; i <= 2; i++) {
      let index = (activeIndex + i + orgs.length) % orgs.length;
      result.push({ org: orgs[index], position: i });
    }
    return result;
  };

  const visibleOrgs = getVisibleOrgs();

  const getCardStyle = (position: number) => {
    const absPos = Math.abs(position);
    const isCenter = position === 0;
    
    return {
      transform: `
        translateX(${position * 60}px) 
        scale(${isCenter ? 1 : 1 - absPos * 0.15}) 
        rotateY(${position * 15}deg)
        translateZ(${isCenter ? 50 : -absPos * 50}px)
      `,
      zIndex: 5 - absPos,
      opacity: 1 - absPos * 0.2,
      filter: isCenter ? 'blur(0px)' : `blur(${absPos * 2}px)`,
    };
  };

  return (
    <section className="py-20 bg-gray-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="text-center">
          <span className="text-sm font-semibold text-gray-400 uppercase tracking-[0.2em]">Nos</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-2 mb-4">
            partenaires
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Des établissements d&apos;exception soigneusement choisis pour vous
          </p>
        </div>
      </div>

      {/* Cover Flow */}
      <div
        className="relative h-[350px] flex items-center justify-center perspective-1000"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Flèches */}
        <button
          onClick={() => setActiveIndex(prev => (prev - 1 + orgs.length) % orgs.length)}
          className="absolute left-4 md:left-10 z-30 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition border border-white/20 text-white"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={() => setActiveIndex(prev => (prev + 1) % orgs.length)}
          className="absolute right-4 md:right-10 z-30 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition border border-white/20 text-white"
        >
          <ChevronRight size={24} />
        </button>

        {/* Cartes */}
        <div className="relative flex items-center justify-center" style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}>
          {visibleOrgs.map(({ org, position }) => (
            <a
              key={org.id}
              href={`/${org.type === 'FLEET_MANAGER' ? 'fleet' : 'coop'}/${org.slug}`}
              className="absolute w-64 cursor-pointer transition-all duration-700 ease-out"
              style={{
                ...getCardStyle(position),
                transformStyle: 'preserve-3d',
              }}
            >
              <div className={`bg-gray-800 rounded-2xl p-6 text-center border border-gray-700 hover:border-gray-500 transition-colors ${
                position === 0 ? 'shadow-2xl shadow-primary/20' : ''
              }`}>
                {/* Icône */}
                <div className={`w-20 h-20 bg-gradient-to-br ${gradients[orgs.indexOf(org) % gradients.length]} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <span className="text-white font-bold text-2xl">
                    {org.name.charAt(0)}
                  </span>
                </div>

                {/* Nom */}
                <h4 className="font-bold text-white text-sm line-clamp-2 mb-2">
                  {org.name}
                </h4>

                {/* Type */}
                <p className="text-gray-400 text-xs capitalize mb-2">
                  {org.type === 'FLEET_MANAGER' ? 'Flotte' : 'Coopérative'}
                </p>

                {/* Badge */}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  org.plan === 'Premium'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  {org.plan === 'Premium' ? '★ Premium' : '✓ Standard'}
                </span>

                {/* Téléphone (visible uniquement sur la carte centrale) */}
                {org.phone && position === 0 && (
                  <p className="text-gray-500 text-xs mt-3">{org.phone}</p>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center gap-2 mt-8">
        {orgs.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeIndex
                ? 'bg-white w-8'
                : 'bg-gray-600 hover:bg-gray-500 w-2'
            }`}
          />
        ))}
      </div>

      {/* Compteur */}
      <div className="text-center mt-8">
        <p className="text-gray-500 text-sm">
          <span className="text-white font-bold text-lg">{orgs.length}</span> organisations partenaires
        </p>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </section>
  );
}
