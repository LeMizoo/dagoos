'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import { Receipt, CheckCircle, Clock, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export default function FlotteVersements() {
  const { organization } = useOrganization();
  const [versements, setVersements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      const r = await apiFetch('/finances/versements');
      if (r.ok) {
        const data = await r.json();
        setVersements(Array.isArray(data) ? data : []);
      } else {
        setError('Erreur chargement');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    load();
  }, [load]);

  // Calculs
  const totalVerse = versements.reduce((sum, v) => sum + Number(v.amount || 0), 0);
  const totalNet = versements.reduce((sum, v) => sum + Number(v.net || v.amount || 0), 0);
  const totalCommission = versements.reduce((sum, v) => sum + Number(v.commission || 0), 0);
  const enAttente = versements.filter(v => v.status === 'en_attente').length;
  const confirmees = versements.filter(v => v.status !== 'en_attente').length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">💸 Versements</h1>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : (
        <>
          {/* KPIs principaux */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPI icon={Receipt} label="Total versé" value={`${totalVerse.toLocaleString()} Ar`} color="blue" />
            <KPI icon={Clock} label="En attente" value={String(enAttente)} color="yellow" />
            <KPI icon={CheckCircle} label="Confirmés" value={String(confirmees)} color="green" />
            <KPI icon={Wallet} label="Net à verser" value={`${totalNet.toLocaleString()} Ar`} color="emerald" />
          </div>

          {/* KPIs secondaires */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <KPI icon={TrendingUp} label="CA brut" value={`${totalVerse.toLocaleString()} Ar`} color="purple" />
            <KPI icon={TrendingDown} label="Commissions" value={`${totalCommission.toLocaleString()} Ar`} color="red" />
          </div>

          {/* Tableau des versements */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">📋 Historique des versements</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Chauffeur</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Période</th>
                    <th className="px-4 py-3">Montant</th>
                    <th className="px-4 py-3">Net organisation</th>
                    <th className="px-4 py-3">Net</th>
                    <th className="px-4 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {versements.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucun versement</td></tr>
                  ) : (
                    versements.map(v => (
                      <tr key={v.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">
                          {v.driver?.user?.name || v.driver?.name || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {v.driverCode || v.driver?.driverCode || '-'}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{v.periode || '-'}</td>
                        <td className="px-4 py-3 font-semibold text-green-600">
                          {Number(v.amount || v.caBrut || 0).toLocaleString()} Ar
                        </td>
                        <td className="px-4 py-3 text-red-600">
                          {Number(v.commission || 0).toLocaleString()} Ar
                        </td>
                        <td className="px-4 py-3 font-medium text-emerald-600">
                          {Number(v.net || v.amount || 0).toLocaleString()} Ar
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            v.status === 'en_attente' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {v.status || 'confirmé'}
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

function KPI({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div className="text-xl font-bold text-gray-800 dark:text-white">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
