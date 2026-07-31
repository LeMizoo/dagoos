'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Truck, Search, ChevronRight, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string;
  type?: string;
  plan: string;
  status: string;
  createdAt: string;
  _count?: { drivers: number; vehicles: number };
}

export default function FlottesPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal CRUD
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Organization | null>(null);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', plan: 'FREEMIUM', status: 'active' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchOrgs(); }, []);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/organizations');
      if (!res.ok) throw new Error('Erreur ' + res.status);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setOrgs(arr.filter((o: any) => o.type === 'FLEET_MANAGER' || o.type === 'fleet'));
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage
  const filteredOrgs = orgs.filter(org => {
    const matchSearch = org.name.toLowerCase().includes(search.toLowerCase()) || 
                        org.email.toLowerCase().includes(search.toLowerCase()) ||
                        (org.slug && org.slug.toLowerCase().includes(search.toLowerCase()));
    const matchPlan = planFilter === 'all' || org.plan === planFilter;
    const matchStatus = statusFilter === 'all' || org.status === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  // Plans uniques pour le filtre
  const plans = [...new Set(orgs.map(o => o.plan).filter(Boolean))];

  // Ouvrir modal création
  const openCreate = () => {
    setEditingOrg(null);
    setFormData({ name: '', email: '', plan: 'FREEMIUM', status: 'active' });
    setFormError('');
    setModalOpen(true);
  };

  // Ouvrir modal édition
  const openEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormData({ name: org.name, email: org.email, plan: org.plan || 'FREEMIUM', status: org.status || 'active' });
    setFormError('');
    setModalOpen(true);
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Le nom et l\'email sont requis.');
      return;
    }
    setSaving(true);
    try {
      const url = editingOrg 
        ? `/api/proxy/organizations/${editingOrg.id}` 
        : '/api/proxy/organizations';
      const method = editingOrg ? 'PUT' : 'POST';
      
      const body = editingOrg 
        ? { ...formData } 
        : { ...formData, type: 'FLEET_MANAGER', slug: formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Erreur ' + res.status);
      }
      
      setModalOpen(false);
      fetchOrgs();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Supprimer
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/proxy/organizations/${deleteConfirm.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur ' + res.status);
      setDeleteConfirm(null);
      fetchOrgs();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🚛 Flottes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredOrgs.length} flotte{filteredOrgs.length !== 1 ? 's' : ''} 
            {loading ? ' (chargement...)' : ''}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm shrink-0"
        >
          <Plus size={18} />
          Nouvelle flotte
        </button>
      </div>

      {/* Erreur globale */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
          <button onClick={fetchOrgs} className="ml-auto text-red-700 underline text-xs">Réessayer</button>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou slug..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
        <select
          value={planFilter}
          onChange={e => setPlanFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">Tous les plans</option>
          {plans.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            Chargement des flottes...
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🚛</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucune flotte trouvée</h3>
            <p className="text-sm text-gray-500 mb-4">
              {search || planFilter !== 'all' || statusFilter !== 'all' 
                ? 'Essayez de modifier vos filtres.' 
                : 'Créez votre première flotte pour commencer.'}
            </p>
            {!search && planFilter === 'all' && statusFilter === 'all' && (
              <button onClick={openCreate} className="text-blue-600 text-sm hover:underline">
                + Nouvelle flotte
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Date d'ajout</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map(org => (
                  <tr key={org.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/flottes/${org.id}`} className="flex items-center gap-2 group">
                        <Truck size={16} className="text-blue-500" />
                        <span className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {org.name}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{org.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        org.plan === 'PREMIUM' ? 'bg-yellow-100 text-yellow-700' :
                        org.plan === 'STANDARD' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {org.plan || 'FREEMIUM'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        org.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          org.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        {org.status || 'inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {org.createdAt ? new Date(org.createdAt).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/flottes/${org.id}`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Voir le détail"
                        >
                          <ChevronRight size={16} />
                        </Link>
                        <button
                          onClick={() => openEdit(org)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Modifier"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(org)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Création / Édition */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingOrg ? 'Modifier la flotte' : 'Nouvelle flotte'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {formError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la flotte *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ex: Flotte Alasora"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Ex: contact@flotte.mg"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select
                value={formData.plan}
                onChange={e => setFormData({ ...formData, plan: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="FREEMIUM">Freemium</option>
                <option value="STANDARD">Standard</option>
                <option value="PREMIUM">Premium</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
              {editingOrg ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmation suppression */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmer la suppression"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <AlertCircle size={20} className="text-red-500 shrink-0" />
            <p className="text-sm text-red-700">
              Êtes-vous sûr de vouloir supprimer la flotte <strong>{deleteConfirm?.name}</strong> ? 
              Cette action est irréversible et supprimera tous les chauffeurs, véhicules et données associés.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Supprimer définitivement
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
