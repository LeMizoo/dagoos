'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Truck, Users, Car, ClipboardList, Wrench, 
  AlertCircle, Pencil, ExternalLink, Building2
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string;
  plan: string;
  status: string;
  type: string;
  createdAt: string;
  _count?: { drivers: number; vehicles: number };
}

export default function FleetDetailPage() {
  const { id } = useParams();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchOrg();
  }, [id]);

  const fetchOrg = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/proxy/organizations/${id}`);
      if (!res.ok) throw new Error('Erreur ' + res.status);
      const data = await res.json();
      setOrg(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-400">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
        Chargement de la flotte...
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="p-12 text-center">
        <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Flotte introuvable</h2>
        <p className="text-sm text-gray-500 mb-4">{error || 'Cette flotte n\'existe pas ou a été supprimée.'}</p>
        <Link href="/dashboard/flottes" className="text-blue-600 hover:underline text-sm">
          ← Retour aux flottes
        </Link>
      </div>
    );
  }

  const subMenu = [
    { href: `/dashboard/flottes/${org.id}/vehicules`, icon: Car, label: 'Véhicules', desc: 'Gérer les véhicules' },
    { href: `/dashboard/flottes/${org.id}/chauffeurs`, icon: Users, label: 'Chauffeurs', desc: 'Gérer les chauffeurs' },
    { href: `/dashboard/flottes/${org.id}/missions`, icon: ClipboardList, label: 'Missions', desc: 'Suivre les missions' },
    { href: `/dashboard/flottes/${org.id}/entretien`, icon: Wrench, label: 'Entretien', desc: 'Maintenance des véhicules' },
  ];

  return (
    <div>
      {/* Fil d'Ariane */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/dashboard/flottes" className="hover:text-blue-600 transition-colors">Flottes</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium truncate">{org.name}</span>
      </div>

      {/* En-tête */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <Truck size={28} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
              <p className="text-sm text-gray-500">{org.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  org.plan === 'PREMIUM' ? 'bg-yellow-100 text-yellow-700' :
                  org.plan === 'STANDARD' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {org.plan || 'FREEMIUM'}
                </span>
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                  org.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${org.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                  {org.status || 'inactif'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/fleet/${org.slug || org.id}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              title="Voir la landing page"
            >
              <ExternalLink size={16} />
              Landing page
            </Link>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100">
          <QuickStat icon={Truck} label="Véhicules" value={org._count?.vehicles || 0} color="blue" />
          <QuickStat icon={Users} label="Chauffeurs" value={org._count?.drivers || 0} color="green" />
          <QuickStat icon={ClipboardList} label="Missions" value="-" color="yellow" />
          <QuickStat icon={Building2} label="Créée le" value={org.createdAt ? new Date(org.createdAt).toLocaleDateString('fr-FR') : '-'} color="purple" isDate />
        </div>
      </div>

      {/* Navigation vers les sous-pages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {subMenu.map(item => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                <Icon size={20} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">{item.label}</h3>
              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function QuickStat({ icon: Icon, label, value, color, isDate }: {
  icon: any; label: string; value: string | number; color: string; isDate?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
        <Icon size={18} />
      </div>
      <div>
        <div className={`text-lg font-bold text-gray-800 ${isDate ? 'text-xs' : ''}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}
