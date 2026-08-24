'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import { FileCheck, Search } from 'lucide-react';

export default function InterurbainContrats() {
  const { organization } = useOrganization();
  const [contrats, setContrats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!organization?.id) return;
    try {
      const res = await apiFetch('/contrats').then(r => r.ok ? r.json() : []);
      setContrats(Array.isArray(res) ? res : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [organization]);

  useEffect(() => { load(); }, [load]);

  const filtered = contrats.filter(c =>
    (c.client || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">📄 Contrats</h1>
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr><th className="px-4 py-3">Client</th><th className="px-4 py-3">Début</th><th className="px-4 py-3">Fin</th><th className="px-4 py-3">Montant</th><th className="px-4 py-3">Statut</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center py-8">Chargement...</td></tr> :
             filtered.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucun contrat</td></tr> :
             filtered.map(c => (
              <tr key={c.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.client}</td>
                <td className="px-4 py-3 text-gray-500">{c.dateDebut}</td>
                <td className="px-4 py-3 text-gray-500">{c.dateFin}</td>
                <td className="px-4 py-3 font-semibold text-emerald-600">{(c.montant || 0).toLocaleString()} Ar</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${c.statut === 'actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{c.statut}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
