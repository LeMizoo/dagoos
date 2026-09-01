'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import { Truck, Search } from 'lucide-react';

export default function InterurbainLivraisons() {
  const { organization } = useOrganization();
  const [livraisons, setLivraisons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!organization?.id) return;
    try {
      const res = await apiFetch('/livraisons?page=1&limit=100').then(r => r.ok ? r.json() : []);
      setLivraisons(Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [organization]);

  useEffect(() => { load(); }, [load]);

  const filtered = livraisons.filter(l =>
    (l.description || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.adresseDepart || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.adresseArrivee || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">📦 Livraisons</h1>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-3">Type</th><th className="px-4 py-3">Départ</th><th className="px-4 py-3">Arrivée</th><th className="px-4 py-3">Prix</th><th className="px-4 py-3">Statut</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center py-8">Chargement...</td></tr> :
             filtered.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucune livraison</td></tr> :
             filtered.map(l => (
              <tr key={l.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full bg-gray-100">{l.type}</span></td>
                <td className="px-4 py-3 text-gray-500">{l.adresseDepart || '-'}</td>
                <td className="px-4 py-3 text-gray-500">{l.adresseArrivee || '-'}</td>
                <td className="px-4 py-3 font-semibold text-emerald-600">{(l.prix || 0).toLocaleString()} Ar</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${l.statut === 'livré' || l.statut === 'livre' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{l.statut}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
