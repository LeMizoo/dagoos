'use client';
export const dynamic = 'force-dynamic';
import { apiFetch } from "@/lib/api";
import { useState, useEffect } from 'react';
import { Bell, BellOff, UserPlus, CreditCard, Wrench, AlertCircle, CheckCheck } from 'lucide-react';

interface Notification {
  id: string;
  type?: string;
  title?: string;
  message?: string;
  read?: boolean;
  createdAt?: string;
}

const typeConfig: Record<string, { icon: any; color: string }> = {
  inscription: { icon: UserPlus, color: 'bg-blue-100 text-blue-600' },
  paiement: { icon: CreditCard, color: 'bg-green-100 text-green-600' },
  maintenance: { icon: Wrench, color: 'bg-yellow-100 text-yellow-600' },
  alerte: { icon: AlertCircle, color: 'bg-red-100 text-red-600' },
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('toutes');

  useEffect(() => { fetchNotifs(); }, []);

  async function fetchNotifs() {
    try {
      setError('');
      const res = await apiFetch('/api/proxy/notifications');
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setNotifs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError('Impossible de charger les notifications.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    for (const n of notifs.filter(n => !n.read)) {
      await fetch(`/api/proxy/notifications/${n.id}/read`, { method: 'PUT' });
    }
    setNotifs(notifs.map(n => ({ ...n, read: true })));
  }

  const types = ['toutes', 'inscription', 'paiement', 'maintenance', 'alerte'];
  const filtered = filter === 'toutes' ? notifs : notifs.filter(n => n.type === filter);
  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-800">🔔 Notifications</h1>
          {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount} non lues</span>}
        </div>
        <button onClick={markAllRead} className="text-sm text-gray-600 hover:text-primary flex items-center gap-1 transition">
          <CheckCheck size={16} /> Tout marquer comme lu
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b flex gap-2 flex-wrap">
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${filter === t ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="divide-y">
          {loading ? (
            <div className="text-center py-12 text-gray-400">⏳ Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <BellOff size={48} className="mx-auto mb-3 opacity-50" />
              <p>Aucune notification</p>
            </div>
          ) : (
            filtered.map(n => {
              const config = typeConfig[n.type || 'alerte'] || typeConfig.alerte;
              const Icon = config.icon;
              return (
                <div key={n.id} className={`p-4 flex items-start gap-3 hover:bg-gray-50 transition ${!n.read ? 'bg-blue-50/50' : ''}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className={`text-sm ${!n.read ? 'font-semibold' : ''}`}>{n.title || 'Notification'}</h3>
                      {!n.read && <span className="w-2 h-2 bg-primary rounded-full"></span>}
                    </div>
                    <p className="text-sm text-gray-500">{n.message || ''}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString('fr-FR') + ' à ' + new Date(n.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
