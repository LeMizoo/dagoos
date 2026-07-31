'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, AlertCircle, Crown, Zap, Coffee, Check, X } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  email: string;
  type?: string;
  plan: string;
  status: string;
  createdAt: string;
}

const planConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  PREMIUM: { icon: Crown, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: 'Premium' },
  STANDARD: { icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Standard' },
  FREEMIUM: { icon: Coffee, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', label: 'Freemium' },
};

export default function AbonnementsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => { fetchOrgs(); }, []);

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/organizations');
      if (!res.ok) throw new Error('Erreur ' + res.status);
      const data = await res.json();
      setOrgs(Array.isArray(data) ? data : []);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = orgs.filter(org => {
    const matchSearch = org.name.toLowerCase().includes(search.toLowerCase()) ||
                        org.email.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === 'all' || org.plan === planFilter;
    return matchSearch && matchPlan;
  });

  const handleUpgrade = async (orgId: string, newPlan: string) => {
    setUpgrading(orgId);
    try {
      const res = await fetch(`/api/proxy/organizations/${orgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      });
      if (!res.ok) throw new Error('Erreur ' + res.status);
      fetchOrgs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpgrading(null);
    }
  };

  // Stats
  const totalPremium = orgs.filter(o => o.plan === 'PREMIUM').length;
  const totalStandard = orgs.filter(o => o.plan === 'STANDARD').length;
  const totalFreemium = orgs.filter(o => o.plan === 'FREEMIUM' || !o.plan).length;

  const totalCA = (totalPremium * 200000) + (totalStandard * 100000);

  return (
    <div>
      {/* Fil d'Ariane */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/dashboard/finances" className="hover:text-purple-600 transition-colors">Finances</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Abonnements</span>
      </div>

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 Abonnements</h1>
          <p className="text-sm text-gray-500 mt-1">Gestion des plans et facturation</p>
        </div>
        <Link
          href="/dashboard/finances"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition"
        >
          <ArrowLeft size={16} />
          Retour aux finances
        </Link>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Stats abonnements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Total organisations</div>
          <div className="text-2xl font-bold text-gray-800">{loading ? '-' : orgs.length}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-yellow-200">
          <div className="flex items-center gap-2 mb-1">
            <Crown size={14} className="text-yellow-600" />
            <span className="text-xs text-gray-500">Premium</span>
          </div>
          <div className="text-2xl font-bold text-yellow-700">{loading ? '-' : totalPremium}</div>
          <div className="text-xs text-gray-400 mt-1">200 000 Ar/mois</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-blue-600" />
            <span className="text-xs text-gray-500">Standard</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">{loading ? '-' : totalStandard}</div>
          <div className="text-xs text-gray-400 mt-1">100 000 Ar/mois</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Coffee size={14} className="text-gray-600" />
            <span className="text-xs text-gray-500">Freemium</span>
          </div>
          <div className="text-2xl font-bold text-gray-700">{loading ? '-' : totalFreemium}</div>
          <div className="text-xs text-gray-400 mt-1">Gratuit</div>
        </div>
      </div>

      {/* CA estimé */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 mb-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Chiffre d'affaires mensuel estimé</p>
            <p className="text-3xl font-bold mt-1">{loading ? '...' : `${totalCA.toLocaleString()} Ar`}</p>
          </div>
          <div className="text-right text-sm opacity-80">
            {totalPremium + totalStandard} abonnements payants
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une organisation..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
          />
        </div>
        <select
          value={planFilter}
          onChange={e => setPlanFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
        >
          <option value="all">Tous les plans</option>
          <option value="PREMIUM">Premium</option>
          <option value="STANDARD">Standard</option>
          <option value="FREEMIUM">Freemium</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3" />
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            Aucune organisation trouvée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Organisation</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Plan actuel</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(org => {
                  const plan = planConfig[org.plan] || planConfig.FREEMIUM;
                  const PlanIcon = plan.icon;
                  return (
                    <tr key={org.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{org.name}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          org.type === 'FLEET_MANAGER' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {org.type === 'FLEET_MANAGER' ? '🚛 Flotte' : '🏢 Coop'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${plan.bg} ${plan.color}`}>
                          <PlanIcon size={12} />
                          {plan.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {org.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700">
                            <Check size={12} /> Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600">
                            <X size={12} /> Inactif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {org.plan !== 'PREMIUM' && (
                            <button
                              onClick={() => handleUpgrade(org.id, 'PREMIUM')}
                              disabled={upgrading === org.id}
                              className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition disabled:opacity-50"
                            >
                              {upgrading === org.id ? '...' : '→ Premium'}
                            </button>
                          )}
                          {org.plan === 'FREEMIUM' && (
                            <button
                              onClick={() => handleUpgrade(org.id, 'STANDARD')}
                              disabled={upgrading === org.id}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition disabled:opacity-50"
                            >
                              {upgrading === org.id ? '...' : '→ Standard'}
                            </button>
                          )}
                          {org.plan !== 'FREEMIUM' && org.plan && (
                            <button
                              onClick={() => handleUpgrade(org.id, 'FREEMIUM')}
                              disabled={upgrading === org.id}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition disabled:opacity-50"
                            >
                              {upgrading === org.id ? '...' : 'Rétrograder'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
