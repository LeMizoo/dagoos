'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FileCheck } from 'lucide-react';

export default function CoopContratsPage() {
  const { id } = useParams();
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/dashboard/cooperatives" className="hover:text-emerald-600">Coopératives</Link>
        <span>/</span>
        <Link href={`/dashboard/cooperatives/${id}`} className="hover:text-emerald-600">Détail</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Contrats</span>
      </div>
      <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
        <FileCheck size={48} className="mx-auto mb-4 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Contrats</h2>
        <p className="text-sm text-gray-500">Les contrats de cette coopérative seront affichés ici.</p>
      </div>
    </div>
  );
}
