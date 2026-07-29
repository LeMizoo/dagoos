import { Building2, Users, Car } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import Greeting from '@/components/dashboard/Greeting';

interface Org {
  id: string;
  name: string;
  type: string;
  plan: string;
  status: string;
}

async function getStats() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:5001'}/api/dashboard/stats`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div>
      <Greeting />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Building2} label="Flottes" value={stats?.fleets || 0} color="blue" />
        <StatCard icon={Users} label="Coopératives" value={stats?.cooperatives || 0} color="green" />
        <StatCard icon={Users} label="Chauffeurs" value={stats?.drivers || 0} color="yellow" />
        <StatCard icon={Car} label="Véhicules" value={stats?.vehicles || 0} color="red" />
      </div>
      {stats?.recentOrgs && stats.recentOrgs.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Dernières inscriptions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-gray-500"><th className="pb-2">Organisation</th><th className="pb-2">Type</th><th className="pb-2">Plan</th><th className="pb-2">Statut</th></tr></thead>
              <tbody>
                {stats.recentOrgs.map((org: Org) => (
                  <tr key={org.id} className="border-b last:border-0">
                    <td className="py-2">{org.name}</td><td className="py-2">{org.type}</td><td className="py-2">{org.plan}</td>
                    <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-xs ${org.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{org.status}</span></td>
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
