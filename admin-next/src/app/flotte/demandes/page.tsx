'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import { Search, Phone, CheckCircle, XCircle, Clock, Filter, Inbox } from 'lucide-react';

export default function FlotteDemandes() {
  const { organization } = useOrganization();
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('NEW');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      const r = await apiFetch('/actions');
      if (r.ok) {
        const data = await r.json();
        const allActions = Array.isArray(data) ? data : [];
        setActions(allActions.filter((a: any) => a.organizationId === organization.id));
      } else {
        setError('Erreur chargement');
      }
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
    const interval = setInterval(() => {
      load();
    }, 30000);
    return () => clearInterval(interval);
  }, [load]);

  async function updateStatut(id: string, statut: string) {
    try {
      const res = await apiFetch(`/actions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ statut }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || 'Erreur lors de la mise à jour de la demande');
        return;
      }

      load();
    } catch (e: any) {
      console.error('updateStatut:', e);
      alert(e.message || 'Erreur réseau lors de la mise à jour de la demande');
    }
  }

  const filtered = actions
    .filter(a => filter === 'all' || a.statut === filter)
    .filter(a => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      const haystack = `${a.clientNom || ''} ${a.clientTel || ''} ${a.type || ''}`.toLowerCase();
      return haystack.includes(searchLower);
    });

  const typeLabels: Record<string, string> = {
    COURSE_REQUEST: '🚗 Demande de course',
    TAXI_RESERVATION: '🚕 Réservation taxi',
    PASSENGER_RESERVATION: '🎫 Réservation passager',
    DELIVERY_REQUEST: '📦 Commande livraison',
    CARGO_RESERVATION: '🚛 Réservation marchandises',
    CAR_RENTAL: '🔑 Location voiture',
    CONTACT: '💬 Contact',
  };

  const stats = {
    total: actions.length,
    new: actions.filter(a => a.statut === 'NEW').length,
    inProgress: actions.filter(a => a.statut === 'IN_PROGRESS').length,
    accepted: actions.filter(a => a.statut === 'ACCEPTED').length,
    rejected: actions.filter(a => a.statut === 'REJECTED').length,
  };

  const filters = [
    { key: 'all', label: 'Toutes', count: stats.total },
    { key: 'NEW', label: 'Nouvelles', count: stats.new },
    { key: 'IN_PROGRESS', label: 'En cours', count: stats.inProgress },
    { key: 'ACCEPTED', label: 'Acceptées', count: stats.accepted },
    { key: 'REJECTED', label: 'Rejetées', count: stats.rejected },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">📋 Demandes clients</h1>
      <p className="text-sm text-gray-500 mb-6">{stats.total} demandes · {stats.new} nouvelles</p>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {/* Filtres */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === f.key ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par client, téléphone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Inbox size={48} className="mx-auto mb-2 opacity-50" />
          Aucune demande
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {typeLabels[a.type] || a.type}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" /> {a.clientNom} - {a.clientTel}
                  </p>
                  {a.details?.message && (
                    <p className="text-sm text-gray-600 mt-1 italic">"{a.details.message}"</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  a.statut === 'NEW' ? 'bg-blue-100 text-blue-700' :
                  a.statut === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                  a.statut === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {a.statut}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                {a.statut === 'NEW' && (
                  <>
                    <button onClick={() => updateStatut(a.id, 'IN_PROGRESS')} className="px-3 py-1.5 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 flex items-center gap-1">
                      <Clock size={12} /> Traiter
                    </button>
                    <button onClick={() => updateStatut(a.id, 'ACCEPTED')} className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1">
                      <CheckCircle size={12} /> Accepter
                    </button>
                    <button onClick={() => updateStatut(a.id, 'REJECTED')} className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1">
                      <XCircle size={12} /> Rejeter
                    </button>
                  </>
                )}
                {a.statut === 'IN_PROGRESS' && (
                  <>
                    <button onClick={() => updateStatut(a.id, 'ACCEPTED')} className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1">
                      <CheckCircle size={12} /> Accepter
                    </button>
                    <button onClick={() => updateStatut(a.id, 'REJECTED')} className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1">
                      <XCircle size={12} /> Rejeter
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
