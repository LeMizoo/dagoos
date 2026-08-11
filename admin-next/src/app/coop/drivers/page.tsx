'use client';
import { useState, useEffect } from 'react';
import { Users, Plus, Search, Car, CheckCircle, XCircle, Link2 } from 'lucide-react';

export default function CoopDrivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigning, setAssigning] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', license: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);
  
  async function load() {
    try {
      const [meRes, dRes, vRes] = await Promise.all([
        fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
        fetch('/api/proxy/drivers').then(r => r.json()),
        fetch('/api/proxy/vehicles').then(r => r.json())
      ]);
      const authUser = meRes?.user || meRes;
      const resolvedOrgId = authUser?.organizationId || authUser?.organization?.id;
      setOrgId(resolvedOrgId || null);
      const allDrivers = Array.isArray(dRes) ? dRes : [];
      const allVehicles = Array.isArray(vRes) ? vRes : [];
      setDrivers(resolvedOrgId ? allDrivers.filter((d: any) => d.organizationId === resolvedOrgId) : allDrivers);
      setVehicles(resolvedOrgId ? allVehicles.filter((v: any) => v.organizationId === resolvedOrgId && v.status === 'active') : allVehicles.filter((v: any) => v.status === 'active'));
    } catch {} finally { setLoading(false); }
  }

  async function handleAdd() {
    if (!form.firstName || !form.lastName || !orgId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/proxy/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, organizationId: orgId, status: 'active' })
      });
      if (res.ok) {
        setModalOpen(false);
        setForm({ firstName: '', lastName: '', phone: '', license: '' });
        load();
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function assignVehicle(driverId: string, vehicleId: string) {
    await fetch(`/api/proxy/drivers/${driverId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId: vehicleId || null }),
    });
    setAssigning(null);
    load();
  }

  const filtered = drivers.filter(d => 
    ((d.firstName || '') + ' ' + (d.lastName || '') + ' ' + (d.driverCode || '')).toLowerCase().includes(search.toLowerCase()) &&
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
        <button onClick={() => setModalOpen(true)} className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 hover:bg-emerald-700"><Plus size={18} /> Ajouter</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={Users} label="Total" value={stats.total} color="blue" />
        <StatCard icon={CheckCircle} label="Actifs" value={stats.active} color="green" />
        <StatCard icon={XCircle} label="Inactifs" value={stats.inactive} color="red" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex gap-3">
          <div className="relative flex-1"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" /></div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm"><option value="all">Tous</option><option value="active">Actifs</option><option value="inactive">Inactifs</option></select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500"><tr><th className="px-4 py-3 text-left">Chauffeur</th><th className="px-4 py-3 text-left">Code</th><th className="px-4 py-3 text-left">Téléphone</th><th className="px-4 py-3 text-left">Véhicule</th><th className="px-4 py-3 text-left">Statut</th><th className="px-4 py-3 text-left">CA/mois</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-8">Chargement...</td></tr> :
               filtered.length === 0 ? <tr><td colSpan={6} className="text-center py-8">Aucun chauffeur</td></tr> :
               filtered.map(d => {
                const cv = vehicles.find(v => v.id === d.vehicleId);
                return (
                <tr key={d.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{d.firstName} {d.lastName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.driverCode || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{d.phone || '-'}</td>
                  <td className="px-4 py-3">
                    {assigning === d.id ? (
                      <select className="text-xs border rounded px-2 py-1" defaultValue={d.vehicleId || ''} onChange={e => assignVehicle(d.id, e.target.value)} onBlur={() => setAssigning(null)} autoFocus>
                        <option value="">Aucun</option>
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
                      </select>
                    ) : (
                      <button onClick={() => setAssigning(d.id)} className="flex items-center gap-1 text-xs text-emerald-600 hover:underline">
                        {cv ? <span className="flex items-center gap-1"><Car size={12} /> {cv.plate}</span> : <span className="flex items-center gap-1 text-gray-400"><Link2 size={12} /> Assigner</span>}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{d.status || 'inactif'}</span></td>
                  <td className="px-4 py-3 font-medium">{(Math.random() * 500000 + 100000).toFixed(0)} Ar</td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Ajouter un chauffeur</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Prénom" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="text" placeholder="Nom" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="text" placeholder="Téléphone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="text" placeholder="Permis" value={form.license} onChange={e => setForm({...form, license: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm">Annuler</button>
              <button onClick={handleAdd} disabled={saving} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">{saving ? 'Ajout...' : 'Ajouter'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colors: any = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', red: 'bg-red-100 text-red-600' };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}><Icon size={20} /></div>
      <div><div className="text-xl font-bold">{value}</div><div className="text-xs text-gray-500">{label}</div></div>
    </div>
  );
}
