'use client';
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
    fetch('/api/public/organizations')
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
    const translateX = position * 180; // espacement horizontal
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
    <section className="py-20 bg-gray-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="text-center">
          <span className="text-sm font-semibold text-gray-400 uppercase tracking-[0.2em]">Nos</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-2 mb-4">partenaires</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Des établissements d&apos;exception soigneusement choisis pour vous
          </p>
        </div>
      </div>

      {/* Carrousel 3D */}
      <div
        className="relative h-[420px] flex items-center justify-center overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{ perspective: '1200px' }}
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

        {/* Scène 3D */}
        <div
          className="relative flex items-center justify-center"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateY(0deg)',
            width: '800px',
            height: '350px',
          }}
        >
          {visibleOrgs.map(({ org, position }) => (
            <a
              key={org.id}
              href={`/${org.type === 'FLEET_MANAGER' ? 'fleet' : 'coop'}/${org.slug}`}
              className="absolute w-60 cursor-pointer transition-all duration-700 ease-out"
              style={{
                ...getTransform(position),
                transformStyle: 'preserve-3d',
                left: '50%',
                marginLeft: '-120px',
              }}
            >
              <div className={`bg-gray-800 rounded-2xl p-5 text-center border border-gray-700 hover:border-gray-500 transition-colors ${
                position === 0 ? 'shadow-2xl shadow-primary/20 ring-1 ring-primary/30' : ''
              }`}>
                {/* Icône */}
                <div className={`w-16 h-16 bg-gradient-to-br ${gradients[orgs.indexOf(org) % gradients.length]} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg`}>
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
      <div className="flex justify-center gap-2 mt-8">
        {orgs.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeIndex ? 'bg-white w-8' : 'bg-gray-600 hover:bg-gray-500 w-2'
            }`}
          />
        ))}
      </div>

      <div className="text-center mt-8">
        <p className="text-gray-500 text-sm">
          <span className="text-white font-bold text-lg">{orgs.length}</span> organisations partenaires
        </p>
      </div>
    </section>
  );
}
