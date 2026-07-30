'use client';
import { useState, useEffect } from 'react';
import { QrCode, RefreshCw } from 'lucide-react';

export default function FleetCodesPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/proxy/drivers')
      .then(r => r.json()).then(d => setDrivers(Array.isArray(d) ? d : []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🔑 Codes d&apos;accès chauffeurs</h1>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition text-sm">
          <RefreshCw size={16} /> Renouveler tous les codes
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr><th className="px-4 py-3">Nom</th><th className="px-4 py-3">Code</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Actions</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={4} className="text-center py-8 text-gray-400">Chargement...</td></tr> :
               drivers.length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-gray-400">Aucun chauffeur</td></tr> :
               drivers.map((d: any) => (
                <tr key={d.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{d.user?.name || d.driverCode}</td>
                  <td className="px-4 py-3"><code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{d.driverCode}</code></td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Actif</span></td>
                  <td className="px-4 py-3"><button className="text-emerald-600 hover:underline text-xs">Nouveau code</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
