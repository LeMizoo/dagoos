'use client';
import { apiFetch } from "@/lib/api";
import { useState, useEffect } from 'react';
import { Users, Plus, Search, Car, CheckCircle, XCircle, Link2 } from 'lucide-react';

export default function FleetDrivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigning, setAssigning] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);
  
  async function load() {
    try {
      const [meRes, dRes, vRes] = await Promise.all([
        fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
        apiFetch('/api/proxy/drivers').then(r => r.json()).then(d => Array.isArray(d) ? d.filter((dr: any) => dr.vehicleId || dr.organizationId) : []),
        apiFetch('/api/proxy/vehicles').then(r => r.json())
      ]);
      const authUser = meRes?.user || meRes;
      const resolvedOrgId = authUser?.organizationId || authUser?.organization?.id || authUser?.id;
      setOrgId(resolvedOrgId || null);
      const allDrivers = Array.isArray(dRes) ? dRes : [];
      const allVehicles = Array.isArray(vRes) ? vRes : [];
      setDrivers(resolvedOrgId ? allDrivers.filter((d: any) => d.organizationId === resolvedOrgId || d.organization?.id === resolvedOrgId) : allDrivers);
      setVehicles(resolvedOrgId ? allVehicles.filter((v: any) => v.organizationId === resolvedOrgId || v.organization?.id === resolvedOrgId).filter((v: any) => v.status === 'active') : allVehicles.filter((v: any) => v.status === 'active'));
    } catch {} finally { setLoading(false); }
  }

  async function assignVehicle(driverId: string, vehicleId: string) {
    try {
      await fetch(`/api/proxy/drivers/${driverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: vehicleId || null }),
      });
      setAssigning(null);
      load();
    } catch (e) { console.error(e); }
  }

  const filtered = drivers.filter(d => 
    (d.firstName + ' ' + d.lastName + ' ' + (d.driverCode || '')).toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === 'all' || d.status === statusFilter)
  );

  const stats = { total: drivers.length, active: drivers.filter(d => d.status === 'active').length, inactive: drivers.filter(d => d.status !== 'active').length };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">👨‍✈️ Chauffeurs</h1>
          <p className="text-sm text-gray-500">{stats.total} chauffeurs · {stats.active} actifs</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700"><Plus size={18} /> Ajouter</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={Users} label="Total" value={stats.total} color="blue" />
        <StatCard icon={CheckCircle} label="Actifs" value={stats.active} color="green" />
        <StatCard icon={XCircle} label="Inactifs" value={stats.inactive} color="red" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700 flex gap-3">
          <div className="relative flex-1"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600" /></div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600">
            <option value="all">Tous</option><option value="active">Actifs</option><option value="inactive">Inactifs</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              <tr><th className="px-4 py-3 text-left">Chauffeur</th><th className="px-4 py-3 text-left">Code</th><th className="px-4 py-3 text-left">Téléphone</th><th className="px-4 py-3 text-left">Véhicule assigné</th><th className="px-4 py-3 text-left">Statut</th><th className="px-4 py-3 text-left">CA/mois</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">Chargement...</td></tr> :
               filtered.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucun chauffeur</td></tr> :
               filtered.map(d => {
                const currentVehicle = vehicles.find(v => v.id === d.vehicleId);
                return (
                <tr key={d.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{d.firstName} {d.lastName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.driverCode || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{d.phone || '-'}</td>
                  <td className="px-4 py-3">
                    {assigning === d.id ? (
                      <select 
                        className="text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:text-white"
                        defaultValue={d.vehicleId || ''}
                        onChange={e => assignVehicle(d.id, e.target.value)}
                        onBlur={() => setAssigning(null)}
                        autoFocus
                      >
                        <option value="">Aucun</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                        ))}
                      </select>
                    ) : (
                      <button 
                        onClick={() => setAssigning(d.id)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        {currentVehicle ? (
                          <span className="flex items-center gap-1">
                            <Car size={12} /> {currentVehicle.plate}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400">
                            <Link2 size={12} /> Assigner
                          </span>
                        )}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{d.status || 'inactif'}</span></td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{(Math.random() * 500000 + 100000).toFixed(0)} Ar</td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colors: any = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', red: 'bg-red-100 text-red-600' };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}><Icon size={20} /></div>
      <div><div className="text-xl font-bold text-gray-800 dark:text-white">{value}</div><div className="text-xs text-gray-500">{label}</div></div>
    </div>
  );
}
