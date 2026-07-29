export const dynamic = 'force-dynamic';
'use client';
import { useState, useEffect } from 'react';
import { Search, MessageSquare, Send, Mail, MailOpen, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  organization?: { name?: string };
  subject?: string;
  content?: string;
  type?: string;
  read?: boolean;
  createdAt?: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  useEffect(() => { fetchMessages(); }, []);

  async function fetchMessages() {
    try {
      setError('');
      const res = await fetch('/api/proxy/messages');
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError('Impossible de charger les messages.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = messages.filter(m =>
    m.organization?.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.subject?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedMsg = messages.find(m => m.id === selected);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">💬 Messages</h1>
      {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 text-sm">{error}</div>}

      <div className="flex gap-4 h-[calc(100vh-220px)]">
        <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col flex-shrink-0">
          <div className="p-3 border-b">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Rechercher..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 border rounded-lg w-full text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-400">⏳ Chargement...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-400">Aucun message</div>
            ) : (
              filtered.map(m => (
                <div key={m.id} onClick={() => setSelected(m.id)}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition ${selected === m.id ? 'bg-blue-50 border-l-2 border-l-primary' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {m.read ? <MailOpen size={14} className="text-gray-400" /> : <Mail size={14} className="text-primary" />}
                    <span className={`text-sm ${!m.read ? 'font-semibold' : ''}`}>{m.organization?.name || 'Inconnu'}</span>
                  </div>
                  <div className={`text-xs ${!m.read ? 'font-medium text-gray-800' : 'text-gray-500'}`}>{m.subject || 'Sans objet'}</div>
                  <div className="text-xs text-gray-400 mt-1 truncate">{m.content || ''}</div>
                  <div className="text-xs text-gray-400 mt-1">{m.createdAt ? new Date(m.createdAt).toLocaleDateString('fr-FR') : ''}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
          {selectedMsg ? (
            <>
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h2 className="font-semibold">{selectedMsg.subject || 'Sans objet'}</h2>
                  <p className="text-xs text-gray-500">De : {selectedMsg.organization?.name || 'Inconnu'} • {selectedMsg.createdAt ? new Date(selectedMsg.createdAt).toLocaleDateString('fr-FR') : ''}</p>
                </div>
                <button className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition"><Trash2 size={16} /></button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <p className="text-sm text-gray-700">{selectedMsg.content}</p>
              </div>
              <div className="p-4 border-t flex gap-2">
                <input type="text" value={reply} onChange={e => setReply(e.target.value)}
                  placeholder="Votre réponse..." className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent" />
                <button className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-800 transition text-sm">
                  <Send size={14} /> Envoyer
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
                <p>Sélectionnez un message</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
