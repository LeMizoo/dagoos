'use client';
import { useState, useEffect } from 'react';
import { Users, Car, DollarSign, Truck } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import Greeting from '@/components/dashboard/Greeting';

export default function CoopHome() {
  const [stats, setStats] = useState({ drivers: 0, vehicles: 0, livraisons: 0, revenus: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [driversRes, vehiclesRes, livraisonsRes] = await Promise.all([
          fetch('/api/proxy/drivers').then(r => r.json()).catch(() => []),
          fetch('/api/proxy/vehicles').then(r => r.json()).catch(() => []),
          fetch('/api/proxy/livraisons').then(r => r.json()).catch(() => []),
        ]);
        setStats({
          drivers: Array.isArray(driversRes) ? driversRes.length : 0,
          vehicles: Array.isArray(vehiclesRes) ? vehiclesRes.length : 0,
          livraisons: Array.isArray(livraisonsRes) ? livraisonsRes.length : 0,
          revenus: 0,
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
        <StatCard icon={Truck} label="Livraisons" value={loading ? 0 : stats.livraisons} color="yellow" />
        <StatCard icon={DollarSign} label="Revenus (Ar)" value={loading ? 0 : stats.revenus} color="red" />
      </div>
    </div>
  );
}
