'use client';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { ArrowRightLeft, User, Car, X, Gauge, Tag } from 'lucide-react';

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

export default function FleetPermutationPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/drivers').then(r => r.json()).catch(() => []),
      apiFetch('/vehicles').then(r => r.json()).catch(() => []),
    ]).then(([d, v]) => {
      setDrivers(Array.isArray(d) ? d : []);
      setVehicles(Array.isArray(v) ? v : []);
    }).finally(() => setLoading(false));
  }, []);

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
      // Recharger les données
      const d = await apiFetch('/drivers').then(r => r.json());
      setDrivers(Array.isArray(d) ? d : []);
    } catch (e) { setMessage('❌ Erreur lors de l\'assignation'); }
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
      const d = await apiFetch('/drivers').then(r => r.json());
      setDrivers(Array.isArray(d) ? d : []);
    } catch (e) { setMessage('❌ Erreur'); }
  }

  if (loading) return <div className="text-center py-12 text-gray-400">⏳ Chargement...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">🔄 Permutation Véhicule</h1>

      {message && <div className={`p-4 rounded-lg mb-4 text-sm ${message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{message}</div>}

      {/* Assignation */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <h3 className="font-semibold text-gray-800 mb-4">Assigner un véhicule</h3>
        <div className="flex gap-4 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Chauffeur</label>
            <select value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">-- Chauffeur --</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.user?.name || d.driverCode}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-gray-500 mb-1">Véhicule</label>
            <select value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">-- Véhicule --</option>
              {vehicles.filter(v => v.status === 'active').map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
            </select>
          </div>
          <button onClick={handleAssign} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 transition flex items-center gap-2"><ArrowRightLeft size={16} /> Assigner</button>
        </div>
      </div>

      {/* Liste des assignations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b"><h3 className="font-semibold text-gray-800">📋 Assignations actuelles</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Chauffeur</th>
                <th className="px-4 py-3">Véhicule</th>
                <th className="px-4 py-3">Modèle</th>
                <th className="px-4 py-3">Kilométrage</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.filter(d => d.vehicleId).length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucune assignation</td></tr>
              ) : (
                drivers.filter(d => d.vehicleId).map(d => {
                  const v = vehicles.find(v => v.id === d.vehicleId);
                  return (
                    <tr key={d.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium flex items-center gap-1"><User size={14} className="text-gray-400" />{d.user?.name || d.driverCode}</td>
                      <td className="px-4 py-3 flex items-center gap-1"><Car size={14} className="text-gray-400" />{v?.plate || d.vehicleId}</td>
                      <td className="px-4 py-3">{v?.model || '-'}</td>
                      <td className="px-4 py-3">{(v?.currentKm || 0).toLocaleString()} km</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${v?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {v?.status === 'active' ? 'Actif' : v?.status || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleRetirer(d.id)} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-xs flex items-center gap-1"><X size={12} /> Retirer</button>
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
