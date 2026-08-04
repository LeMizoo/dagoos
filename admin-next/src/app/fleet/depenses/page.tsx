'use client';
import { Activity } from 'lucide-react';

export default function Page() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">📊 En construction</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
        <Activity size={48} className="mx-auto mb-4 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-700 dark:text-white mb-2">Cette page sera bientôt disponible</h2>
        <p className="text-sm text-gray-500">Fonctionnalité en cours de développement.</p>
      </div>
    </div>
  );
}
