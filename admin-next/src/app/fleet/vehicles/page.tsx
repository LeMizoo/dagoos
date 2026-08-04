'use client';
import { useState, useEffect } from 'react';
import { Car, Plus, Search, AlertTriangle, CheckCircle, Activity, Wrench } from 'lucide-react';

export default function FleetVehicles() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { load(); }, []);
  async function load() {
    try { const r = await fetch('/api/proxy/vehicles'); setVehicles(Array.isArray(await r.json()) ? await r.json() : []); } catch {} finally { setLoading(false); }
  }

  const filtered = vehicles.filter(v => 
    (v.plate || '').toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === 'all' || v.status === statusFilter)
  );

  const stats = { total: vehicles.length, active: vehicles.filter(v => v.status === 'active').length, maintenance: vehicles.filter(v => v.status === 'maintenance').length, inactive: vehicles.filter(v => v.status === 'inactive').length };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-gray-800 dark:text-white">🚗 Véhicules</h1><p className="text-sm text-gray-500">{stats.total} véhicules · {stats.active} en service</p></div>
        <button className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700"><Plus size={18} /> Ajouter</button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={Car} label="Total" value={stats.total} color="blue" />
        <StatCard icon={CheckCircle} label="En service" value={stats.active} color="green" />
        <StatCard icon={Wrench} label="Maintenance" value={stats.maintenance} color="yellow" />
        <StatCard icon={AlertTriangle} label="Inactifs" value={stats.inactive} color="red" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b flex gap-3">
          <div className="relative flex-1"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher une plaque..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" /></div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600">
            <option value="all">Tous</option><option value="active">En service</option><option value="maintenance">Maintenance</option><option value="inactive">Inactifs</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"><tr><th className="px-4 py-3 text-left">Plaque</th><th className="px-4 py-3 text-left">Modèle</th><th className="px-4 py-3 text-left">Année</th><th className="px-4 py-3 text-left">Kilométrage</th><th className="px-4 py-3 text-left">Statut</th><th className="px-4 py-3 text-left">Prochaine maintenance</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-8">Chargement...</td></tr> :
               filtered.length === 0 ? <tr><td colSpan={6} className="text-center py-8">Aucun véhicule</td></tr> :
               filtered.map(v => (
                <tr key={v.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{v.plate}</td>
                  <td className="px-4 py-3 text-gray-500">{v.model || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{v.year || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{(v.currentKm || 0).toLocaleString()} km</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${v.status === 'active' ? 'bg-green-100 text-green-700' : v.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{v.status || 'inactif'}</span></td>
                  <td className="px-4 py-3 text-gray-500">{v.nextMaintenance || '15/09/2026'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colors: any = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', yellow: 'bg-yellow-100 text-yellow-600', red: 'bg-red-100 text-red-600' };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}><Icon size={20} /></div>
      <div><div className="text-xl font-bold text-gray-800 dark:text-white">{value}</div><div className="text-xs text-gray-500">{label}</div></div>
    </div>
  );
}
