'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import { Ticket, Search, Phone, CheckCircle, XCircle, Clock, MapPin, Calendar, Car, X, User } from 'lucide-react';

export default function InterurbainReservations() {
  const { organization } = useOrganization();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState<any | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const load = useCallback(async () => {
    if (!organization?.id) return;
    try {
      const res = await apiFetch('/reservations?page=1&limit=100').then(r => r.ok ? r.json() : []);
      const allReservations = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setReservations(allReservations);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => { load(); }, [load]);

  async function updateStatut(id: string, statut: string) {
    await apiFetch(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ statut }),
    });
    load();
  }

  const filtered = reservations
    .filter(r => statutFilter === 'all' || r.statut === statutFilter)
    .filter(r => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return `${r.passagerNom || ''} ${r.telephone || ''} ${r.place || ''}`.toLowerCase().includes(searchLower);
    });

  const stats = {
    total: reservations.length,
    confirmed: reservations.filter(r => r.statut === 'CONFIRMED').length,
    pending: reservations.filter(r => r.statut === 'PENDING').length,
    cancelled: reservations.filter(r => r.statut === 'CANCELLED').length,
  };

  function openDetail(r: any) {
    setSelectedReservation(r);
    setShowDetail(true);
  }

  const depart = selectedReservation?.depart;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🎫 Réservations</h1>
          <p className="text-sm text-gray-500">{stats.total} réservations · {stats.pending} en attente</p>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-center">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-center">
          <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          <div className="text-xs text-gray-500">Confirmées</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-xs text-gray-500">En attente</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-center">
          <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          <div className="text-xs text-gray-500">Annulées</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: 'all', label: 'Toutes', count: stats.total },
          { key: 'PENDING', label: 'En attente', count: stats.pending },
          { key: 'CONFIRMED', label: 'Confirmées', count: stats.confirmed },
          { key: 'CANCELLED', label: 'Annulées', count: stats.cancelled },
        ].map(f => (
          <button key={f.key} onClick={() => setStatutFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              statutFilter === f.key ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Rechercher par nom, téléphone, place..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm" />
      </div>

      {/* Tableau des réservations */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Passager</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Place</th>
                <th className="px-4 py-3">Trajet</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucune réservation</td></tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(r)}>
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <User size={14} className="text-gray-400" />
                      {r.passagerNom}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.telephone || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{r.place}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {r.depart ? `${r.depart.pointDepart} → ${r.depart.destination}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        r.statut === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 
                        r.statut === 'CANCELLED' ? 'bg-red-100 text-red-700' : 
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {r.statut === 'CONFIRMED' ? 'Confirmé' : r.statut === 'CANCELLED' ? 'Annulé' : 'En attente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {r.statut === 'PENDING' && (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => updateStatut(r.id, 'CONFIRMED')} className="text-xs text-green-600 hover:underline flex items-center gap-1">
                            <CheckCircle size={12} /> Confirmer
                          </button>
                          <button onClick={() => updateStatut(r.id, 'CANCELLED')} className="text-xs text-red-600 hover:underline flex items-center gap-1">
                            <XCircle size={12} /> Annuler
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale détail */}
      {showDetail && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetail(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">🎫 Détail de la réservation</h2>
                <button onClick={() => setShowDetail(false)} className="p-2 text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Passager */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-gray-500 mb-2">👤 Passager</h3>
                  <p className="font-semibold text-gray-800 dark:text-white">{selectedReservation.passagerNom}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                    <Phone size={14} /> {selectedReservation.telephone || 'Non renseigné'}
                  </p>
                </div>

                {/* Voyage */}
                {depart && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-500 mb-2">🚌 Voyage</h3>
                    <p className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      <MapPin size={14} className="text-emerald-500" />
                      {depart.pointDepart} → {depart.destination}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {depart.date ? new Date(depart.date).toLocaleDateString('fr-FR') : '-'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {depart.heure || '-'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Siège et tarif */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Siège</p>
                    <p className="text-xl font-bold font-mono">{selectedReservation.place}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Tarif</p>
                    <p className="text-xl font-bold text-emerald-600">
                      {depart?.prix ? `${depart.prix.toLocaleString()} Ar` : '-'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500">Statut</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedReservation.statut === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                      selectedReservation.statut === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {selectedReservation.statut}
                    </span>
                  </div>
                </div>

                {/* Paiement */}
                {(selectedReservation.paiementRef || selectedReservation.paiementInfo) && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-gray-500 mb-2">💳 Paiement</h3>
                    {selectedReservation.paiementRef && (
                      <p className="text-sm">Réf : <span className="font-mono">{selectedReservation.paiementRef}</span></p>
                    )}
                    {selectedReservation.paiementInfo && (
                      <p className="text-sm text-gray-500">{selectedReservation.paiementInfo}</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                {selectedReservation.statut === 'PENDING' && (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => {
                        updateStatut(selectedReservation.id, 'CONFIRMED');
                        setShowDetail(false);
                      }}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                      Confirmer la réservation
                    </button>
                    <button
                      onClick={() => {
                        updateStatut(selectedReservation.id, 'CANCELLED');
                        setShowDetail(false);
                      }}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700"
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
