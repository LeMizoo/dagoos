'use client';
import { useState, useEffect } from 'react';

export default function FleetVersementsPage() {
  const [versements, setVersements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/proxy/finances/versements')
      .then(r => r.json()).then(d => setVersements(Array.isArray(d) ? d : []))
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  const total = versements.reduce((s: number, v: any) => s + (v.net || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">💵 Versements</h1>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'CA brut total', value: total.toLocaleString() + ' Ar', color: 'green' },
          { label: 'Commissions', value: '0 Ar', color: 'red' },
          { label: 'Net à verser', value: total.toLocaleString() + ' Ar', color: 'emerald' },
          { label: 'Chauffeurs actifs', value: versements.length.toString(), color: 'yellow' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border text-center">
            <div className="text-lg font-bold text-gray-800">{loading ? '-' : s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Chauffeur</th><th className="px-4 py-3">Courses</th><th className="px-4 py-3">CA brut</th><th className="px-4 py-3">Commission</th><th className="px-4 py-3">Net</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">Chargement...</td></tr> :
               versements.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucun versement</td></tr> :
               versements.map((v: any) => (
                <tr key={v.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3"><code className="bg-gray-100 px-2 py-1 rounded text-xs">{v.driverCode || '-'}</code></td>
                  <td className="px-4 py-3">{v.driver?.name || '-'}</td>
                  <td className="px-4 py-3">{v.courses || 0}</td>
                  <td className="px-4 py-3">{(v.caBrut || 0).toLocaleString()} Ar</td>
                  <td className="px-4 py-3 text-red-600">{(v.commission || 0).toLocaleString()} Ar</td>
                  <td className="px-4 py-3 font-medium">{(v.net || 0).toLocaleString()} Ar</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
