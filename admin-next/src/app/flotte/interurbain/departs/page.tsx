'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import { Plus, Pencil, Trash2, Calendar, Clock, MapPin, Users, Car, Search, ClipboardList, X } from 'lucide-react';
import PlanVehicule from '@/components/flotte/PlanVehicule';

export default function InterurbainDeparts() {
  const { organization } = useOrganization();
  const [departs, setDeparts] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ 
    pointDepart: '', destination: '', date: '', heure: '', prix: '', placesTotal: '25', vehiculeId: '' 
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('all');
  const [selectedDepart, setSelectedDepart] = useState<any | null>(null);
  const [showManifeste, setShowManifeste] = useState(false);

  const load = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      const [dRes, vRes] = await Promise.all([
        apiFetch('/departs').then(r => r.ok ? r.json() : []),
        apiFetch('/vehicles?page=1&limit=100').then(r => r.ok ? r.json() : []),
      ]);
      
      const allDeparts = Array.isArray(dRes) ? dRes : [];
      const allVehicles = Array.isArray(vRes) ? vRes : [];
      
      setDeparts(allDeparts.filter((d: any) => d.organizationId === organization.id));
      setVehicles(allVehicles.filter((v: any) => v.organizationId === organization.id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => load(), 30000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/departs/${editing.id}` : '/departs';
      const method = editing ? 'PUT' : 'POST';
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify({
          ...form,
          prix: Number(form.prix),
          placesTotal: Number(form.placesTotal),
          organizationId: organization?.id,
        }),
      });
      
      if (res.ok) {
        setModalOpen(false);
        setEditing(null);
        load();
      } else {
        const err = await res.json();
        setError(err.error || 'Erreur');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce départ ?')) return;
    try {
      await apiFetch(`/departs/${id}`, { method: 'DELETE' });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  function openManifeste(depart: any) {
    setSelectedDepart(depart);
    setShowManifeste(true);
  }

  const filtered = departs
    .filter(d => statutFilter === 'all' || d.statut === statutFilter)
    .filter(d => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      const haystack = `${d.pointDepart || ''} ${d.destination || ''}`.toLowerCase();
      return haystack.includes(searchLower);
    });

  const stats = {
    total: departs.length,
    published: departs.filter(d => d.statut === 'PUBLISHED').length,
    draft: departs.filter(d => d.statut === 'DRAFT').length,
    left: departs.filter(d => d.statut === 'LEFT').length,
  };

  const reservations = selectedDepart?.reservations || [];
  const placesReservees = reservations
    .filter((r: any) => r.statut === 'CONFIRMED' || r.statut === 'PENDING')
    .map((r: any) => r.place);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🚌 Départs</h1>
          <p className="text-sm text-gray-500">
            {stats.total} départs · {stats.published} publiés
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ pointDepart: '', destination: '', date: '', heure: '', prix: '', placesTotal: '25', vehiculeId: '' });
            setModalOpen(true);
          }}
          className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 hover:bg-emerald-700"
        >
          <Plus size={18} /> Nouveau départ
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-center">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-center">
          <div className="text-2xl font-bold text-green-600">{stats.published}</div>
          <div className="text-xs text-gray-500">Publiés</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
          <div className="text-xs text-gray-500">Brouillons</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-center">
          <div className="text-2xl font-bold text-gray-500">{stats.left}</div>
          <div className="text-xs text-gray-500">Partis</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par point de départ, destination..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <select
          value={statutFilter}
          onChange={e => setStatutFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Tous statuts</option>
          <option value="PUBLISHED">Publiés</option>
          <option value="DRAFT">Brouillons</option>
          <option value="LEFT">Partis</option>
        </select>
      </div>

      {/* Liste des départs */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Aucun départ</div>
        ) : (
          filtered.map(d => (
            <div key={d.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-500" />
                    {d.pointDepart} → {d.destination}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} /> {d.date ? new Date(d.date).toLocaleDateString('fr-FR') : '-'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {d.heure || '-'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={14} /> {d.reservations?.filter((r: any) => r.statut !== 'CANCELLED').length || 0}/{d.placesTotal || 0} places
                    </span>
                    <span className="flex items-center gap-1">
                      <Car size={14} /> {d.vehicle?.plate || 'Non assigné'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    d.statut === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                    d.statut === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {d.statut}
                  </span>
                  <button
                    onClick={() => openManifeste(d)}
                    className="p-1 text-gray-400 hover:text-emerald-600"
                    title="Voir le manifeste"
                  >
                    <ClipboardList size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setEditing(d);
                      setForm({
                        pointDepart: d.pointDepart || '',
                        destination: d.destination || '',
                        date: d.date ? d.date.split('T')[0] : '',
                        heure: d.heure || '',
                        prix: String(d.prix || ''),
                        placesTotal: String(d.placesTotal || '25'),
                        vehiculeId: d.vehiculeId || '',
                      });
                      setModalOpen(true);
                    }}
                    className="p-1 text-gray-400 hover:text-emerald-600"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-2 text-sm font-semibold text-emerald-600">
                {(d.prix || 0).toLocaleString()} Ar
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modale Manifeste */}
      {showManifeste && selectedDepart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowManifeste(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    📋 Manifeste — {selectedDepart.pointDepart} → {selectedDepart.destination}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedDepart.date ? new Date(selectedDepart.date).toLocaleDateString('fr-FR') : '-'} à {selectedDepart.heure}
                  </p>
                </div>
                <button onClick={() => setShowManifeste(false)} className="p-2 text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Plan du véhicule */}
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">🚌 Plan du véhicule</h3>
                  <PlanVehicule
                    placesTotal={selectedDepart.placesTotal || 25}
                    placesReservees={placesReservees}
                  />
                  <div className="mt-4 text-xs text-gray-500">
                    <p>{reservations.filter((r: any) => r.statut !== 'CANCELLED').length} places occupées sur {selectedDepart.placesTotal || 0}</p>
                  </div>
                </div>

                {/* Manifeste passagers */}
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">👥 Passagers</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left text-gray-500">
                        <tr>
                          <th className="px-3 py-2">#</th>
                          <th className="px-3 py-2">Passager</th>
                          <th className="px-3 py-2">Siège</th>
                          <th className="px-3 py-2">Téléphone</th>
                          <th className="px-3 py-2">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservations.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucune réservation</td></tr>
                        ) : (
                          reservations
                            .filter((r: any) => r.statut !== 'CANCELLED')
                            .sort((a: any, b: any) => (a.place || '').localeCompare(b.place || ''))
                            .map((r: any, idx: number) => (
                              <tr key={r.id} className="border-t hover:bg-gray-50">
                                <td className="px-3 py-2 text-gray-400">{idx + 1}</td>
                                <td className="px-3 py-2 font-medium">{r.passagerNom}</td>
                                <td className="px-3 py-2">
                                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{r.place}</span>
                                </td>
                                <td className="px-3 py-2 text-gray-500">{r.telephone || '-'}</td>
                                <td className="px-3 py-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    r.statut === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                    r.statut === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {r.statut === 'CONFIRMED' ? 'Confirmé' : r.statut === 'PENDING' ? 'En attente' : 'Annulé'}
                                  </span>
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal création/édition */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">
              {editing ? '✏️ Modifier le départ' : '➕ Nouveau départ'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Point de départ"
                value={form.pointDepart}
                onChange={e => setForm({...form, pointDepart: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
              <input
                type="text"
                placeholder="Destination"
                value={form.destination}
                onChange={e => setForm({...form, destination: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({...form, date: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
                <input
                  type="time"
                  value={form.heure}
                  onChange={e => setForm({...form, heure: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  placeholder="Prix (Ar)"
                  value={form.prix}
                  onChange={e => setForm({...form, prix: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
                <input
                  type="number"
                  placeholder="Places"
                  value={form.placesTotal}
                  onChange={e => setForm({...form, placesTotal: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <select
                value={form.vehiculeId}
                onChange={e => setForm({...form, vehiculeId: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Sélectionner un véhicule</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                ))}
              </select>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 border rounded-lg text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : editing ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
