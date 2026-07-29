'use client';
import { Users, Car, DollarSign, Truck } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';

export default function CoopHome() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📊 Tableau de bord Coopérative</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Chauffeurs" value={0} color="blue" />
        <StatCard icon={Car} label="Véhicules" value={0} color="green" />
        <StatCard icon={Truck} label="Livraisons" value={0} color="yellow" />
        <StatCard icon={DollarSign} label="Revenus (Ar)" value={0} color="red" />
      </div>
    </div>
  );
}
