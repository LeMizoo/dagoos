'use client';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Car, Receipt } from 'lucide-react';

export default function FleetFinancesPage() {
  const [summary, setSummary] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [versements, setVersements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [summaryRes, coursesRes, versementsRes] = await Promise.all([
        apiFetch('/finances/stats/summary').then(r => r.ok ? r.json() : null),
        apiFetch('/finances/courses').then(r => r.ok ? r.json() : []),
        apiFetch('/finances/versements').then(r => r.ok ? r.json() : []),
      ]);
      setSummary(summaryRes);
      setCourses(Array.isArray(coursesRes) ? coursesRes : []);
      setVersements(Array.isArray(versementsRes) ? versementsRes : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const caJour = summary?.today?.ca || 0;
  const caSemaine = summary?.week?.ca || 0;
  const coursesJour = summary?.today?.count || 0;
  const commissionJour = summary?.today?.com || 0;

  const totalVersements = versements.reduce((sum: number, v: any) => sum + Number(v.amount || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">💰 Finances</h1>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPI icon={DollarSign} label="CA Aujourd'hui" value={`${caJour.toLocaleString()} Ar`} color="blue" />
            <KPI icon={TrendingUp} label="CA 7 jours" value={`${caSemaine.toLocaleString()} Ar`} color="green" />
            <KPI icon={Car} label="Courses aujourd'hui" value={coursesJour} color="yellow" />
            <KPI icon={Receipt} label="Total versements" value={`${totalVersements.toLocaleString()} Ar`} color="purple" />
          </div>

          {/* Dernières courses */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden mb-6">
            <div className="p-4 border-b">
              <h3 className="font-semibold">📋 Dernières courses</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Chauffeur</th>
                    <th className="px-4 py-3">Véhicule</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">Aucune course</td></tr>
                  ) : (
                    courses.slice(0, 10).map((c: any) => (
                      <tr key={c.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{c.driver?.user?.name || c.driver?.driverCode || '-'}</td>
                        <td className="px-4 py-3 text-gray-500">{c.vehicle?.plate || '-'}</td>
                        <td className="px-4 py-3 text-gray-500">{c.date ? new Date(c.date).toLocaleDateString('fr-FR') : '-'}</td>
                        <td className="px-4 py-3 font-semibold">{Number(c.price || 0).toLocaleString()} Ar</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Versements récents */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold">💸 Derniers versements</h3>
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
                    versements.slice(0, 10).map((v: any) => (
                      <tr key={v.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{v.driver?.driverCode || v.driverId || '-'}</td>
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

function KPI({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
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
