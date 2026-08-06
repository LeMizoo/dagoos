'use client';
import { apiFetch } from "@/lib/api";
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, Users, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  code: string;
  phone?: string;
  status: string;
  vehicle?: { plate: string };
  createdAt: string;
}

export default function FleetDriversPage() {
  const { id } = useParams();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', code: '', phone: '', status: 'active' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Driver | null>(null);

  useEffect(() => { fetchDrivers(); }, [id]);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/drivers');
      if (!res.ok) throw new Error('Erreur ' + res.status);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setDrivers(arr.filter((d: any) => d.organizationId === id));
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingDriver(null);
    setFormData({ firstName: '', lastName: '', code: '', phone: '', status: 'active' });
    setModalOpen(true);
  };

  const openEdit = (d: Driver) => {
    setEditingDriver(d);
    setFormData({ firstName: d.firstName, lastName: d.lastName, code: d.code, phone: d.phone || '', status: d.status });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingDriver ? `/api/proxy/drivers/${editingDriver.id}` : '/api/proxy/drivers';
      const method = editingDriver ? 'PUT' : 'POST';
      const body = editingDriver ? formData : { ...formData, organizationId: id };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Erreur ' + res.status);
      setModalOpen(false);
      fetchDrivers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await fetch(`/api/proxy/drivers/${deleteConfirm.id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      fetchDrivers();
    } catch (err: any) { setError(err.message); }
  };

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/dashboard/flottes" className="hover:text-blue-600">Flottes</Link>
        <span>/</span>
        <Link href={`/dashboard/flottes/${id}`} className="hover:text-blue-600">Détail</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Chauffeurs</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">👨‍✈️ Chauffeurs</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition shrink-0">
          <Plus size={18} /> Ajouter un chauffeur
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Chargement...</div>
        ) : drivers.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-50" />
            <p>Aucun chauffeur dans cette flotte.</p>
            <button onClick={openCreate} className="text-blue-600 text-sm hover:underline mt-2">+ Ajouter un chauffeur</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3">Nom complet</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Téléphone</th>
                  <th className="px-4 py-3">Véhicule</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{d.firstName} {d.lastName}</td>
                    <td className="px-4 py-3 font-mono text-xs">{d.code}</td>
                    <td className="px-4 py-3 text-gray-500">{d.phone || '-'}</td>
                    <td className="px-4 py-3">{d.vehicle?.plate || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(d)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Pencil size={16} /></button>
                      <button onClick={() => setDeleteConfirm(d)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal CRUD */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingDriver ? 'Modifier le chauffeur' : 'Ajouter un chauffeur'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Prénom *" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="px-3 py-2.5 border rounded-lg text-sm" required />
            <input type="text" placeholder="Nom *" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="px-3 py-2.5 border rounded-lg text-sm" required />
          </div>
          <input type="text" placeholder="Code chauffeur" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          <input type="text" placeholder="Téléphone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2.5 border rounded-lg text-sm" />
          <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2.5 border rounded-lg text-sm">
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? '...' : editingDriver ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmer">
        <div className="space-y-4">
          <p className="text-sm">Supprimer <strong>{deleteConfirm?.firstName} {deleteConfirm?.lastName}</strong> ?</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
            <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Supprimer</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
