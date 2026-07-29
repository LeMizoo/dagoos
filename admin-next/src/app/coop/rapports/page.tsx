'use client';
import { FileText, Download, TrendingUp, Car, Users, DollarSign } from 'lucide-react';

export default function CoopRapportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📊 Rapports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: Car, title: 'Utilisation véhicules', desc: 'Kilométrage, courses, entretiens' },
          { icon: Users, title: 'Performance chauffeurs', desc: 'Courses effectuées, revenus générés' },
          { icon: DollarSign, title: 'Revenus mensuels', desc: 'Récapitulatif des revenus par mois' },
          { icon: TrendingUp, title: 'Tendances', desc: 'Évolution sur les 6 derniers mois' },
        ].map(r => (
          <div key={r.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0"><r.icon size={24} className="text-emerald-600" /></div>
            <div className="flex-1"><h3 className="font-semibold text-gray-800">{r.title}</h3><p className="text-sm text-gray-500 mt-1">{r.desc}</p></div>
            <button className="text-emerald-600 hover:bg-emerald-50 p-2 rounded-lg transition"><Download size={18} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
