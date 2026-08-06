'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';

export default function FleetMissionsPage() {
  const { id } = useParams();
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/dashboard/flottes" className="hover:text-blue-600">Flottes</Link>
        <span>/</span>
        <Link href={`/dashboard/flottes/${id}`} className="hover:text-blue-600">Détail</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Missions</span>
      </div>
      <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
        <ClipboardList size={48} className="mx-auto mb-4 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Missions</h2>
        <p className="text-sm text-gray-500">Les missions de cette flotte seront affichées ici.</p>
        <p className="text-xs text-gray-400 mt-2">Données à synchroniser depuis l'API courses.</p>
      </div>
    </div>
  );
}
