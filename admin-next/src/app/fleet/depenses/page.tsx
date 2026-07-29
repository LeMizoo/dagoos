'use client';
import { DollarSign } from 'lucide-react';

export default function DepensesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📉 Dépenses</h1>
      <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center text-gray-400">
        <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
        <p>Page en cours de développement</p>
      </div>
    </div>
  );
}
