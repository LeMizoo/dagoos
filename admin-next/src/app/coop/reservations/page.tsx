'use client';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Users, Phone, CheckCircle, XCircle } from 'lucide-react';
import PlanVehicule from '@/components/coop/PlanVehicule';

export default function CoopReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedDepart, setSelectedDepart] = useState<any | null>(null);
  const [showPlan, setShowPlan] = useState(false);

  useEffect(() => { load(); }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      load();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    try {
      const r = await apiFetch('/reservations');
      if (r.ok) setReservations(await r.json());
      else setError('Erreur chargement');
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  async function updateStatut(id: string, statut: string) {
    await apiFetch(`/reservations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ statut }),
    });
    load();
  }

  const filtered = filter === 'all' ? reservations : reservations.filter((r: any) => r.statut === filter);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">🎫 Réservations</h1>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      <div className="flex gap-2 mb-4">
        {['all', 'CONFIRMED', 'PENDING', 'CANCELLED'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === f ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f === 'all' ? 'Toutes' : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Aucune réservation</div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Passager</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Trajet</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Place</th>
                <th className="px-4 py-3">Véhicule</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: any) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium flex items-center gap-2"><Users size={14} className="text-gray-400" /> {r.passagerNom}</td>
                  <td className="px-4 py-3 text-gray-500 flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {r.telephone}</td>
                  <td className="px-4 py-3 text-gray-500">{r.depart?.pointDepart} → {r.depart?.destination}</td>
                  <td className="px-4 py-3 text-gray-500">{r.depart?.date ? new Date(r.depart.date).toLocaleDateString('fr-FR') : '-'} {r.depart?.heure}</td>
                  <td className="px-4 py-3 font-bold">{r.place}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.statut === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                      r.statut === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{r.statut}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setSelectedDepart(r.depart); setShowPlan(true); }} className="text-blue-600 hover:underline text-xs">Voir plan</button>
                      {r.statut === 'CONFIRMED' ? (
                        <button onClick={() => updateStatut(r.id, 'CANCELLED')} className="text-red-600 hover:underline text-xs flex items-center gap-1"><XCircle size={12} /> Annuler</button>
                      ) : (
                        <button onClick={() => updateStatut(r.id, 'CONFIRMED')} className="text-green-600 hover:underline text-xs flex items-center gap-1"><CheckCircle size={12} /> Confirmer</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showPlan && selectedDepart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPlan(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Plan du véhicule</h3>
              <button onClick={() => setShowPlan(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <PlanVehicule
              placesTotal={selectedDepart.placesTotal || 25}
              placesReservees={(reservations.filter((r: any) => r.depart?.id === selectedDepart.id)).map((r: any) => r.place)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
