'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import { DollarSign, TrendingUp, TrendingDown, Car, Receipt, Search, Wallet } from 'lucide-react';

interface Course {
  id: string;
  date: string;
  driver?: { name?: string; driverCode?: string; user?: { name?: string } };
  vehicle?: { plate?: string; model?: string };
  price?: number;
  commission?: number;
  distanceKm?: number;
}

interface Versement {
  id: string;
  driverId: string;
  amount: number;
  periode: string;
  status: string;
  driver?: { driverCode?: string };
}

export default function FlotteFinances() {
  const { organization } = useOrganization();
  const [summary, setSummary] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [versements, setVersements] = useState<Versement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!organization?.id) return;
    
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
  }, [organization]);

  useEffect(() => {
    load();
  }, [load]);

  // Calculs pour KPIs
  const caJour = summary?.today?.ca || 0;
  const caSemaine = summary?.week?.ca || 0;
  const coursesJour = summary?.today?.count || 0;
  const totalVersements = versements.reduce((sum, v) => sum + Number(v.amount || 0), 0);
  const totalCA = courses.reduce((sum, c) => sum + (c.price || 0), 0);
  const totalCommission = courses.reduce((sum, c) => sum + (c.commission || 0), 0);
  const totalNet = totalCA - totalCommission;

  const filteredCourses = courses.filter(c =>
    ((c.driver?.name || c.driver?.user?.name || c.driver?.driverCode || '') + ' ' + (c.vehicle?.plate || ''))
      .toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">💰 Finances</h1>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : (
        <>
          {/* KPIs principaux */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KPI icon={DollarSign} label="CA Aujourd'hui" value={`${caJour.toLocaleString()} Ar`} color="blue" />
            <KPI icon={TrendingUp} label="CA 7 jours" value={`${caSemaine.toLocaleString()} Ar`} color="green" />
            <KPI icon={TrendingDown} label="Commissions totales" value={`${totalCommission.toLocaleString()} Ar`} color="red" />
            <KPI icon={Receipt} label="Total versements" value={`${totalVersements.toLocaleString()} Ar`} color="purple" />
          </div>

          {/* KPIs secondaires */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <KPI icon={Car} label="Courses aujourd'hui" value={String(coursesJour)} color="yellow" />
            <KPI icon={Wallet} label="CA total (courses)" value={`${totalCA.toLocaleString()} Ar`} color="emerald" />
            <KPI icon={TrendingUp} label="Net chauffeurs" value={`${totalNet.toLocaleString()} Ar`} color="cyan" />
          </div>

          {/* Tableau des transactions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden mb-6">
            <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">📋 Transactions (courses)</h3>
              <div className="relative w-full sm:max-w-xs">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Chauffeur</th>
                    <th className="px-4 py-3">Véhicule</th>
                    <th className="px-4 py-3">Km</th>
                    <th className="px-4 py-3">CA brut</th>
                    <th className="px-4 py-3">Net organisation</th>
                    <th className="px-4 py-3">Commission chauffeur</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucune transaction</td></tr>
                  ) : (
                    filteredCourses.slice(0, 50).map(c => (
                      <tr key={c.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 text-xs">{c.date ? new Date(c.date).toLocaleDateString('fr-FR') : '-'}</td>
                        <td className="px-4 py-3">{c.driver?.user?.name || c.driver?.name || c.driver?.driverCode || '-'}</td>
                        <td className="px-4 py-3">{c.vehicle?.plate || '-'}</td>
                        <td className="px-4 py-3">{c.distanceKm || 0} km</td>
                        <td className="px-4 py-3 text-green-600 font-medium">{(c.price || 0).toLocaleString()} Ar</td>
                        <td className="px-4 py-3 font-medium text-emerald-600">{(c.commission || 0).toLocaleString()} Ar</td>
                        <td className="px-4 py-3 text-red-600">{((c.price || 0) - (c.commission || 0)).toLocaleString()} Ar</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tableau des versements */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">💸 Derniers versements</h3>
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
                    versements.slice(0, 10).map(v => (
                      <tr key={v.id} className="border-t hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{v.driver?.driverCode || v.driverId || '-'}</td>
                        <td className="px-4 py-3 text-gray-500">{v.periode || '-'}</td>
                        <td className="px-4 py-3 font-semibold">{Number(v.amount || 0).toLocaleString()} Ar</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            v.status === 'en_attente' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                          }`}>
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
    red: 'bg-red-100 text-red-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    cyan: 'bg-cyan-100 text-cyan-600',
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
