'use client';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';

export default function FleetProprietairesPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🏢 Propriétaires</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition text-sm">
          <Plus size={16} /> Nouveau propriétaire
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
        Gestion des propriétaires bientôt disponible
      </div>
    </div>
  );
}
