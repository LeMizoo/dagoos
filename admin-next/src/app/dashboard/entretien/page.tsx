'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { Search, Plus, Wrench, Calendar, DollarSign, Car, Edit, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface Maintenance {
  id: string;
  vehicleId: string;
  type: string;
  description?: string;
  km: number;
  cost: number;
  date: string;
  vehicle?: { plate: string };
}

interface Vehicle {
  id: string;
  plate: string;
}

export default function MaintenancePage() {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Maintenance | null>(null);
  const [form, setForm] = useState({ vehicleId: '', type: '', description: '', km: 0, cost: 0, date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => { fetchMaintenances(); fetchVehicles(); }, []);

  async function fetchMaintenances() {
    try {
      setError('');
      const res = await fetch('/api/proxy/maintenance');
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setMaintenances(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError('Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchVehicles() {
    try {
      const res = await fetch('/api/proxy/vehicles');
      if (res.ok) {
        const data = await res.json();
        setVehicles(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erreur chargement véhicules:', err);
    }
  }

  function openCreate() {
    setEditItem(null);
    setSubmitError('');
    setForm({ vehicleId: vehicles[0]?.id || '', type: '', description: '', km: 0, cost: 0, date: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  }

  function openEdit(m: Maintenance) {
    setEditItem(m);
    setSubmitError('');
    setForm({
      vehicleId: m.vehicleId,
      type: m.type,
      description: m.description || '',
      km: m.km,
      cost: m.cost,
      date: m.date ? new Date(m.date).toISOString().split('T')[0] : '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSubmitError('');
    try {
      const url = editItem ? `/api/proxy/maintenance/${editItem.id}` : '/api/proxy/maintenance';
      const method = editItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: form.vehicleId,
          type: form.type,
          description: form.description,
          km: form.km,
          cost: form.cost,
          date: new Date(form.date).toISOString(),
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Erreur ${res.status}`);
      }
      setModalOpen(false);
      fetchMaintenances();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cet entretien ?')) return;
    try {
      await fetch(`/api/proxy/maintenance/${id}`, { method: 'DELETE' });
      fetchMaintenances();
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = maintenances.filter(m =>
    m.type?.toLowerCase().includes(search.toLowerCase()) ||
    m.vehicle?.plate?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCost = maintenances.reduce((s, m) => s + (m.cost || 0), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🔧 Entretien</h1>
        <button onClick={openCreate} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-800 transition text-sm">
          <Plus size={16} /> Nouvel entretien
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><Wrench size={18} className="text-green-600" /></div>
            <div><div className="text-lg font-bold">{loading ? '-' : maintenances.length}</div><div className="text-xs text-gray-500">Entretiens effectués</div></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center"><Calendar size={18} className="text-yellow-600" /></div>
            <div><div className="text-lg font-bold">-</div><div className="text-xs text-gray-500">Entretiens planifiés</div></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><DollarSign size={18} className="text-blue-600" /></div>
            <div><div className="text-lg font-bold">{loading ? '-' : `${totalCost.toLocaleString()} Ar`}</div><div className="text-xs text-gray-500">Coût total</div></div>
          </div>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Rechercher par type ou véhicule..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-lg w-full text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Véhicule</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Km</th>
                <th className="px-4 py-3">Coût</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">⏳ Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucun entretien trouvé</td></tr>
              ) : (
                filtered.map(m => (
                  <tr key={m.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium flex items-center gap-1"><Car size={14} className="text-gray-400" /> {m.vehicle?.plate || m.vehicleId?.slice(0, 8) || '-'}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{m.type}</span></td>
                    <td className="px-4 py-3">{(m.km || 0).toLocaleString()} km</td>
                    <td className="px-4 py-3 font-medium">{(m.cost || 0).toLocaleString()} Ar</td>
                    <td className="px-4 py-3 text-gray-500">{m.date ? new Date(m.date).toLocaleDateString('fr-FR') : '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{m.description || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(m)} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(m.id)} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Modifier l\'entretien' : 'Nouvel entretien'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {submitError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{submitError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Véhicule *</label>
            <select value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary" required>
              <option value="">Sélectionner un véhicule</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.plate} ({v.id.slice(0, 8)})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type d'entretien *</label>
            <input type="text" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary" rows={2} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Km</label>
              <input type="number" value={form.km} onChange={e => setForm({ ...form, km: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coût (Ar)</label>
              <input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Annuler</button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-blue-800 disabled:bg-gray-400">
              {saving ? '⏳...' : editItem ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
