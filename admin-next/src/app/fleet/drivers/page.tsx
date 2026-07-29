'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface Driver {
  id: string; userId: string; organizationId: string;
  driverCode: string; pin?: string; vehicleId?: string; status: string;
  user?: { name?: string; email?: string }; organization?: { name?: string };
}

export default function FleetDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Driver | null>(null);
  const [form, setForm] = useState({ driverCode: '', pin: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => { fetchDrivers(); }, []);

  async function fetchDrivers() {
    try {
      setError('');
      const res = await fetch('/api/proxy/drivers');
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setDrivers(Array.isArray(data) ? data : []);
    } catch (err: any) { setError('Impossible de charger les chauffeurs.'); } finally { setLoading(false); }
  }

  function openCreate() {
    setEditItem(null); setSubmitError('');
    setForm({ driverCode: '', pin: '', status: 'active' });
    setModalOpen(true);
  }

  function openEdit(driver: Driver) {
    setEditItem(driver); setSubmitError('');
    setForm({ driverCode: driver.driverCode, pin: driver.pin || '', status: driver.status });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setSubmitError('');
    try {
      const url = editItem ? `/api/proxy/drivers/${editItem.id}` : '/api/proxy/drivers';
      const method = editItem ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const errData = await res.json(); throw new Error(errData.error || `Erreur ${res.status}`); }
      setModalOpen(false); fetchDrivers();
    } catch (err: any) { setSubmitError(err.message); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce chauffeur ?')) return;
    try { await fetch(`/api/proxy/drivers/${id}`, { method: 'DELETE' }); fetchDrivers(); } catch (err) { console.error(err); }
  }

  const filtered = drivers.filter(d => d.driverCode?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🛵 Chauffeurs</h1>
        <button onClick={openCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition text-sm"><Plus size={16} /> Ajouter</button>
      </div>
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 text-sm">{error}</div>}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b"><div className="relative max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-4 py-2 border rounded-lg w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Chauffeur</th><th className="px-4 py-3">Organisation</th><th className="px-4 py-3">Véhicule</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">⏳ Chargement...</td></tr> :
               filtered.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucun chauffeur</td></tr> :
               filtered.map(d => (
                <tr key={d.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{d.driverCode}</td>
                  <td className="px-4 py-3">{d.user?.name || d.user?.email || '-'}</td>
                  <td className="px-4 py-3 text-xs">{d.organization?.name || '-'}</td>
                  <td className="px-4 py-3">{d.vehicleId ? '🏍️ Assigné' : '❌ Aucun'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${d.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{d.status}</span></td>
                  <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => openEdit(d)} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Edit size={14} /></button><button onClick={() => handleDelete(d.id)} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 size={14} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Modifier le chauffeur' : 'Nouveau chauffeur'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{submitError}</div>}
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Code chauffeur *</label><input type="text" value={form.driverCode} onChange={e => setForm({ ...form, driverCode: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Code PIN *</label><input type="text" value={form.pin} onChange={e => setForm({ ...form, pin: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500" required maxLength={4} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Statut</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"><option value="active">Actif</option><option value="inactive">Inactif</option></select></div>
          <div className="flex gap-2 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Annuler</button><button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400">{saving ? '⏳...' : editItem ? 'Modifier' : 'Créer'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
