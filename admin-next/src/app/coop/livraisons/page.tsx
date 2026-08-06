'use client';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Search, Truck, MapPin, User, CheckCircle, Clock } from 'lucide-react';

export default function CoopLivraisonsPage() {
  const [livraisons, setLivraisons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/proxy/livraisons', { headers: { Authorization: 'Bearer ' + (localStorage.getItem('dagoos_token') || '') } }).then(r => r.json()).then(d => setLivraisons(Array.isArray(d) ? d : [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = livraisons.filter((l: any) => l.driver?.name?.toLowerCase().includes(search.toLowerCase()) || l.vehicle?.plate?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🚚 Livraisons</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Clock, label: 'En cours', color: 'bg-blue-100 text-blue-700', count: livraisons.filter((l: any) => l.status === 'en_cours').length },
          { icon: CheckCircle, label: 'Terminées', color: 'bg-emerald-100 text-emerald-700', count: livraisons.filter((l: any) => l.status === 'terminee').length },
          { icon: Truck, label: 'Total', color: 'bg-purple-100 text-purple-700', count: livraisons.length },
          { icon: MapPin, label: 'Distinctes', color: 'bg-orange-100 text-orange-700', count: new Set(livraisons.map((l: any) => l.arrival)).size },
        ].map(s => { const Icon = s.icon; return (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}><Icon size={18} /></div><div><div className="text-lg font-bold">{loading ? '-' : s.count}</div><div className="text-xs text-gray-500">{s.label}</div></div></div></div>
        );})}
      </div>
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b"><div className="relative max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-4 py-2 border rounded-lg w-full text-sm focus:ring-2 focus:ring-emerald-500" /></div></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="px-4 py-3">Chauffeur</th><th className="px-4 py-3">Véhicule</th><th className="px-4 py-3">Départ</th><th className="px-4 py-3">Arrivée</th><th className="px-4 py-3">Statut</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="text-center py-8 text-gray-400">⏳ Chargement...</td></tr> :
               filtered.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucune livraison</td></tr> :
               filtered.map((l: any) => (
                <tr key={l.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 flex items-center gap-1"><User size={14} className="text-gray-400" />{l.driver?.name || '-'}</td>
                  <td className="px-4 py-3">{l.vehicle?.plate || '-'}</td>
                  <td className="px-4 py-3 flex items-center gap-1"><MapPin size={14} className="text-gray-400" />{l.departure || '-'}</td>
                  <td className="px-4 py-3 flex items-center gap-1"><MapPin size={14} className="text-gray-400" />{l.arrival || '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${l.status === 'terminee' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{l.status || 'en_cours'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
