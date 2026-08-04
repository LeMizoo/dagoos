'use client';
import { useState, useEffect } from 'react';
import { QrCode, RefreshCw, Key, Eye, EyeOff, Copy, Check } from 'lucide-react';

export default function FleetCodesPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPin, setShowPin] = useState<Record<string, boolean>>({});
  const [editingPin, setEditingPin] = useState<string | null>(null);
  const [newPin, setNewPin] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { loadDrivers(); }, []);

  async function loadDrivers() {
    try {
      const r = await fetch('/api/proxy/drivers');
      const d = await r.json();
      setDrivers(Array.isArray(d) ? d : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  async function renewPin(driverId: string) {
    const pin = prompt('Nouveau PIN (4 chiffres) :');
    if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
      alert('Le PIN doit être composé de 4 chiffres');
      return;
    }
    try {
      const r = await fetch(`/api/proxy/drivers/${driverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (r.ok) {
        alert('✅ PIN mis à jour !');
        loadDrivers();
      } else {
        const err = await r.json();
        alert('❌ ' + (err.error || 'Erreur'));
      }
    } catch (e) {
      alert('❌ Erreur réseau');
    }
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🔑 Codes d'accès chauffeurs</h1>
          <p className="text-sm text-gray-500 mt-1">{drivers.length} chauffeurs</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition text-sm">
          <RefreshCw size={16} /> Renouveler tous les PIN
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left">Chauffeur</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">PIN</th>
                <th className="px-4 py-3 text-left">Véhicule</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Chargement...</td></tr>
              ) : drivers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucun chauffeur</td></tr>
              ) : (
                drivers.map(d => (
                  <tr key={d.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                      {d.user?.name || `${d.firstName || ''} ${d.lastName || ''}` || 'Sans nom'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono">{d.driverCode}</code>
                        <button onClick={() => copyCode(d.driverCode)} className="text-gray-400 hover:text-blue-600">
                          {copied === d.driverCode ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono">
                          {showPin[d.id] ? (d.pin || '****') : '****'}
                        </code>
                        <button onClick={() => setShowPin({ ...showPin, [d.id]: !showPin[d.id] })} className="text-gray-400 hover:text-blue-600">
                          {showPin[d.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{d.vehicle?.plate || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${d.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'}`}>
                        {d.status || 'inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => renewPin(d.id)} className="text-blue-600 hover:underline text-xs flex items-center gap-1 ml-auto">
                        <Key size={12} /> Nouveau PIN
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
