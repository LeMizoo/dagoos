'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import { DollarSign } from 'lucide-react';

export default function FlotteDepenses() {
  const { organization } = useOrganization();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    category: 'carburant',
    amount: '',
    description: '',
    vehicleId: ''
  });
  const [vehicles, setVehicles] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      const [expRes, vehRes] = await Promise.all([
        apiFetch('/finances/expenses').then(r => r.ok ? r.json() : []),
        apiFetch('/vehicles?page=1&limit=100').then(r => r.ok ? r.json() : [])
      ]);
      
      const allExpenses = Array.isArray(expRes) ? expRes : [];
      const allVehicles = Array.isArray(vehRes) ? vehRes : [];
      
      setExpenses(allExpenses.filter((e: any) => e.organizationId === organization.id));
      setVehicles(allVehicles.filter((v: any) => v.organizationId === organization.id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || !organization?.id) return;
    
    setLoading(true);
    try {
      const res = await apiFetch('/finances/expenses', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
          organizationId: organization.id
        })
      });
      
      if (res.ok) {
        setForm({ category: 'carburant', amount: '', description: '', vehicleId: '' });
        load();
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur lors de l\'ajout');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const totalDepenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">💳 Dépenses</h1>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {/* Total */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <DollarSign size={20} className="text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              {totalDepenses.toLocaleString()} Ar
            </div>
            <div className="text-xs text-gray-500">Total des dépenses</div>
          </div>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-5 mb-6">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">➕ Ajouter une dépense</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={form.category}
              onChange={e => setForm({...form, category: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="carburant">⛽ Carburant</option>
              <option value="maintenance">🔧 Maintenance</option>
              <option value="assurance">🛡️ Assurance</option>
              <option value="vignette">📋 Vignette</option>
              <option value="autre">📦 Autre</option>
            </select>
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
          </div>
          <input
            type="number"
            placeholder="Montant (Ar)"
            value={form.amount}
            onChange={e => setForm({...form, amount: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            required
          />
          <input
            type="text"
            placeholder="Description (optionnel)"
            value={form.description}
            onChange={e => setForm({...form, description: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 text-sm disabled:opacity-50"
          >
            <DollarSign size={16} />
            {loading ? 'Ajout...' : 'Ajouter la dépense'}
          </button>
        </form>
      </div>

      {/* Liste des dépenses */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">📋 Historique des dépenses</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Véhicule</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Montant</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucune dépense</td></tr>
              ) : (
                expenses.map(e => (
                  <tr key={e.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs">
                      {e.date ? new Date(e.date).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {e.vehicle?.plate || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{e.description || '-'}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">
                      {Number(e.amount || 0).toLocaleString()} Ar
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
