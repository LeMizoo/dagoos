'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import { Wrench, Plus, Search, Car, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: string;
  description?: string;
  km: number;
  cost: number;
  date: string;
  nextKm?: number;
  vehicle?: { plate?: string; model?: string };
}

export default function UrbainMaintenance() {
  const { organization } = useOrganization();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    vehicleId: '',
    type: 'vidange',
    description: '',
    km: 0,
    cost: 0,
    nextKm: 0,
  });

  const load = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      const [mRes, vRes] = await Promise.all([
        apiFetch('/maintenance').then(r => r.ok ? r.json() : []),
        apiFetch('/vehicles').then(r => r.ok ? r.json() : []),
      ]);
      
      const allRecords = Array.isArray(mRes) ? mRes : [];
      const allVehicles = Array.isArray(vRes) ? vRes : [];
      const orgVehicles = allVehicles.filter((v: any) => v.organizationId === organization.id);
      
      setVehicles(orgVehicles);
      setRecords(allRecords.filter((m: any) => 
        orgVehicles.some((v: any) => v.id === m.vehicleId)
      ));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdd() {
    if (!form.vehicleId || !form.km) return;
    
    try {
      const res = await apiFetch('/maintenance', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          km: Number(form.km),
          cost: Number(form.cost),
          nextKm: Number(form.nextKm) || null,
          date: new Date().toISOString(),
        }),
      });
      
      if (res.ok) {
        setShowForm(false);
        setForm({ vehicleId: '', type: 'vidange', description: '', km: 0, cost: 0, nextKm: 0 });
        load();
      } else {
        const err = await res.json();
        setError(err.error || 'Erreur lors de l\'ajout');
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  const filtered = records
    .filter(r => typeFilter === 'all' || r.type === typeFilter)
    .filter(r => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      const haystack = `${r.vehicle?.plate || ''} ${r.description || ''} ${r.type || ''}`.toLowerCase();
      return haystack.includes(searchLower);
    });

  const stats = {
    total: records.length,
    coutTotal: records.reduce((sum, r) => sum + (r.cost || 0), 0),
    dernierKm: records.length > 0 ? Math.max(...records.map(r => r.km || 0)) : 0,
    prochaineEcheance: records.filter(r => r.nextKm && r.nextKm > 0).length,
  };

  const typeLabels: Record<string, string> = {
    vidange: '🛢️ Vidange',
    pneu: '🛞 Pneu',
    plaquette: '🔧 Plaquette',
    bougie: '⚡ Bougie',
    chaine: '⛓️ Chaîne',
    autre: '📦 Autre',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🔧 Maintenance</h1>
          <p className="text-sm text-gray-500">{stats.total} interventions · {stats.coutTotal.toLocaleString()} Ar</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 hover:bg-emerald-700"
        >
          <Plus size={18} /> Nouvelle intervention
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Wrench size={20} className="text-emerald-600" />
            </div>
            <span className="text-sm text-gray-500">Interventions</span>
          </div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <span className="text-sm text-gray-500">Coût total</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.coutTotal.toLocaleString()} Ar</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Car size={20} className="text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Prochaines échéances</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.prochaineEcheance}</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Tous types</option>
          {Object.entries(typeLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Véhicule</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Km</th>
                <th className="px-4 py-3">Prochain Km</th>
                <th className="px-4 py-3">Coût</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Aucune intervention</td></tr>
              ) : (
                filtered.map(r => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs">
                      {r.date ? new Date(r.date).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {r.vehicle?.plate || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {typeLabels[r.type] || r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">{r.km?.toLocaleString() || 0} km</td>
                    <td className="px-4 py-3">
                      {r.nextKm ? (
                        <span className="text-xs text-blue-600">{r.nextKm.toLocaleString()} km</span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-red-600">
                      {(r.cost || 0).toLocaleString()} Ar
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal ajout */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">🔧 Nouvelle intervention</h2>
            <div className="space-y-3">
              <select
                value={form.vehicleId}
                onChange={e => setForm({...form, vehicleId: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Sélectionner un véhicule</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                ))}
              </select>
              <select
                value={form.type}
                onChange={e => setForm({...form, type: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                {Object.entries(typeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Kilométrage actuel"
                value={form.km || ''}
                onChange={e => setForm({...form, km: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Coût (Ar)"
                value={form.cost || ''}
                onChange={e => setForm({...form, cost: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Prochain Km (optionnel)"
                value={form.nextKm || ''}
                onChange={e => setForm({...form, nextKm: Number(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="Description (optionnel)"
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 border rounded-lg text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
