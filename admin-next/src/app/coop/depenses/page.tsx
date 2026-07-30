'use client';
import { Plus, Search } from 'lucide-react';

export default function FleetDepensesPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🧾 Dépenses</h1>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition text-sm">
          <Plus size={16} /> Nouvelle dépense
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {['Aujourd\'hui', 'Cette semaine', 'Ce mois'].map((label, i) => (
          <div key={label} className="bg-white rounded-xl p-4 shadow-sm border text-center">
            <div className="text-2xl font-bold text-gray-800">-</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
        Dépenses détaillées bientôt disponibles
      </div>
    </div>
  );
}
