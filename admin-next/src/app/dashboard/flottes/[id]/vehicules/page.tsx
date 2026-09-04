'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, Car, AlertCircle, Check, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  year: number;
  status: string;
  insuranceExpiry?: string;
  vignetteExpiry?: string;
  oilChangeKm?: number;
  currentKm?: number;
}

export default function FleetVehiclesPage() {
  const { id } = useParams();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({ plate: '', model: '', brand: '', year: 2024, status: 'active' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Vehicle | null>(null);

  useEffect(() => { fetchVehicles(); }, [id]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vehicles?page=1&limit=100');
      if (!res.ok) throw new Error('Erreur ' + res.status);
      const data = await res.json();
      const arr = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
      setVehicles(arr.filter((v: any) => v.organizationId === id));
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingVehicle(null);
    setFormData({ plate: '', model: '', brand: '', year: 2024, status: 'active' });
    setModalOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormData({ plate: v.plate, model: v.model, brand: v.brand || '', year: v.year || 2024, status: v.status });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingVehicle
        ? `/api/proxy/vehicles/${editingVehicle.id}`
        : '/api/proxy/vehicles';
      const method = editingVehicle ? 'PUT' : 'POST';
      const body = editingVehicle ? formData : { ...formData, organizationId: id };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Erreur ' + res.status);
      setModalOpen(false);
      fetchVehicles();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await fetch(`/api/proxy/vehicles/${deleteConfirm.id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      fetchVehicles();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/dashboard/flottes" className="hover:text-blue-600">Flottes</Link>
        <span>/</span>
        <Link href={`/dashboard/flottes/${id}`} className="hover:text-blue-600">Détail</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Véhicules</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🚗 Véhicules</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition shrink-0">
          <Plus size={18} /> Ajouter un véhicule
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : vehicles.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Car size={40} className="mx-auto mb-3 opacity-50" />
            <p>Aucun véhicule dans cette flotte.</p>
            <button onClick={openCreate} className="text-blue-600 text-sm hover:underline mt-2">+ Ajouter un véhicule</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3">Plaque</th>
                  <th className="px-4 py-3">Modèle</th>
                  <th className="px-4 py-3">Année</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Assurance</th>
                  <th className="px-4 py-3">Vignette</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{v.plate}</td>
                    <td className="px-4 py-3">{v.brand} {v.model}</td>
                    <td className="px-4 py-3">{v.year}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${v.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{v.insuranceExpiry ? new Date(v.insuranceExpiry).toLocaleDateString('fr-FR') : '-'}</td>
                    <td className="px-4 py-3">{v.vignetteExpiry ? new Date(v.vignetteExpiry).toLocaleDateString('fr-FR') : '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(v)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={16} /></button>
                      <button onClick={() => setDeleteConfirm(v)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal CRUD */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingVehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" placeholder="Plaque *" value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} className="w-full px-3 py-2.5 border rounded-lg text-sm" required />
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Marque" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="px-3 py-2.5 border rounded-lg text-sm" />
            <input type="text" placeholder="Modèle" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="px-3 py-2.5 border rounded-lg text-sm" />
          </div>
          <input type="number" placeholder="Année" value={formData.year} onChange={e => setFormData({...formData, year: +e.target.value})} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2.5 border rounded-lg text-sm">
            <option value="active">Actif</option>
            <option value="maintenance">En maintenance</option>
            <option value="inactive">Inactif</option>
          </select>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? '...' : editingVehicle ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal suppression */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmer la suppression">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Supprimer le véhicule <strong>{deleteConfirm?.plate}</strong> ?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
            <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Supprimer</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
