'use client';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { FileText, Download, TrendingUp } from 'lucide-react';

export default function FleetRapportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/finances/stats/summary')
      .then(r => r.ok ? r.json() : null)
      .then(d => setSummary(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">📊 Rapports</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Résumé */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-4">
              <FileText size={20} className="text-blue-600" />
              <h2 className="font-semibold">Résumé financier</h2>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">CA aujourd'hui</span><span className="font-semibold">{(summary?.today?.ca || 0).toLocaleString()} Ar</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Courses aujourd'hui</span><span className="font-semibold">{summary?.today?.count || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">CA 7 jours</span><span className="font-semibold">{(summary?.week?.ca || 0).toLocaleString()} Ar</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Courses 7 jours</span><span className="font-semibold">{summary?.week?.count || 0}</span></div>
            </div>
          </div>

          {/* Tendance */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp size={20} className="text-green-600" />
              <h2 className="font-semibold">Tendance</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Performance sur les 7 derniers jours</p>
            <div className="text-3xl font-bold text-green-600">
              {(summary?.week?.count || 0)} courses
            </div>
            <p className="text-xs text-gray-400 mt-2">Total CA : {(summary?.week?.ca || 0).toLocaleString()} Ar</p>
          </div>

          {/* Export */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Download size={20} className="text-blue-600" />
              <h2 className="font-semibold">Exporter</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Fonctionnalité d'export à venir.</p>
            <button disabled className="bg-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm cursor-not-allowed">
              Export CSV (bientôt)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
