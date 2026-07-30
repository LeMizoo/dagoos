'use client';
import { useState, useEffect } from 'react';
import { Building2, Users, Car, MessageSquare } from 'lucide-react';
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

  return (
    <div>
      <Greeting />
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon={Building2} label="Flottes" value={loading ? 0 : stats?.fleets || 0} color="blue" />
        <StatCard icon={Users} label="Coopératives" value={loading ? 0 : stats?.cooperatives || 0} color="green" />
        <StatCard icon={Users} label="Chauffeurs" value={loading ? 0 : stats?.drivers || 0} color="yellow" />
        <StatCard icon={Car} label="Véhicules" value={loading ? 0 : stats?.vehicles || 0} color="red" />
        <StatCard icon={MessageSquare} label="Messages non lus" value={loading ? 0 : stats?.messages || 0} color="purple" />
      </div>

      {stats?.recentOrgs && stats.recentOrgs.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Dernières inscriptions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Organisation</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Plan</th>
                  <th className="pb-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrgs.map((org: any) => (
                  <tr key={org.id} className="border-b last:border-0">
                    <td className="py-2">{org.name}</td>
                    <td className="py-2">{org.type === 'FLEET_MANAGER' ? '🚛 Flotte' : '🏢 Coop'}</td>
                    <td className="py-2">{org.plan}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        org.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {org.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
