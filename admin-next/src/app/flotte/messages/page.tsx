'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import { Mail, MailOpen, Send, Plus, Search, Inbox, CheckCircle, Clock } from 'lucide-react';

type MessageFilter = 'all' | 'unread' | 'read' | 'replied';

export default function FlotteMessages() {
  const { organization } = useOrganization();
  const [messages, setMessages] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<MessageFilter>('all');
  const [search, setSearch] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessage, setNewMessage] = useState({ subject: '', content: '' });

  const load = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      const res = await apiFetch('/messages').then(r => r.ok ? r.json() : []);
      const allMessages = Array.isArray(res) ? res : [];
      setMessages(allMessages.filter((m: any) => m.organizationId === organization.id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSelect(id: string) {
    setSelected(id);
    const message = messages.find(m => m.id === id);
    if (message && !message.read) {
      await apiFetch(`/messages/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ read: true })
      });
      load();
    }
  }

  async function handleSendReply() {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      await apiFetch(`/messages/${selected}`, {
        method: 'PUT',
        body: JSON.stringify({ reply: reply.trim(), replied: true })
      });
      setReply('');
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  async function handleCreateMessage() {
    if (!newMessage.subject.trim() || !newMessage.content.trim() || !organization?.id) return;
    setSending(true);
    try {
      const res = await apiFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({
          subject: newMessage.subject,
          content: newMessage.content,
          organizationId: organization.id,
          sender: 'Fleet Manager',
          type: 'question'
        })
      });
      
      if (res.ok) {
        setNewMessage({ subject: '', content: '' });
        setShowNewMessage(false);
        load();
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur lors de l\'envoi');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  const filteredMessages = messages.filter(m => {
    // Filtre par statut
    if (filter === 'unread' && m.read) return false;
    if (filter === 'read' && !m.read) return false;
    if (filter === 'replied' && !m.replied) return false;
    
    // Filtre par recherche
    if (search) {
      const searchLower = search.toLowerCase();
      const haystack = `${m.subject || ''} ${m.content || ''} ${m.organization?.name || ''}`.toLowerCase();
      if (!haystack.includes(searchLower)) return false;
    }
    
    return true;
  });

  const selectedMessage = messages.find(m => m.id === selected);

  const stats = {
    total: messages.length,
    unread: messages.filter(m => !m.read).length,
    read: messages.filter(m => m.read && !m.replied).length,
    replied: messages.filter(m => m.replied).length
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">💬 Messages</h1>
          <p className="text-sm text-gray-500">
            {stats.total} messages · {stats.unread} non lus
          </p>
        </div>
        <button
          onClick={() => setShowNewMessage(true)}
          className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 hover:bg-emerald-700"
        >
          <Plus size={18} /> Nouveau message
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatBadge icon={Inbox} label="Total" value={stats.total} color="gray" active={filter === 'all'} onClick={() => setFilter('all')} />
        <StatBadge icon={Mail} label="Non lus" value={stats.unread} color="blue" active={filter === 'unread'} onClick={() => setFilter('unread')} />
        <StatBadge icon={MailOpen} label="Lus" value={stats.read} color="yellow" active={filter === 'read'} onClick={() => setFilter('read')} />
        <StatBadge icon={CheckCircle} label="Répondu" value={stats.replied} color="green" active={filter === 'replied'} onClick={() => setFilter('replied')} />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des messages */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden lg:col-span-1">
            <div className="p-4 border-b space-y-3">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                📨 Messages ({filteredMessages.length})
              </h3>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-400">Aucun message</div>
              ) : (
                filteredMessages.map(m => (
                  <div
                    key={m.id}
                    onClick={() => handleSelect(m.id)}
                    className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition ${
                      selected === m.id ? 'bg-emerald-50 border-l-2 border-l-emerald-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {m.replied ? (
                        <CheckCircle size={14} className="text-green-500" />
                      ) : m.read ? (
                        <MailOpen size={14} className="text-gray-400" />
                      ) : (
                        <Mail size={14} className="text-emerald-500" />
                      )}
                      <span className={`text-sm flex-1 ${!m.read ? 'font-semibold' : ''}`}>
                        {m.subject}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate ml-6">{m.content}</p>
                    <div className="flex items-center justify-between ml-6 mt-1">
                      <p className="text-xs text-gray-400">
                        {new Date(m.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      {!m.read && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                          Nouveau
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Détail du message */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border lg:col-span-2">
            {selectedMessage ? (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                      {selectedMessage.subject}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedMessage.replied ? 'bg-green-100 text-green-700' :
                      selectedMessage.read ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {selectedMessage.replied ? 'Répondu' : selectedMessage.read ? 'Lu' : 'Non lu'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    De : {selectedMessage.organization?.name || 'Inconnu'} · 
                    {new Date(selectedMessage.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex-1 p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedMessage.content}
                  </p>
                  
                  {selectedMessage.reply && (
                    <div className="mt-4 p-4 bg-emerald-50 rounded-lg">
                      <p className="text-xs font-semibold text-emerald-700 mb-1">Votre réponse :</p>
                      <p className="text-sm text-emerald-900">{selectedMessage.reply}</p>
                    </div>
                  )}
                </div>
                {!selectedMessage.replied && (
                  <div className="p-4 border-t">
                    <textarea
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      placeholder="Votre réponse..."
                      className="w-full px-3 py-2 border rounded-lg text-sm min-h-[100px]"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={sending || !reply.trim()}
                      className="mt-2 bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Send size={14} /> {sending ? 'Envoi...' : 'Envoyer la réponse'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px] text-gray-400">
                Sélectionnez un message pour le lire
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal nouveau message */}
      {showNewMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">✉️ Nouveau message</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Sujet"
                value={newMessage.subject}
                onChange={e => setNewMessage({...newMessage, subject: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <textarea
                placeholder="Votre message..."
                value={newMessage.content}
                onChange={e => setNewMessage({...newMessage, content: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm min-h-[150px]"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowNewMessage(false)}
                className="flex-1 px-4 py-2 border rounded-lg text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateMessage}
                disabled={sending || !newMessage.subject.trim() || !newMessage.content.trim()}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                {sending ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBadge({ icon: Icon, label, value, color, active, onClick }: any) {
  const colors: any = {
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
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
