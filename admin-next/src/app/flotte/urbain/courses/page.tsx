'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import { Car, TrendingUp, DollarSign, Search, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Course {
  id: string;
  date: string;
  type: string;
  distanceKm: number;
  price: number;
  commission: number;
  driver?: { user?: { name?: string }; driverCode?: string };
  vehicle?: { plate?: string; model?: string };
}

export default function UrbainCourses() {
  const { organization } = useOrganization();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const load = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      const res = await apiFetch('/finances/courses').then(r => r.ok ? r.json() : []);
      const allCourses = Array.isArray(res) ? res : [];
      setCourses(allCourses);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = courses
    .filter(c => typeFilter === 'all' || c.type === typeFilter)
    .filter(c => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      const haystack = `${c.driver?.user?.name || ''} ${c.driver?.driverCode || ''} ${c.vehicle?.plate || ''}`.toLowerCase();
      return haystack.includes(searchLower);
    });

  const stats = {
    total: courses.length,
    caTotal: courses.reduce((sum, c) => sum + (c.price || 0), 0),
    commissionTotale: courses.reduce((sum, c) => sum + (c.commission || 0), 0),
    distanceTotale: courses.reduce((sum, c) => sum + (c.distanceKm || 0), 0),
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🚗 Courses</h1>
          <p className="text-sm text-gray-500">{stats.total} courses · {stats.distanceTotale.toLocaleString()} km parcourus</p>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-emerald-600" />
            </div>
            <span className="text-sm text-gray-500">CA Total</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{stats.caTotal.toLocaleString()} Ar</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-red-600" />
            </div>
            <span className="text-sm text-gray-500">Commissions</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.commissionTotale.toLocaleString()} Ar</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Car size={20} className="text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Distance totale</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.distanceTotale.toLocaleString()} km</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par chauffeur, véhicule..."
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
          <option value="NORMALE">Course normale</option>
          <option value="ADY_VAROTRA">Ady varotra</option>
          <option value="LOCATION">Location</option>
        </select>
      </div>

      {/* Tableau des courses */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Chauffeur</th>
                <th className="px-4 py-3">Véhicule</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Distance</th>
                <th className="px-4 py-3">Prix</th>
                <th className="px-4 py-3">Commission</th>
                <th className="px-4 py-3">Net</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">Aucune course</td></tr>
              ) : (
                filtered.slice(0, 100).map(c => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs">
                      {c.date ? new Date(c.date).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {c.driver?.user?.name || c.driver?.driverCode || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.vehicle?.plate || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {c.type || 'NORMALE'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{c.distanceKm || 0} km</td>
                    <td className="px-4 py-3 text-green-600 font-medium">{(c.price || 0).toLocaleString()} Ar</td>
                    <td className="px-4 py-3 text-red-600">{(c.commission || 0).toLocaleString()} Ar</td>
                    <td className="px-4 py-3 font-medium text-emerald-600">
                      {((c.price || 0) - (c.commission || 0)).toLocaleString()} Ar
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
