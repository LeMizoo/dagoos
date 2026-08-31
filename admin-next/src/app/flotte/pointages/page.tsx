'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';

export default function FlottePointages() {
  const { organization } = useOrganization();
  const [pointages, setPointages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!organization?.id) return;
    loadPointages();
  }, [organization, date]);

  async function loadPointages() {
    setLoading(true);
    try {
      const res = await apiFetch(`/drivers/pointages?organizationId=${organization?.id || ''}&date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setPointages(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Erreur pointages:', e);
    } finally {
      setLoading(false);
    }
  }

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

      <div className="mb-4">
        <label className="text-sm text-gray-600 dark:text-gray-400">Date</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="ml-2 px-3 py-2 border rounded-lg text-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : pointages.length === 0 ? (
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
              {pointages.map(p => (
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
    </div>
  );
}
