'use client';
import { Plus, Building2 } from 'lucide-react';

export default function CoopSocietesPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🏢 Sociétés</h1>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition text-sm">
          <Plus size={16} /> Nouvelle société
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
        Gestion des sociétés bientôt disponible
      </div>
    </div>
  );
}
