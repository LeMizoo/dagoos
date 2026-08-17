'use client';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { FileCheck, Plus, Building2, Calendar, DollarSign } from 'lucide-react';

export default function CoopContratsPage() {
  const [contrats, setContrats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const r = await apiFetch('/contrats');
      if (r.ok) setContrats(await r.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">📝 Contrats</h1>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition text-sm">
          <Plus size={16} /> Nouveau contrat
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Chargement...</div>
      ) : contrats.length === 0 ? (
        <div className="text-center py-8 text-gray-400">Aucun contrat</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contrats.map((c: any) => (
            <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <FileCheck size={20} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">{c.societe?.activite || c.client || 'Contrat'}</h3>
                    <p className="text-xs text-gray-500">{c.statut || 'actif'}</p>
                  </div>
                </div>
                <span className="text-emerald-600 font-bold">{(Number(c.montant) || 0).toLocaleString()} Ar</span>
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {c.dateDebut ? new Date(c.dateDebut).toLocaleDateString('fr-FR') : '-'}
                </span>
                <span>→</span>
                <span>{c.dateFin ? new Date(c.dateFin).toLocaleDateString('fr-FR') : '-'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
