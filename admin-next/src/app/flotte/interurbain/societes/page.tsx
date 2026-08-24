'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import { Building2, Search, Plus } from 'lucide-react';

export default function InterurbainSocietes() {
  const { organization } = useOrganization();
  const [societes, setSocietes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!organization?.id) return;
    try {
      const res = await apiFetch('/societes').then(r => r.ok ? r.json() : []);
      const all = Array.isArray(res) ? res : [];
      setSocietes(all.filter((s: any) => s.organizationId === organization.id));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [organization]);

  useEffect(() => { load(); }, [load]);

  const filtered = societes.filter(s =>
    (s.activite || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.adresse || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🏢 Sociétés</h1>
          <p className="text-sm text-gray-500">{filtered.length} sociétés</p>
        </div>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 text-sm">
          <Plus size={16} /> Nouvelle société
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <div className="col-span-full text-center py-8">Chargement...</div> :
         filtered.length === 0 ? <div className="col-span-full text-center py-8 text-gray-400">Aucune société</div> :
         filtered.map(s => (
          <div key={s.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Building2 size={22} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold">{s.activite}</h3>
                <p className="text-xs text-gray-500">{s.adresse || 'N/A'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
