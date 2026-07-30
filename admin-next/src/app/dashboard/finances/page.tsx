'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Transaction {
  id: string;
  organization?: { name?: string };
  amount?: number;
  type?: string;
  description?: string;
  date?: string;
}

export default function FinancesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchTransactions(); }, []);

  async function fetchTransactions() {
    try {
      setError('');
      const res = await fetch('/api/proxy/finances/transactions');
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError('Impossible de charger les transactions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const totalRevenus = transactions.filter(t => t.type === 'revenu' || (t.amount ?? 0) > 0).reduce((s, t) => s + (t.amount || 0), 0);
  const totalDepenses = transactions.filter(t => t.type === 'depense' || (t.amount ?? 0) < 0).reduce((s, t) => s + Math.abs(t.amount || 0), 0);
  const solde = totalRevenus - totalDepenses;

  const filtered = transactions.filter(t =>
    t.organization?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">💰 Finances</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Revenus totaux</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{loading ? '-' : `${totalRevenus.toLocaleString()} Ar`}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown size={20} className="text-red-600" />
            </div>
            <span className="text-sm text-gray-500">Dépenses totales</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{loading ? '-' : `${totalDepenses.toLocaleString()} Ar`}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wallet size={20} className="text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Solde net</span>
          </div>
          <div className={`text-2xl font-bold ${solde >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {loading ? '-' : `${solde.toLocaleString()} Ar`}
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">Transactions</h2>
          <div className="relative max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Rechercher..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Organisation</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">⏳ Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucune transaction</td></tr>
              ) : (
                filtered.map(t => {
                  const isPositive = (t.amount || 0) >= 0;
                  return (
                    <tr key={t.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{t.organization?.name || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{t.description || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 w-fit ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {isPositive ? 'revenu' : 'depense'}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : '-'}{Math.abs(t.amount || 0).toLocaleString()} Ar
                      </td>
                      <td className="px-4 py-3 text-gray-500">{t.date ? new Date(t.date).toLocaleDateString('fr-FR') : '-'}</td>
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
