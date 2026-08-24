'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import { FileText, Download, TrendingUp, DollarSign, Users } from 'lucide-react';

export default function FlotteRapports() {
  const { organization } = useOrganization();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      const res = await apiFetch('/finances/stats/summary');
      if (res.ok) setStats(await res.json());
      else setError('Erreur chargement');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    load();
  }, [load]);

  const rapports = [
    { title: 'Rapport financier', description: 'CA, commissions, versements', icon: DollarSign, color: 'emerald' },
    { title: 'Rapport des courses', description: 'Statistiques des courses', icon: TrendingUp, color: 'blue' },
    { title: 'Rapport des chauffeurs', description: 'Performance des chauffeurs', icon: Users, color: 'purple' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">📊 Rapports</h1>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      <div className="space-y-4">
        {rapports.map((r, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${r.color}-100`}>
                <r.icon size={20} className={`text-${r.color}-600`} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white">{r.title}</h3>
                <p className="text-sm text-gray-500">{r.description}</p>
              </div>
            </div>
            <button className="flex items-center gap-2 text-sm text-emerald-600 hover:underline">
              <Download size={20} className="text-emerald-600" />
              Exporter
            </button>
          </div>
        ))}
      </div>

      {stats && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">📈 Résumé rapide</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">CA aujourd'hui</p>
              <p className="text-xl font-bold text-emerald-600">{stats.today?.ca?.toLocaleString() || 0} Ar</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Courses aujourd'hui</p>
              <p className="text-xl font-bold">{stats.today?.count || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">CA 7 jours</p>
              <p className="text-xl font-bold text-emerald-600">{stats.week?.ca?.toLocaleString() || 0} Ar</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Commission aujourd'hui</p>
              <p className="text-xl font-bold text-blue-600">{stats.today?.com?.toLocaleString() || 0} Ar</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
