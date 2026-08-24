'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import Link from 'next/link';
import { Plus, Search, Phone, Mail, User, Car } from 'lucide-react';

export default function UrbainProprietaires() {
  const { organization } = useOrganization();
  const [proprietaires, setProprietaires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      const r = await apiFetch('/proprietaires');
      if (r.ok) {
        const data = await r.json();
        const allProprietaires = Array.isArray(data) ? data : [];
        setProprietaires(allProprietaires.filter((p: any) => p.organizationId === organization.id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = proprietaires.filter(p => 
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.cin || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🏢 Propriétaires</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} propriétaire{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition text-sm">
          <Plus size={16} /> Nouveau propriétaire
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, CIN..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-400">Aucun propriétaire</div>
        ) : (
          filtered.map(p => (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User size={22} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">{p.name}</h3>
                  <p className="text-xs text-gray-500">{p.cin || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                {p.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} /> {p.phone}
                  </div>
                )}
                {p.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} /> {p.email}
                  </div>
                )}
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1 text-xs">
                    <Car size={14} /> {p._count?.vehicles || p.vehicles?.length || 0} véhicules
                  </span>
                </div>
              </div>
              <Link
                href={`/flotte/urbain/proprietaires/${p.id}`}
                className="block w-full text-center py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition"
              >
                Voir les véhicules →
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
