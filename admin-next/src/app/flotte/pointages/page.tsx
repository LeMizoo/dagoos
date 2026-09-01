'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';

export default function FlottePointages() {
  const { organization } = useOrganization();
  const [pointages, setPointages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [dateFin, setDateFin] = useState(new Date().toISOString().split('T')[0]);
  const [searchDriver, setSearchDriver] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!organization?.id) return;
    loadPointages();
  }, [organization, dateDebut, dateFin, page, pageSize]);

  async function loadPointages() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        organizationId: organization?.id || '',
        dateDebut,
        dateFin,
        page: String(page),
        pageSize: String(pageSize),
      });
      const res = await apiFetch(`/drivers/pointages?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPointages(Array.isArray(data.pointages) ? data.pointages : []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 0);
      }
    } catch (e) {
      console.error('Erreur pointages:', e);
    } finally {
      setLoading(false);
    }
  }

  const pointagesFiltres = pointages;

  const pointagesPage = pointagesFiltres;

  const statutLabels: Record<string, string> = {
    'PRESENT': '🟢 Présent',
    'PAUSE': '🟠 En pause',
    'PARTI': '🔴 Parti',
  };

  const typeLabels: Record<string, string> = {
    'arrivee': 'Début',
    'pause': 'Pause',
    'reprise': 'Reprise',
    'depart': 'Fin',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">🕐 Pointages</h1>
      <p className="text-sm text-gray-500 mb-6">Suivi des présences chauffeurs</p>

      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Du</label>
          <input
            type="date"
            value={dateDebut}
            onChange={e => setDateDebut(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Au</label>
          <input
            type="date"
            value={dateFin}
            onChange={e => setDateFin(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">Chauffeur</label>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchDriver}
            onChange={e => { setSearchDriver(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : pointagesFiltres.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Aucun pointage pour cette date</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 text-left">
                <th className="px-4 py-3">Chauffeur</th>
                <th className="px-4 py-3">Véhicule</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Heure</th>
              </tr>
            </thead>
            <tbody>
              {pointagesPage.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{p.driver?.user?.name || p.driver?.driverCode}</td>
                  <td className="px-4 py-3">{p.driver?.vehicle?.plate || '—'}</td>
                  <td className="px-4 py-3">{typeLabels[p.type] || p.type}</td>
                  <td className="px-4 py-3">{statutLabels[p.statut] || p.statut}</td>
                  <td className="px-4 py-3">{new Date(p.heure).toLocaleTimeString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-500">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg text-sm disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
