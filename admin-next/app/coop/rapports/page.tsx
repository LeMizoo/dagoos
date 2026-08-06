'use client';
import { FileText, Download } from 'lucide-react';

export default function FleetRapportsPage() {
  const rapports = [
    { icon: '🏍️', title: 'Export Véhicules', desc: 'Liste complète des véhicules' },
    { icon: '👥', title: 'Export Chauffeurs', desc: 'Liste complète des chauffeurs' },
    { icon: '💰', title: 'Export Finances', desc: 'Courses, CA, commissions' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📊 Rapports</h1>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {rapports.map(r => (
          <div key={r.title} className="bg-white rounded-xl p-6 shadow-sm border text-center hover:shadow-md transition cursor-pointer">
            <div className="text-4xl mb-3">{r.icon}</div>
            <h3 className="font-bold text-gray-800">{r.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{r.desc}</p>
            <button className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 mx-auto hover:bg-emerald-700">
              <Download size={14} /> Exporter
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
