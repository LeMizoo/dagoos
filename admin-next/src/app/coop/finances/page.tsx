'use client';
import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface Course {
  id: string; date: string;
  driver?: { name?: string; driverCode?: string };
  vehicle?: { plate?: string; model?: string };
  price?: number; commission?: number; distanceKm?: number;
}

export default function CoopFinancesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/proxy/finances/courses', { headers: { Authorization: 'Bearer ' + (localStorage.getItem('dagoos_token') || '') } })
      .then(r => r.json())
      .then(data => setCourses(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalCA = courses.reduce((s, c) => s + (c.price || 0), 0);
  const totalCommission = courses.reduce((s, c) => s + (c.commission || 0), 0);
  const totalNet = totalCA - totalCommission;

  const filtered = courses.filter(c =>
    (c.driver?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.vehicle?.plate || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">💰 Finances</h1>
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 text-sm">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><TrendingUp size={20} className="text-green-600" /></div><span className="text-sm text-gray-500">Chiffre d&apos;affaires</span></div><div className="text-2xl font-bold text-green-600">{loading ? '-' : totalCA.toLocaleString() + ' Ar'}</div></div>
        <div className="bg-white rounded-xl p-5 shadow-sm border"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><TrendingDown size={20} className="text-red-600" /></div><span className="text-sm text-gray-500">Commissions</span></div><div className="text-2xl font-bold text-red-600">{loading ? '-' : totalCommission.toLocaleString() + ' Ar'}</div></div>
        <div className="bg-white rounded-xl p-5 shadow-sm border"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center"><Wallet size={20} className="text-emerald-600" /></div><span className="text-sm text-gray-500">Net chauffeurs</span></div><div className="text-2xl font-bold text-emerald-600">{loading ? '-' : totalNet.toLocaleString() + ' Ar'}</div></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">📋 Transactions (courses)</h2>
          <div className="relative max-w-xs"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Chauffeur</th><th className="px-4 py-3">Véhicule</th><th className="px-4 py-3">Km</th><th className="px-4 py-3">CA brut</th><th className="px-4 py-3">Commission</th><th className="px-4 py-3">Net</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-8 text-gray-400">Chargement...</td></tr> :
               filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucune transaction</td></tr> :
               filtered.map(c => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs">{c.date ? new Date(c.date).toLocaleDateString('fr-FR') : '-'}</td>
                  <td className="px-4 py-3">{c.driver?.name || c.driver?.driverCode || '-'}</td>
                  <td className="px-4 py-3">{c.vehicle?.plate || '-'}</td>
                  <td className="px-4 py-3">{c.distanceKm || 0} km</td>
                  <td className="px-4 py-3 text-green-600 font-medium">{(c.price || 0).toLocaleString()} Ar</td>
                  <td className="px-4 py-3 text-red-600">{(c.commission || 0).toLocaleString()} Ar</td>
                  <td className="px-4 py-3 font-medium text-emerald-600">{((c.price || 0) - (c.commission || 0)).toLocaleString()} Ar</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
