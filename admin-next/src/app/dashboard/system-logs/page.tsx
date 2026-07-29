'use client';
import { useState, useEffect } from 'react';
import { Search, ScrollText, Download, LogIn, LogOut, Settings, AlertTriangle, User } from 'lucide-react';

interface Log {
  id: string;
  user?: string;
  action?: string;
  details?: string;
  ip?: string;
  level?: string;
  date?: string;
  createdAt?: string;
}

const actionIcons: Record<string, any> = {
  'Connexion': LogIn, 'connexion': LogIn, 'login': LogIn,
  'Déconnexion': LogOut, 'deconnexion': LogOut, 'logout': LogOut,
  'Création': User, 'creation': User, 'create': User,
  'Modification': Settings, 'modification': Settings, 'update': Settings,
  'Suppression': AlertTriangle, 'suppression': AlertTriangle, 'delete': AlertTriangle,
  'Erreur': AlertTriangle, 'erreur': AlertTriangle, 'error': AlertTriangle,
};

const levelColors: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('tous');

  useEffect(() => { fetchLogs(); }, []);

  async function fetchLogs() {
    try {
      setError('');
      const res = await fetch('/api/proxy/logs');
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError('Impossible de charger les logs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const levels = ['tous', 'info', 'warning', 'error'];

  const filtered = logs.filter(l => {
    const matchSearch = (l.user || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.details || '').toLowerCase().includes(search.toLowerCase());
    const matchLevel = levelFilter === 'tous' || l.level === levelFilter;
    return matchSearch && matchLevel;
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📜 Logs système</h1>
        <button className="text-sm text-gray-600 hover:text-primary flex items-center gap-1 transition">
          <Download size={16} /> Exporter
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3">
          <div className="flex gap-2 flex-wrap">
            {levels.map(l => (
              <button key={l} onClick={() => setLevelFilter(l)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${levelFilter === l ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="relative max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Rechercher..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Détails</th>
                <th className="px-4 py-3">IP</th>
                <th className="px-4 py-3">Niveau</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">⏳ Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucun log</td></tr>
              ) : (
                filtered.map(l => {
                  const ActionIcon = actionIcons[l.action || ''] || ScrollText;
                  const date = l.date || l.createdAt;
                  return (
                    <tr key={l.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-xs">{l.user || 'système'}</td>
                      <td className="px-4 py-3"><span className="flex items-center gap-1"><ActionIcon size={14} className="text-gray-400" /> {l.action || '-'}</span></td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{l.details || '-'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">{l.ip || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${levelColors[l.level || 'info'] || levelColors.info}`}>
                          {l.level || 'info'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {date ? new Date(date).toLocaleDateString('fr-FR') + ' ' + new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}
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
