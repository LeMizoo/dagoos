'use client';
import { useState, useEffect } from 'react';
import { Search, MessageSquare, Send, Mail, MailOpen } from 'lucide-react';

interface Message { id: string; organization?: { name?: string; id?: string }; subject?: string; content?: string; read?: boolean; createdAt?: string; }

export default function FleetMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch('/api/proxy/messages').then(r => r.json()).then(d => setMessages(Array.isArray(d) ? d : [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const selectedMsg = messages.find(m => m.id === selected);

  async function handleSelect(id: string) {
    setSelected(id);
    const msg = messages.find(m => m.id === id);
    if (msg && !msg.read) {
      await fetch(`/api/proxy/messages/${id}/read`, { method: 'PUT' });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
    }
  }

  async function handleSend() {
    if (!reply.trim() || !selectedMsg) return;
    setSending(true);
    try {
      const res = await fetch(`/api/proxy/messages/${selectedMsg.id}/reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply: reply
        })
      });
      if (res.ok) {
        setReply('');
        const newMsg = await res.json();
        setMessages(prev => [newMsg, ...prev]);
      }
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  }

  const filtered = messages.filter(m =>
    (m.organization?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.subject || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">💬 Messages</h1>
      <div className="flex gap-4 h-[calc(100vh-220px)]">
        <div className="w-80 bg-white rounded-xl shadow-sm border flex flex-col flex-shrink-0">
          <div className="p-3 border-b"><div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 pr-3 py-2 border rounded-lg w-full text-sm" /></div></div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <div className="text-center py-8 text-gray-400">⏳ Chargement...</div> :
             filtered.length === 0 ? <div className="text-center py-8 text-gray-400">Aucun message</div> :
             filtered.map(m => (
              <div key={m.id} onClick={() => handleSelect(m.id)} className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${selected === m.id ? 'bg-blue-50 border-l-2 border-l-blue-500': ''}`}>
                <div className="flex items-center gap-2 mb-1">{m.read ? <MailOpen size={14} className="text-gray-400" /> : <Mail size={14} className="text-blue-500" />}<span className={`text-sm ${!m.read ? 'font-semibold' : ''}`}>{m.organization?.name || 'Inconnu'}</span></div>
                <div className="text-xs text-gray-500">{m.subject || 'Sans objet'}</div>
                <div className="text-xs text-gray-400 truncate mt-1">{m.content}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-white rounded-xl shadow-sm border flex flex-col">
          {selectedMsg ? (
            <>
              <div className="p-4 border-b"><h2 className="font-semibold">{selectedMsg.subject}</h2><p className="text-xs text-gray-500">De : {selectedMsg.organization?.name}</p></div>
              <div className="flex-1 p-4 overflow-y-auto"><p className="text-sm text-gray-700">{selectedMsg.content}</p></div>
              <div className="p-4 border-t flex gap-2">
                <input type="text" value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Votre réponse..." className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                <button onClick={handleSend} disabled={sending || !reply.trim()} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-blue-700 disabled:opacity-50"><Send size={14} /> {sending ? 'Envoi...' : 'Envoyer'}</button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400"><div className="text-center"><MessageSquare size={48} className="mx-auto mb-3 opacity-50" /><p>Sélectionnez un message</p></div></div>
          )}
        </div>
      </div>
    </div>
  );
}
