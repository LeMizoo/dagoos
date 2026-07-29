export const dynamic = 'force-dynamic';
'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Car } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface Vehicle {
  id: string;
  plate: string;
  model?: string;
  year?: number;
  currentKm: number;
  status: string;
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Vehicle | null>(null);
  const [form, setForm] = useState({ plate: '', model: '', year: new Date().getFullYear(), currentKm: 0, status: 'active' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchVehicles(); }, []);

  async function fetchVehicles() {
    try {
      setError('');
      const res = await fetch('/api/proxy/vehicles');
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError('Impossible de charger les véhicules.');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditItem(null);
    setForm({ plate: '', model: '', year: new Date().getFullYear(), currentKm: 0, status: 'active' });
    setModalOpen(true);
  }

  function openEdit(v: Vehicle) {
    setEditItem(v);
    setForm({ plate: v.plate, model: v.model || '', year: v.year || 2024, currentKm: v.currentKm, status: v.status });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editItem ? `/api/proxy/vehicles/${editItem.id}` : '/api/proxy/vehicles';
      const method = editItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      setModalOpen(false);
      fetchVehicles();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce véhicule ?')) return;
    try {
      await fetch(`/api/proxy/vehicles/${id}`, { method: 'DELETE' });
      fetchVehicles();
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = vehicles.filter(v =>
    v.plate?.toLowerCase().includes(search.toLowerCase()) ||
    v.model?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🏍️ Véhicules</h1>
        <button onClick={openCreate} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-800 transition text-sm">
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Rechercher..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-lg w-full text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Plaque</th>
                <th className="px-4 py-3">Modèle</th>
                <th className="px-4 py-3">Année</th>
                <th className="px-4 py-3">Kilométrage</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">⏳ Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucun véhicule</td></tr>
              ) : (
                filtered.map(v => (
                  <tr key={v.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium flex items-center gap-2"><Car size={16} className="text-gray-400" /> {v.plate}</td>
                    <td className="px-4 py-3">{v.model || '-'}</td>
                    <td className="px-4 py-3">{v.year || '-'}</td>
                    <td className="px-4 py-3">{v.currentKm?.toLocaleString()} km</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${v.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {v.status === 'active' ? '✅ Actif' : '⚠️ Maintenance'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(v)} className="p-1 hover:bg-blue-100 rounded text-blue-600"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(v.id)} className="p-1 hover:bg-red-100 rounded text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Modifier le véhicule' : 'Nouveau véhicule'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plaque *</label>
            <input type="text" value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
            <input type="text" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
              <input type="number" value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kilométrage</label>
              <input type="number" value={form.currentKm} onChange={e => setForm({ ...form, currentKm: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary">
              <option value="active">Actif</option>
              <option value="maintenance">En maintenance</option>
            </select>
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
