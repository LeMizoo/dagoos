'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import { Car, Plus, Search, CheckCircle, Wrench, Truck } from 'lucide-react';

const VEHICLE_TYPES: Record<string, Record<string, string>> = {
  FLEET_MANAGER: {
    MOTO: '🏍️ Taxi Moto',
    VOITURE: '🚗 Taxi',
    BUS: '🚌 Bus',
    MINIVAN: '🚐 Mini Van',
    TRICYCLE: '🛺 Tricycle'
  },
  COOPERATIVE: {
    VOITURE: '📦 Livraison',
    BUS: '🚌 Transport en commun',
    MINIVAN: '🚛 Transport de marchandises',
    VOITURE_LOCATION: '🔑 Voiture de location'
  }
};

export default function FlotteVehicules() {
  const { organization } = useOrganization();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const isUrbain = organization?.type === 'FLEET_MANAGER';
  const vehicleTypes = VEHICLE_TYPES[organization?.type || 'FLEET_MANAGER'] || VEHICLE_TYPES.FLEET_MANAGER;
  const defaultType = isUrbain ? 'VOITURE' : 'VOITURE';
  
  const [form, setForm] = useState({
    plate: '',
    model: '',
    type: defaultType,
    year: new Date().getFullYear(),
    currentKm: 0
  });

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/vehicles?page=1&limit=100').then(r => r.json());
      const allVehicles = Array.isArray(res) ? res : [];
      const orgId = organization?.id;
      setVehicles(orgId ? allVehicles.filter((v: any) => v.organizationId === orgId) : allVehicles);
    } catch {
      // Silencieux
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    if (organization?.id) {
      load();
    }
  }, [organization, load]);

  useEffect(() => {
    setForm(prev => ({ ...prev, type: defaultType }));
  }, [defaultType]);

  async function handleAdd() {
    if (!form.plate) {
      alert('⚠️ Veuillez saisir la plaque d\'immatriculation');
      return;
    }
    if (!organization?.id) return;
    setSaving(true);
    try {
      const res = await apiFetch('/vehicles', {
        method: 'POST',
        body: JSON.stringify({ ...form, organizationId: organization.id })
      });
      if (res.ok) {
        setModalOpen(false);
        setForm({ plate: '', model: '', type: defaultType, year: new Date().getFullYear(), currentKm: 0 });
        load();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  const filtered = vehicles.filter((v: any) => 
    ((v.plate || '') + ' ' + (v.model || '')).toLowerCase().includes(search.toLowerCase()) &&
    (typeFilter === 'all' || v.type === typeFilter)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🚗 Véhicules</h1>
          <p className="text-sm text-gray-500">{vehicles.length} véhicules</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 hover:bg-emerald-700"
        >
          <Plus size={18} /> Ajouter
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard icon={Car} label="Total" value={vehicles.length} color="emerald" />
        <StatCard icon={CheckCircle} label="Actifs" value={vehicles.filter(v => v.status === 'active').length} color="green" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Tous types</option>
            {Object.entries(vehicleTypes).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Plaque</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Modèle</th>
                <th className="px-4 py-3 text-left">Année</th>
                <th className="px-4 py-3 text-left">Kilométrage</th>
                <th className="px-4 py-3 text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8">Aucun véhicule</td></tr>
              ) : (
                filtered.map(v => (
                  <tr key={v.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{v.plate}</td>
                    <td className="px-4 py-3">{vehicleTypes[v.type] || v.type || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{v.model || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{v.year || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{(v.currentKm || 0).toLocaleString()} km</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        v.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {v.status || 'inactif'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Ajouter un véhicule</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Plaque d'immatriculation *</label>
                <input
                  type="text"
                  placeholder="Ex: 5432 TBF"
                  value={form.plate}
                  onChange={e => setForm({...form, plate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Modèle du véhicule</label>
                <input
                  type="text"
                  placeholder="Ex: Mitsubishi Lancer"
                  value={form.model}
                  onChange={e => setForm({...form, model: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Type de véhicule *</label>
                <select
                  value={form.type}
                  onChange={e => setForm({...form, type: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  {Object.entries(vehicleTypes).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Année de mise en circulation</label>
                <input
                  type="number"
                  placeholder="Ex: 2020"
                  value={form.year}
                  onChange={e => setForm({...form, year: parseInt(e.target.value) || new Date().getFullYear()})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  min="1950"
                  max={new Date().getFullYear() + 1}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Kilométrage actuel (km)</label>
                <input
                  type="number"
                  placeholder="Ex: 75000"
                  value={form.currentKm}
                  onChange={e => setForm({...form, currentKm: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  min="0"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-2 border rounded-lg text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Ajout...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colors: any = {
    emerald: 'bg-emerald-100 text-emerald-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600'
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}
