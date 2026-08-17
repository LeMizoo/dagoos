'use client';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Receipt, CheckCircle, Clock } from 'lucide-react';

export default function FleetVersementsPage() {
  const [versements, setVersements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const r = await apiFetch('/finances/versements');
      if (r.ok) setVersements(await r.json());
      else setError('Erreur chargement');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const total = versements.reduce((sum: number, v: any) => sum + Number(v.amount || 0), 0);
  const enAttente = versements.filter((v: any) => v.status === 'en_attente').length;
  const confirmees = versements.filter((v: any) => v.status !== 'en_attente').length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">💸 Versements</h1>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Receipt size={20} className="text-blue-600" /></div>
                <span className="text-sm text-gray-500">Total versé</span>
              </div>
              <div className="text-2xl font-bold text-gray-800 dark:text-white">{total.toLocaleString()} Ar</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center"><Clock size={20} className="text-yellow-600" /></div>
                <span className="text-sm text-gray-500">En attente</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">{enAttente}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><CheckCircle size={20} className="text-green-600" /></div>
                <span className="text-sm text-gray-500">Confirmés</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{confirmees}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold">📋 Historique des versements</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Chauffeur</th>
                    <th className="px-4 py-3">Période</th>
                    <th className="px-4 py-3">Montant</th>
                    <th className="px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {versements.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">Aucun versement</td></tr>
                  ) : (
                    versements.map((v: any) => (
                      <tr key={v.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{v.driver?.driverCode || '-'}</td>
                        <td className="px-4 py-3 text-gray-500">{v.periode || '-'}</td>
                        <td className="px-4 py-3 font-semibold">{Number(v.amount || 0).toLocaleString()} Ar</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${v.status === 'en_attente' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            {v.status || '-'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
