'use client';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Phone, Mail, Building2, Car } from 'lucide-react';

export default function CoopSocietesPage() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);
  async function load() {
    try {
      const r = await fetch('/api/proxy/societes');
      if (r.ok) setSocietes((await r.json()) || []);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  }

  const filtered = societes.filter(s => 
    s.activite?.toLowerCase().includes(search.toLowerCase()) ||
    s.adresse?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🏢 Sociétés</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} société{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition text-sm">
          <Plus size={16} /> Nouvelle société
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <div className="col-span-full text-center py-8 text-gray-400">Chargement...</div> :
         filtered.length === 0 ? <div className="col-span-full text-center py-8 text-gray-400">Aucune société</div> :
         filtered.map(s => (
          <div key={s.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <Building2 size={22} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white">{s.activite || 'Société'}</h3>
                <p className="text-xs text-gray-500">{s.adresse || 'Adresse N/A'}</p>
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              <span className="flex items-center gap-1 text-xs"><Car size={14} /> {s._count?.vehicles || 0} véhicules</span>
            </div>
            <Link href={`/coop/societes/${s.id}`} 
              className="block w-full text-center py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition">
              Voir les véhicules →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
