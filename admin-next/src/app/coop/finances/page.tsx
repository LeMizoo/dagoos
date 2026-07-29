'use client';
import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export default function CoopFinancesPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/proxy/finances/transactions')
      .then(r => r.json()).then(d => setTransactions(Array.isArray(d) ? d : []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const revenus = transactions.filter((t: any) => (t.amount ?? 0) >= 0).reduce((s: number, t: any) => s + (t.amount ?? 0), 0);
  const depenses = transactions.filter((t: any) => (t.amount ?? 0) < 0).reduce((s: number, t: any) => s + Math.abs(t.amount ?? 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">💰 Finances</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><TrendingUp size={20} className="text-green-600" /></div><span className="text-sm text-gray-500">Revenus</span></div><div className="text-2xl font-bold text-green-600">{loading ? '-' : `${revenus.toLocaleString()} Ar`}</div></div>
        <div className="bg-white rounded-xl p-5 shadow-sm border"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><TrendingDown size={20} className="text-red-600" /></div><span className="text-sm text-gray-500">Dépenses</span></div><div className="text-2xl font-bold text-red-600">{loading ? '-' : `${depenses.toLocaleString()} Ar`}</div></div>
        <div className="bg-white rounded-xl p-5 shadow-sm border"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center"><Wallet size={20} className="text-emerald-600" /></div><span className="text-sm text-gray-500">Solde</span></div><div className="text-2xl font-bold text-emerald-600">{loading ? '-' : `${(revenus - depenses).toLocaleString()} Ar`}</div></div>
      </div>
      <div className="bg-white rounded-xl p-12 shadow-sm border text-center text-gray-400">Transactions détaillées bientôt disponibles</div>
    </div>
  );
}
