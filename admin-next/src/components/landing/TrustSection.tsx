'use client';
import { useState, useEffect, useRef } from 'react';
import { Building2, Star, CheckCircle } from 'lucide-react';

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
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/public/organizations')
      .then(r => r.json())
      .then(data => setOrgs(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || orgs.length === 0 || isPaused) return;
    let animationId: number;
    let scrollPos = 0;
    const speed = 0.3;
    function animate() {
      if (!container) return;
      scrollPos += speed;
      if (scrollPos >= container.scrollWidth / 2) scrollPos = 0;
      container.scrollLeft = scrollPos;
      animationId = requestAnimationFrame(animate);
    }
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [orgs, isPaused]);

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-32 mx-auto" />
            <div className="h-10 bg-gray-200 rounded w-96 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-80 mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  if (orgs.length === 0) return null;

  const displayOrgs = [...orgs, ...orgs, ...orgs];

  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="text-center">
          <span className="text-sm font-semibold text-gray-400 uppercase tracking-[0.2em]">Nos</span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-4">
            partenaires
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Des établissements d&apos;exception soigneusement choisis pour vous
          </p>
        </div>
      </div>

      {/* Slider */}
      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Dégradés de bord */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-r from-transparent to-white z-10 pointer-events-none" />

        {/* Piste */}
        <div
          ref={scrollRef}
          className="flex gap-0 overflow-x-hidden"
        >
          {displayOrgs.map((org, index) => (
            <a
              key={`${org.id}-${index}`}
              href={`/${org.type === 'FLEET_MANAGER' ? 'fleet' : 'coop'}/${org.slug}`}
              className="flex-shrink-0 w-64 mx-3 group cursor-pointer"
            >
              {/* Carte */}
              <div className="bg-gray-50 rounded-2xl p-6 h-48 flex flex-col items-center justify-center text-center hover:bg-gray-100 transition-all duration-500 hover:scale-105 hover:shadow-xl">
                {/* Icône */}
                <div className={`w-16 h-16 bg-gradient-to-br ${gradients[index % gradients.length]} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                  <span className="text-white font-bold text-xl">
                    {org.name.charAt(0)}
                  </span>
                </div>
                
                {/* Nom */}
                <h4 className="font-bold text-gray-800 text-sm line-clamp-2 mb-1">
                  {org.name}
                </h4>
                
                {/* Badge plan */}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  org.plan === 'Premium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {org.plan}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Compteur */}
      <div className="text-center mt-12">
        <p className="text-gray-400 text-sm">
          <span className="text-primary font-bold text-lg">{orgs.length}</span> organisations partenaires
        </p>
      </div>
    </section>
  );
}
