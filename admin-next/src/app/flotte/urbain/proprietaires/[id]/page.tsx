'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Car, Mail, Phone, User } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';

interface Vehicle {
  id: string;
  plate: string;
  model?: string | null;
  type?: string | null;
  status?: string | null;
  currentKm?: number | null;
}

interface Proprietaire {
  id: string;
  name: string;
  cin?: string | null;
  phone?: string | null;
  email?: string | null;
  organizationId: string;
  vehicles?: Vehicle[];
}

export default function ProprietaireDetailPage() {
  const params = useParams<{ id: string }>();
  const { organization } = useOrganization();
  const [proprietaire, setProprietaire] = useState<Proprietaire | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!organization?.id || !params.id) return;
    const organizationId = organization.id;

    async function load() {
      try {
        const response = await apiFetch('/proprietaires');
        const data = await response.json();
        const owners = Array.isArray(data) ? data : [];
        const owner = owners.find(
          (item: Proprietaire) =>
            item.id === params.id && item.organizationId === organizationId
        );

        if (!owner) {
          setError('Propriétaire introuvable');
          return;
        }

        setProprietaire(owner);
      } catch {
        setError('Erreur lors du chargement du propriétaire');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [organization?.id, params.id]);

  if (loading) {
    return <div className="py-12 text-center text-gray-400">Chargement...</div>;
  }

  if (error || !proprietaire) {
    return (
      <div className="space-y-4">
        <Link href="/flotte/urbain/proprietaires" className="inline-flex items-center gap-2 text-sm text-emerald-600">
          <ArrowLeft size={16} /> Retour aux propriétaires
        </Link>
        <div className="rounded-xl border bg-white p-6 text-sm text-red-600">{error || 'Propriétaire introuvable'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/flotte/urbain/proprietaires" className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:underline">
        <ArrowLeft size={16} /> Retour aux propriétaires
      </Link>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <User size={22} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{proprietaire.name}</h1>
            <p className="mt-1 text-sm text-gray-500">{proprietaire.cin || 'CIN non renseigné'}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
              {proprietaire.phone && <span className="inline-flex items-center gap-2"><Phone size={14} /> {proprietaire.phone}</span>}
              {proprietaire.email && <span className="inline-flex items-center gap-2"><Mail size={14} /> {proprietaire.email}</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="font-semibold text-gray-800">Véhicules ({proprietaire.vehicles?.length || 0})</h2>
        </div>
        {!proprietaire.vehicles?.length ? (
          <p className="p-6 text-sm text-gray-400">Aucun véhicule associé.</p>
        ) : (
          <div className="divide-y">
            {proprietaire.vehicles.map((vehicle) => (
              <div key={vehicle.id} className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3">
                  <Car size={20} className="text-emerald-600" />
                  <div>
                    <p className="font-medium text-gray-800">{vehicle.plate}</p>
                    <p className="text-sm text-gray-500">{vehicle.model || vehicle.type || 'Véhicule'}</p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{(vehicle.currentKm || 0).toLocaleString()} km</p>
                  <p className="capitalize">{vehicle.status || 'inactif'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
