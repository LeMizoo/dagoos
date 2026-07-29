'use client';
import { useState, useEffect } from 'react';
import { Search, Download, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Paiement {
  id: string;
  organization?: { name?: string };
  amount?: number;
  method?: string;
  status?: string;
  date?: string;
  createdAt?: string;
}

const statusConfig: Record<string, { icon: any; color: string }> = {
  payé: { icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  paye: { icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  completed: { icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  en_attente: { icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-700' },
  gratuit: { icon: CheckCircle, color: 'bg-blue-100 text-blue-700' },
  free: { icon: CheckCircle, color: 'bg-blue-100 text-blue-700' },
  échu: { icon: XCircle, color: 'bg-red-100 text-red-700' },
  overdue: { icon: XCircle, color: 'bg-red-100 text-red-700' },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Paiement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('tous');

  useEffect(() => { fetchPayments(); }, []);

  async function fetchPayments() {
    try {
      setError('');
      const res = await fetch('/api/proxy/finances/versements');
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError('Impossible de charger les paiements.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filters = ['tous', 'payé', 'en_attente', 'échu', 'gratuit'];

  const filtered = payments.filter(p => {
    const matchSearch = (p.organization?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'tous' || (p.status || '').toLowerCase() === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">💳 Paiements</h1>
        <button className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-800 transition text-sm">
          <Download size={16} /> Exporter
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3">
          <div className="flex gap-2 flex-wrap">
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${filter === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="relative max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Rechercher..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Organisation</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Méthode</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">⏳ Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucun paiement</td></tr>
              ) : (
                filtered.map(p => {
                  const status = statusConfig[p.status || 'en_attente'] || statusConfig.en_attente;
                  const StatusIcon = status.icon;
                  const date = p.date || p.createdAt;
                  return (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{p.organization?.name || '-'}</td>
                      <td className="px-4 py-3 font-medium">{p.amount ? `${p.amount.toLocaleString()} Ar` : '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{p.method || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 w-fit ${status.color}`}>
                          <StatusIcon size={12} /> {p.status || 'en_attente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{date ? new Date(date).toLocaleDateString('fr-FR') : '-'}</td>
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
