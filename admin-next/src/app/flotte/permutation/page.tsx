'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import { ArrowRightLeft, User, Car, X, Gauge, Tag, CheckCircle } from 'lucide-react';

interface Driver {
  id: string;
  driverCode: string;
  user?: { name?: string };
  vehicleId?: string;
}

interface Vehicle {
  id: string;
  plate: string;
  model?: string;
  currentKm?: number;
  status?: string;
}

export default function FlottePermutation() {
  const { organization } = useOrganization();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      const [dRes, vRes] = await Promise.all([
        apiFetch('/drivers').then(r => r.json()).catch(() => []),
        apiFetch('/vehicles?page=1&limit=100').then(r => r.json()).catch(() => []),
      ]);
      
      const allDrivers = Array.isArray(dRes) ? dRes : [];
      const allVehicles = Array.isArray(vRes) ? vRes : [];
      
      setDrivers(allDrivers.filter((d: any) => d.organizationId === organization.id));
      setVehicles(allVehicles.filter((v: any) => v.organizationId === organization.id));
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAssign() {
    if (!selectedDriver || !selectedVehicle) return;
    try {
      const res = await apiFetch(`/drivers/${selectedDriver}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: selectedVehicle }),
      });
      if (!res.ok) throw new Error('Erreur');
      setMessage('✅ Véhicule assigné avec succès !');
      setTimeout(() => setMessage(''), 3000);
      setSelectedVehicle('');
      loadData();
    } catch (e) {
      setMessage('❌ Erreur lors de l\'assignation');
    }
  }

  async function handleRetirer(driverId: string) {
    try {
      await apiFetch(`/drivers/${driverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId: null }),
      });
      setMessage('✅ Véhicule retiré !');
      setTimeout(() => setMessage(''), 3000);
      loadData();
    } catch (e) {
      setMessage('❌ Erreur');
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">⏳ Chargement...</div>;

  const assignedDrivers = drivers.filter(d => d.vehicleId);
  const unassignedDrivers = drivers.filter(d => !d.vehicleId);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">🔄 Permutation Véhicule</h1>

      {message && (
        <div className={`p-4 rounded-lg mb-4 text-sm flex items-center gap-2 ${
          message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
        }`}>
          <CheckCircle size={16} /> {message}
        </div>
      )}

      {/* Assignation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border mb-6">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Assigner un véhicule</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Chauffeur</label>
            <select
              value={selectedDriver}
              onChange={e => setSelectedDriver(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Sélectionner un chauffeur</option>
              {unassignedDrivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.user?.name || d.driverCode} ({d.driverCode})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Véhicule</label>
            <select
              value={selectedVehicle}
              onChange={e => setSelectedVehicle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Sélectionner un véhicule</option>
              {vehicles.filter(v => v.status === 'active').map(v => (
                <option key={v.id} value={v.id}>
                  {v.plate} - {v.model || 'Sans modèle'}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleAssign}
          disabled={!selectedDriver || !selectedVehicle}
          className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 text-sm disabled:opacity-50"
        >
          <ArrowRightLeft size={16} /> Assigner
        </button>
      </div>

      {/* Liste des assignations */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800 dark:text-white">
            📋 Assignations actuelles ({assignedDrivers.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Chauffeur</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Véhicule</th>
                <th className="px-4 py-3">Km</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {assignedDrivers.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucune assignation</td></tr>
              ) : (
                assignedDrivers.map(d => {
                  const vehicle = vehicles.find(v => v.id === d.vehicleId);
                  return (
                    <tr key={d.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        <span className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          {d.user?.name || 'Sans nom'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{d.driverCode}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          <Car size={14} className="text-gray-400" />
                          {vehicle?.plate || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Gauge size={14} />
                          {vehicle?.currentKm?.toLocaleString() || 0} km
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRetirer(d.id)}
                          className="text-xs text-red-600 hover:underline flex items-center gap-1"
                        >
                          <X size={12} /> Retirer
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
