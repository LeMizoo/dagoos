'use client';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Search, Phone, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function CoopDemandesPage() {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('NEW');

  useEffect(() => { load(); }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      load();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    try {
      const r = await apiFetch('/actions');
      if (r.ok) setActions(await r.json());
      else setError('Erreur chargement');
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  async function updateStatut(id: string, statut: string) {
    await apiFetch(`/actions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ statut }),
    });
    load();
  }

  const filtered = filter === 'all' ? actions : actions.filter((a: any) => a.statut === filter);

  const typeLabels: Record<string, string> = {
    COURSE_REQUEST: '🚗 Demande de course',
    TAXI_RESERVATION: '🚕 Réservation taxi',
    PASSENGER_RESERVATION: '🎫 Réservation passager',
    DELIVERY_REQUEST: '📦 Commande livraison',
    CARGO_RESERVATION: '🚛 Réservation marchandises',
    CAR_RENTAL: '🔑 Location voiture',
    CONTACT: '💬 Contact',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">📋 Demandes clients</h1>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'NEW', 'IN_PROGRESS', 'ACCEPTED', 'REJECTED'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === f ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f === 'all' ? 'Toutes' : f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Aucune demande</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((a: any) => (
            <div key={a.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">{typeLabels[a.type] || a.type}</h3>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" /> {a.clientNom} - {a.clientTel}
                  </p>
                  {a.details?.message && <p className="text-sm text-gray-600 mt-1 italic">"{a.details.message}"</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  a.statut === 'NEW' ? 'bg-blue-100 text-blue-700' :
                  a.statut === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                  a.statut === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{a.statut}</span>
              </div>
              <div className="flex gap-2 mt-3">
                {a.statut === 'NEW' && (
                  <>
                    <button onClick={() => updateStatut(a.id, 'IN_PROGRESS')} className="px-3 py-1.5 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 flex items-center gap-1"><Clock size={12} /> Traiter</button>
                    <button onClick={() => updateStatut(a.id, 'ACCEPTED')} className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1"><CheckCircle size={12} /> Accepter</button>
                    <button onClick={() => updateStatut(a.id, 'REJECTED')} className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1"><XCircle size={12} /> Rejeter</button>
                  </>
                )}
                {a.statut === 'IN_PROGRESS' && (
                  <>
                    <button onClick={() => updateStatut(a.id, 'ACCEPTED')} className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1"><CheckCircle size={12} /> Accepter</button>
                    <button onClick={() => updateStatut(a.id, 'REJECTED')} className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1"><XCircle size={12} /> Rejeter</button>
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
