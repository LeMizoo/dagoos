'use client';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Car, Plus, Search, CheckCircle, Wrench } from 'lucide-react';

const FLEET_VEHICLE_TYPES: Record<string, string> = {
  moto: '🏍️ Taxi Moto', voiture: '🚗 Taxi', bus: '🚌 Bus', minivan: '🚐 Mini Van', tricycle: '🛺 Tricycle',
};

export default function FleetVehicles() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [form, setForm] = useState({ plate: '', model: '', type: 'voiture', year: new Date().getFullYear(), currentKm: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() {
    try {
      const [meRes, vRes] = await Promise.all([
        apiFetch('/api/auth/me').then(r => r.ok ? r.json() : null),
        apiFetch('/vehicles').then(r => r.json())
      ]);
      const authUser = meRes?.user || meRes;
      const resolvedOrgId = authUser?.organizationId || authUser?.organization?.id || null;
      setOrgId(resolvedOrgId);
      const all = Array.isArray(vRes) ? vRes : [];
      setVehicles(resolvedOrgId ? all.filter((v: any) => v.organizationId === resolvedOrgId) : all);
    } catch {} finally { setLoading(false); }
  }

  async function handleAdd() {
    if (!form.plate || !orgId) return;
    setSaving(true);
    try {
      const res = await apiFetch('/vehicles', {
        method: 'POST',
        body: JSON.stringify({ ...form, organizationId: orgId, status: 'active' })
      });
      if (res.ok) { setModalOpen(false); setForm({ plate: '', model: '', type: 'voiture', year: new Date().getFullYear(), currentKm: 0 }); load(); }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  const filtered = vehicles.filter(v => {
    const matchPlate = (v.plate || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    const matchType = typeFilter === 'all' || v.type === typeFilter;
    return matchPlate && matchStatus && matchType;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold">🚗 Véhicules</h1><p className="text-sm text-gray-500">{vehicles.length} véhicules</p></div>
        <button onClick={() => setModalOpen(true)} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700"><Plus size={18} /> Ajouter</button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={Car} label="Total" value={vehicles.length} color="blue" />
        <StatCard icon={CheckCircle} label="En service" value={vehicles.filter(v => v.status === 'active').length} color="green" />
        <StatCard icon={Wrench} label="Maintenance" value={vehicles.filter(v => v.status === 'maintenance').length} color="yellow" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher une plaque..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" /></div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm"><option value="all">Tous types</option>{Object.entries(FLEET_VEHICLE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm"><option value="all">Tous statuts</option><option value="active">En service</option><option value="maintenance">Maintenance</option><option value="inactive">Inactifs</option></select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500"><tr><th className="px-4 py-3 text-left">Plaque</th><th className="px-4 py-3 text-left">Type</th><th className="px-4 py-3 text-left">Modèle</th><th className="px-4 py-3 text-left">Année</th><th className="px-4 py-3 text-left">Km</th><th className="px-4 py-3 text-left">Statut</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-8">Chargement...</td></tr> :
               filtered.length === 0 ? <tr><td colSpan={6} className="text-center py-8">Aucun véhicule</td></tr> :
               filtered.map(v => (
                <tr key={v.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{v.plate}</td><td className="px-4 py-3">{FLEET_VEHICLE_TYPES[v.type] || v.type || '-'}</td><td className="px-4 py-3 text-gray-500">{v.model || '-'}</td><td className="px-4 py-3 text-gray-500">{v.year || '-'}</td><td className="px-4 py-3 text-gray-500">{(v.currentKm || 0).toLocaleString()} km</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${v.status === 'active' ? 'bg-green-100 text-green-700' : v.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{v.status || 'inactif'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Ajouter un véhicule</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Plaque *" value={form.plate} onChange={e => setForm({...form, plate: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <input type="text" placeholder="Modèle" value={form.model} onChange={e => setForm({...form, model: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">{Object.entries(FLEET_VEHICLE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              <div className="flex gap-2">
                <input type="number" placeholder="Année" value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value) || 0})} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                <input type="number" placeholder="Km actuels" value={form.currentKm} onChange={e => setForm({...form, currentKm: parseInt(e.target.value) || 0})} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm">Annuler</button>
              <button onClick={handleAdd} disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">{saving ? 'Ajout...' : 'Ajouter'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colors: any = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', yellow: 'bg-yellow-100 text-yellow-600' };
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}><Icon size={20} /></div>
      <div><div className="text-xl font-bold">{value}</div><div className="text-xs text-gray-500">{label}</div></div>
    </div>
  );
}
