'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, Users, Car, MessageSquare, Truck, DollarSign, ArrowRight } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import Greeting from '@/components/dashboard/Greeting';

interface Stats {
  fleets: number;
  cooperatives: number;
  drivers: number;
  vehicles: number;
  messages: number;
  recentOrgs: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => {
        if (!r.ok) throw new Error('Erreur ' + r.status);
        return r.json();
      })
      .then(data => setStats(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Accès rapides
  const quickLinks = [
    { 
      href: '/dashboard/flottes', 
      icon: Truck, 
      label: 'Flottes', 
      desc: 'Gérer les flottes et leurs ressources',
      color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' 
    },
    { 
      href: '/dashboard/cooperatives', 
      icon: Building2, 
      label: 'Coopératives', 
      desc: 'Gérer les coopératives et leurs membres',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
    },
    { 
      href: '/dashboard/finances', 
      icon: DollarSign, 
      label: 'Finances', 
      desc: 'Vue globale des transactions et abonnements',
      color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100' 
    },
  ];

  return (
    <div>
      <Greeting />
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 text-sm border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* Accès rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 group ${link.color}`}
            >
              <div className="w-12 h-12 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
                <Icon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{link.label}</h3>
                <p className="text-xs opacity-75 mt-0.5">{link.desc}</p>
              </div>
              <ArrowRight size={18} className="opacity-50 group-hover:translate-x-1 transition-transform shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Stats globales */}
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
        📊 Vue d'ensemble
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon={Truck} label="Flottes" value={loading ? 0 : stats?.fleets || 0} color="blue" />
        <StatCard icon={Building2} label="Coopératives" value={loading ? 0 : stats?.cooperatives || 0} color="green" />
        <StatCard icon={Users} label="Chauffeurs" value={loading ? 0 : stats?.drivers || 0} color="yellow" />
        <StatCard icon={Car} label="Véhicules" value={loading ? 0 : stats?.vehicles || 0} color="red" />
        <StatCard icon={MessageSquare} label="Messages non lus" value={loading ? 0 : stats?.messages || 0} color="purple" />
      </div>

      {/* Dernières inscriptions */}
      {stats?.recentOrgs && stats.recentOrgs.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">📋 Dernières inscriptions</h2>
            <Link href="/dashboard/flottes" className="text-xs text-blue-600 hover:underline">
              Voir toutes les flottes →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Organisation</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Plan</th>
                  <th className="pb-2 font-medium">Statut</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrgs.map((org: any) => (
                  <tr key={org.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 font-medium text-gray-800">{org.name}</td>
                    <td className="py-2.5">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        org.type === 'FLEET_MANAGER' 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {org.type === 'FLEET_MANAGER' ? '🚛 Flotte' : '🏢 Coop'}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 capitalize">
                        {org.plan || 'Freemium'}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        org.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {org.status}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <Link
                        href={org.type === 'FLEET_MANAGER' ? `/dashboard/flottes` : `/dashboard/cooperatives`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Gérer →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Message si vide */}
      {!loading && (!stats?.recentOrgs || stats.recentOrgs.length === 0) && (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="text-4xl mb-3">🚀</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Aucune organisation pour le moment</h3>
          <p className="text-sm text-gray-500">Les nouvelles flottes et coopératives apparaîtront ici.</p>
        </div>
      )}
    </div>
  );
}
