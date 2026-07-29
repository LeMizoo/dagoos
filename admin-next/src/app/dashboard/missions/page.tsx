'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, ClipboardList, MapPin, User, Car, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Mission {
  id: string;
  driver?: { name?: string };
  vehicle?: { plate?: string };
  departure?: string;
  arrival?: string;
  status?: string;
  date?: string;
  price?: number;
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  en_cours: { icon: Clock, color: 'bg-blue-100 text-blue-700', label: 'En cours' },
  terminee: { icon: CheckCircle, color: 'bg-green-100 text-green-700', label: 'Terminée' },
  annulee: { icon: XCircle, color: 'bg-red-100 text-red-700', label: 'Annulée' },
  en_attente: { icon: ClipboardList, color: 'bg-yellow-100 text-yellow-700', label: 'En attente' },
};

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchMissions(); }, []);

  async function fetchMissions() {
    try {
      setError('');
      const res = await fetch('/api/proxy/livraisons');
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setMissions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError('Impossible de charger les missions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = missions.filter(m =>
    m.driver?.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.vehicle?.plate?.toLowerCase().includes(search.toLowerCase()) ||
    m.departure?.toLowerCase().includes(search.toLowerCase()) ||
    m.arrival?.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    en_cours: missions.filter(m => m.status === 'en_cours').length,
    terminee: missions.filter(m => m.status === 'terminee').length,
    annulee: missions.filter(m => m.status === 'annulee').length,
    en_attente: missions.filter(m => m.status === 'en_attente' || !m.status).length,
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📋 Missions</h1>
        <button className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-800 transition text-sm">
          <Plus size={16} /> Nouvelle mission
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(statusConfig).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <div key={key} className="bg-white rounded-xl p-4 shadow-sm border">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <div className="text-lg font-bold">{loading ? '-' : counts[key as keyof typeof counts]}</div>
                  <div className="text-xs text-gray-500">{config.label}</div>
                </div>
              </div>
            </div>
          );
        })}
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
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Chauffeur</th>
                <th className="px-4 py-3">Véhicule</th>
                <th className="px-4 py-3">Départ</th>
                <th className="px-4 py-3">Arrivée</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">⏳ Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucune mission</td></tr>
              ) : (
                filtered.map(m => {
                  const status = statusConfig[m.status || 'en_attente'] || statusConfig.en_attente;
                  const StatusIcon = status.icon;
                  return (
                    <tr key={m.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-primary text-xs">{m.id?.slice(0, 8)}</td>
                      <td className="px-4 py-3 flex items-center gap-1"><User size={14} className="text-gray-400" /> {m.driver?.name || '-'}</td>
                      <td className="px-4 py-3 flex items-center gap-1"><Car size={14} className="text-gray-400" /> {m.vehicle?.plate || '-'}</td>
                      <td className="px-4 py-3 flex items-center gap-1"><MapPin size={14} className="text-gray-400" /> {m.departure || '-'}</td>
                      <td className="px-4 py-3 flex items-center gap-1"><MapPin size={14} className="text-gray-400" /> {m.arrival || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{m.date ? new Date(m.date).toLocaleDateString('fr-FR') : '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 w-fit ${status.color}`}>
                          <StatusIcon size={12} /> {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
