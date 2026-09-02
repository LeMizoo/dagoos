'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import { 
  Bell, BellOff, CheckCircle, Clock, AlertCircle, 
  Info, AlertTriangle, CheckCheck, Search, XCircle,
  MessageSquare, Car, DollarSign, Users, Settings
} from 'lucide-react';

type NotificationFilter = 'all' | 'unread' | 'read';
type NotificationType = 'all' | 'info' | 'warning' | 'success' | 'error';

export default function FlotteNotifications() {
  const { organization } = useOrganization();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'type'>('date');

  const load = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      const res = await apiFetch('/notifications').then(r => r.ok ? r.json() : []);
      const allNotifications = Array.isArray(res) ? res : [];
      setNotifications(allNotifications.filter((n: any) => 
        n.organizationId === organization.id || n.userId === organization.id
      ));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMarkAsRead(id: string) {
    try {
      await apiFetch(`/notifications/${id}/read`, {
        method: 'PUT',
        body: JSON.stringify({ read: true })
      });
      load();
      window.dispatchEvent(new Event('dagoos:notification-read'));
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(n =>
          apiFetch(`/notifications/${n.id}/read`, {
            method: 'PUT',
            body: JSON.stringify({ read: true })
          })
        )
      );
      load();

      unreadNotifications.forEach(() => {
        window.dispatchEvent(new Event('dagoos:notification-read'));
      });
    } catch (e: any) {
      setError(e.message);
    }
  }

  const filteredNotifications = notifications
    .filter(n => {
      // Filtre par statut de lecture
      if (filter === 'unread' && n.read) return false;
      if (filter === 'read' && !n.read) return false;
      
      // Filtre par type
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      
      // Filtre par recherche
      if (search) {
        const searchLower = search.toLowerCase();
        const haystack = `${n.title || ''} ${n.message || ''}`.toLowerCase();
        if (!haystack.includes(searchLower)) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        const typeOrder: Record<string, number> = { error: 0, warning: 1, info: 2, success: 3 };
        return (typeOrder[a.type] || 9) - (typeOrder[b.type] || 9);
      }
    });

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    read: notifications.filter(n => n.read).length,
    info: notifications.filter(n => n.type === 'info').length,
    warning: notifications.filter(n => n.type === 'warning').length,
    success: notifications.filter(n => n.type === 'success').length,
    error: notifications.filter(n => n.type === 'error').length,
  };

  function getTypeIcon(type: string) {
    switch (type) {
      case 'info': return <Info size={18} className="text-blue-500" />;
      case 'warning': return <AlertTriangle size={18} className="text-yellow-500" />;
      case 'success': return <CheckCircle size={18} className="text-green-500" />;
      case 'error': return <XCircle size={18} className="text-red-500" />;
      default: return <Bell size={18} className="text-gray-400" />;
    }
  }

  function getTypeBadge(type: string) {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-700';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      case 'success': return 'bg-green-100 text-green-700';
      case 'error': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">🔔 Notifications</h1>
          <p className="text-sm text-gray-500">
            {stats.total} notifications · {stats.unread} non lues
          </p>
        </div>
        {stats.unread > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 hover:bg-emerald-700"
          >
            <CheckCheck size={18} /> Tout marquer comme lu
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {/* Statistiques par statut */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <StatBadge 
          icon={Bell} 
          label="Total" 
          value={stats.total} 
          color="gray" 
          active={filter === 'all' && typeFilter === 'all'} 
          onClick={() => { setFilter('all'); setTypeFilter('all'); }} 
        />
        <StatBadge 
          icon={Clock} 
          label="Non lues" 
          value={stats.unread} 
          color="blue" 
          active={filter === 'unread'} 
          onClick={() => setFilter('unread')} 
        />
        <StatBadge 
          icon={CheckCircle} 
          label="Lues" 
          value={stats.read} 
          color="green" 
          active={filter === 'read'} 
          onClick={() => setFilter('read')} 
        />
      </div>

      {/* Statistiques par type */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <TypeBadge 
          icon={Info} 
          label="Info" 
          value={stats.info} 
          color="blue" 
          active={typeFilter === 'info'} 
          onClick={() => setTypeFilter(typeFilter === 'info' ? 'all' : 'info')} 
        />
        <TypeBadge 
          icon={AlertTriangle} 
          label="Attention" 
          value={stats.warning} 
          color="yellow" 
          active={typeFilter === 'warning'} 
          onClick={() => setTypeFilter(typeFilter === 'warning' ? 'all' : 'warning')} 
        />
        <TypeBadge 
          icon={CheckCircle} 
          label="Succès" 
          value={stats.success} 
          color="green" 
          active={typeFilter === 'success'} 
          onClick={() => setTypeFilter(typeFilter === 'success' ? 'all' : 'success')} 
        />
        <TypeBadge 
          icon={XCircle} 
          label="Erreur" 
          value={stats.error} 
          color="red" 
          active={typeFilter === 'error'} 
          onClick={() => setTypeFilter(typeFilter === 'error' ? 'all' : 'error')} 
        />
      </div>

      {/* Barre de recherche et tri */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans les notifications..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'date' | 'type')}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="date">Trier par date</option>
            <option value="type">Trier par type</option>
          </select>
        </div>
      </div>

      {/* Liste des notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">
            📋 Notifications ({filteredNotifications.length})
          </h3>
        </div>
        <div className="divide-y">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Chargement...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <BellOff size={48} className="mx-auto mb-2 opacity-50" />
              Aucune notification
            </div>
          ) : (
            filteredNotifications.map(n => (
              <div
                key={n.id}
                className={`p-4 hover:bg-gray-50 transition ${
                  !n.read ? 'bg-emerald-50/50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getTypeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-sm ${!n.read ? 'font-semibold' : ''} text-gray-800 dark:text-white`}>
                        {n.title}
                      </h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getTypeBadge(n.type)}`}>
                        {n.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{n.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-400">
                        {new Date(n.createdAt).toLocaleDateString('fr-FR')} à {new Date(n.createdAt).toLocaleTimeString('fr-FR')}
                      </p>
                      {!n.read && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="text-xs text-emerald-600 hover:underline"
                        >
                          Marquer comme lu
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatBadge({ icon: Icon, label, value, color, active, onClick }: any) {
  const colors: any = {
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
  };
  
  return (
    <button
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-left transition ${
        active ? 'ring-2 ring-emerald-500' : 'hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <div className="text-xl font-bold text-gray-800 dark:text-white">{value}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
    </button>
  );
}

function TypeBadge({ icon: Icon, label, value, color, active, onClick }: any) {
  const colors: any = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
  };
  
  return (
    <button
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border text-left transition ${
        active ? 'ring-2 ring-emerald-500' : 'hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={16} />
        </div>
        <div>
          <div className="text-lg font-bold text-gray-800 dark:text-white">{value}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
    </button>
  );
}
