'use client';
import { useState, useEffect } from 'react';
import { Users, Car, DollarSign, MessageSquare } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import Greeting from '@/components/dashboard/Greeting';

export default function FleetHome() {
  const [stats, setStats] = useState({ drivers: 0, vehicles: 0, revenus: 0, messages: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [driversRes, vehiclesRes, messagesRes] = await Promise.all([
          fetch('/api/proxy/drivers').then(r => r.json()).catch(() => []),
          fetch('/api/proxy/vehicles').then(r => r.json()).catch(() => []),
          fetch('/api/proxy/messages').then(r => r.json()).catch(() => []),
        ]);
        setStats({
          drivers: Array.isArray(driversRes) ? driversRes.length : 0,
          vehicles: Array.isArray(vehiclesRes) ? vehiclesRes.length : 0,
          revenus: 0,
          messages: Array.isArray(messagesRes) ? messagesRes.length : 0,
        });
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <div>
      <Greeting />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Chauffeurs" value={loading ? 0 : stats.drivers} color="blue" />
        <StatCard icon={Car} label="Véhicules" value={loading ? 0 : stats.vehicles} color="green" />
        <StatCard icon={DollarSign} label="Revenus (Ar)" value={loading ? 0 : stats.revenus} color="yellow" />
        <StatCard icon={MessageSquare} label="Messages" value={loading ? 0 : stats.messages} color="red" />
      </div>
    </div>
  );
}
