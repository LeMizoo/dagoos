import { apiFetch } from '@/lib/api';
'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Car, Users, Mail, Phone, MapPin } from 'lucide-react';

export default function ProprietaireDetailPage() {
  const { id } = useParams();
  const [proprietaire, setProprietaire] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [id]);

  async function load() {
    try {
      const r = await apiFetch(`/proxy/proprietaires/${id}`);
      if (r.ok) setProprietaire(await r.json());
    } catch(e) { console.error(e); } finally { setLoading(false); }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;
  if (!proprietaire) return <div className="p-8 text-center text-gray-400">Propriétaire introuvable</div>;

  return (
    <div>
      <Link href="/fleet/proprietaires" className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-4">
        <ArrowLeft size={16} /> Retour aux propriétaires
      </Link>

      {/* Infos propriétaire */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <User size={28} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{proprietaire.name}</h1>
            <p className="text-sm text-gray-500">{proprietaire.cin || 'N/A'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          {proprietaire.phone && <span className="flex items-center gap-1"><Phone size={14} /> {proprietaire.phone}</span>}
          {proprietaire.email && <span className="flex items-center gap-1"><Mail size={14} /> {proprietaire.email}</span>}
          {proprietaire.address && <span className="flex items-center gap-1"><MapPin size={14} /> {proprietaire.address}</span>}
        </div>
      </div>

      {/* Véhicules du propriétaire */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Car size={20} className="text-blue-600" /> Véhicules ({(proprietaire.vehicles || []).length})
        </h2>
        {(proprietaire.vehicles || []).length === 0 ? (
          <p className="text-sm text-gray-400">Aucun véhicule</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {proprietaire.vehicles.map((v: any) => (
              <div key={v.id} className="border dark:border-gray-600 rounded-lg p-4">
                <div className="font-medium text-gray-800 dark:text-white">{v.plate}</div>
                <div className="text-sm text-gray-500">{v.model || 'N/A'} {v.year || ''}</div>
                <div className="text-xs text-gray-400 mt-1">{v.currentKm?.toLocaleString()} km</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chauffeurs du propriétaire (via véhicules) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <Users size={20} className="text-blue-600" /> Chauffeurs
        </h2>
        <p className="text-sm text-gray-400">Chauffeurs assignés aux véhicules de ce propriétaire.</p>
      </div>
    </div>
  );
}
