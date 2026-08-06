'use client';
import { apiFetch } from "@/lib/api";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, TrendingDown, Wallet, Search, ArrowUpRight, ArrowDownRight,
  Truck, Building2, CreditCard, Receipt, ArrowRight, AlertCircle,
  Download, Filter
} from 'lucide-react';

interface Transaction {
  id: string;
  organization?: { id?: string; name?: string; type?: string };
  amount?: number;
  type?: string;
  description?: string;
  date?: string;
  driverName?: string;
  vehiclePlate?: string;
}

interface KPI {
  totalCA: number;
  totalCommissions: number;
  totalNet: number;
  totalDepenses: number;
}

export default function FinancesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'FLEET_MANAGER' | 'COOPERATIVE'>('all');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      setError('');
      const res = await apiFetch('/api/proxy/finances/transactions');
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError('Impossible de charger les transactions.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrer
  const filtered = transactions
    .filter(t => {
      const matchSearch = 
        (t.organization?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.driverName || '').toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'all' || t.organization?.type === typeFilter;
      return matchSearch && matchType;
    })
    .sort((a, b) => {
      const field = sortField;
      let valA: any = field === 'date' ? (a.date || '') : (a.amount || 0);
      let valB: any = field === 'date' ? (b.date || '') : (b.amount || 0);
      if (field === 'date') {
        valA = new Date(valA).getTime() || 0;
        valB = new Date(valB).getTime() || 0;
      }
      return sortDir === 'asc' ? valA - valB : valB - valA;
    });

  // KPIs par type
  const fleetTrans = filtered.filter(t => t.organization?.type === 'FLEET_MANAGER');
  const coopTrans = filtered.filter(t => t.organization?.type === 'COOPERATIVE');

  const calcKPI = (txs: Transaction[]): KPI => ({
    totalCA: txs.filter(t => (t.amount || 0) > 0).reduce((s, t) => s + (t.amount || 0), 0),
    totalCommissions: txs.filter(t => t.type === 'commission').reduce((s, t) => s + Math.abs(t.amount || 0), 0),
    totalNet: txs.filter(t => t.type === 'versement').reduce((s, t) => s + (t.amount || 0), 0),
    totalDepenses: txs.filter(t => (t.amount || 0) < 0).reduce((s, t) => s + Math.abs(t.amount || 0), 0),
  });

  const allKPI = calcKPI(filtered);
  const fleetKPI = calcKPI(fleetTrans);
  const coopKPI = calcKPI(coopTrans);

  return (
    <div>
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💰 Finances</h1>
          <p className="text-sm text-gray-500 mt-1">Vue agrégée de toutes les transactions</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/finances/paiements"
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm"
          >
            <CreditCard size={18} />
            Paiements
          </Link>
          <Link
            href="/dashboard/finances/abonnements"
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm"
          >
            <Receipt size={18} />
            Abonnements
          </Link>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
          <button onClick={fetchTransactions} className="ml-auto text-red-700 underline text-xs">Réessayer</button>
        </div>
      )}

      {/* KPIs globaux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={TrendingUp} label="Chiffre d'affaires" value={allKPI.totalCA} color="green" loading={loading} />
        <KpiCard icon={TrendingDown} label="Commissions" value={allKPI.totalCommissions} color="blue" loading={loading} />
        <KpiCard icon={Wallet} label="Net versé" value={allKPI.totalNet} color="purple" loading={loading} />
        <KpiCard icon={TrendingDown} label="Dépenses" value={allKPI.totalDepenses} color="red" loading={loading} />
      </div>

      {/* KPIs par type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-100">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800">Flottes</h2>
            <span className="text-xs text-gray-400 ml-auto">{fleetTrans.length} transactions</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MiniKpi label="CA" value={fleetKPI.totalCA} color="text-green-600" />
            <MiniKpi label="Commissions" value={fleetKPI.totalCommissions} color="text-blue-600" />
            <MiniKpi label="Net" value={fleetKPI.totalNet} color="text-purple-600" />
            <MiniKpi label="Dépenses" value={fleetKPI.totalDepenses} color="text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-emerald-100">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={18} className="text-emerald-600" />
            <h2 className="font-semibold text-gray-800">Coopératives</h2>
            <span className="text-xs text-gray-400 ml-auto">{coopTrans.length} transactions</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <MiniKpi label="CA" value={coopKPI.totalCA} color="text-green-600" />
            <MiniKpi label="Commissions" value={coopKPI.totalCommissions} color="text-emerald-600" />
            <MiniKpi label="Net" value={coopKPI.totalNet} color="text-purple-600" />
            <MiniKpi label="Dépenses" value={coopKPI.totalDepenses} color="text-red-600" />
          </div>
        </div>
      </div>

      {/* Filtres et tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'FLEET_MANAGER', 'COOPERATIVE'] as const).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                  typeFilter === t 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t === 'all' ? 'Tous' : t === 'FLEET_MANAGER' ? '🚛 Flottes' : '🏢 Coops'}
              </button>
            ))}
          </div>
          <div className="relative max-w-xs w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Organisation</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">
                  <button 
                    onClick={() => { setSortField('amount'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Montant {sortField === 'amount' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button 
                    onClick={() => { setSortField('date'); setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Date {sortField === 'date' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">
                  <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2" />
                  Chargement...
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">
                  {search || typeFilter !== 'all' ? 'Aucun résultat avec ces filtres.' : 'Aucune transaction pour le moment.'}
                </td></tr>
              ) : (
                filtered.map(t => {
                  const isPositive = (t.amount || 0) >= 0;
                  return (
                    <tr key={t.id} className="border-t hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {t.organization?.type === 'FLEET_MANAGER' 
                            ? <Truck size={14} className="text-blue-500" />
                            : <Building2 size={14} className="text-emerald-500" />
                          }
                          <span className="font-medium text-gray-800">{t.organization?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          t.organization?.type === 'FLEET_MANAGER' 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {t.organization?.type === 'FLEET_MANAGER' ? 'Flotte' : 'Coop'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">
                        {t.description || '-'}
                      </td>
                      <td className={`px-4 py-3 font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="flex items-center gap-1">
                          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {isPositive ? '+' : '-'}{Math.abs(t.amount || 0).toLocaleString()} Ar
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {t.date ? new Date(t.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Composant KPI
function KpiCard({ icon: Icon, label, value, color, loading }: { 
  icon: any; label: string; value: number; color: string; loading: boolean 
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
  };
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.blue}`}>
          <Icon size={20} />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-800">
        {loading ? '-' : `${value.toLocaleString()} Ar`}
      </div>
    </div>
  );
}

function MiniKpi({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-sm font-semibold ${color}`}>{value.toLocaleString()} Ar</div>
    </div>
  );
}
