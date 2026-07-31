'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, AlertCircle, Crown, Zap, Coffee, Star, FileText } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  email: string;
  type?: string;
  plan: string;
  status: string;
  createdAt: string;
}

// Mapping des plans (minuscules → affichage) avec vrais prix
const planConfig: Record<string, { icon: any; color: string; bg: string; label: string; price: number }> = {
  premium:  { icon: Crown, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: 'Premium', price: 75000 },
  standard: { icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Standard', price: 35000 },
  basic:    { icon: Star, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200', label: 'Basic', price: 15000 },
  freemium: { icon: Coffee, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', label: 'Freemium', price: 0 },
  surdevis: { icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', label: 'Sur devis', price: -1 },
};

// Prix fleet par défaut (pour le calcul si le type est fleet)
const fleetPrices: Record<string, number> = {
  freemium: 0, basic: 15000, standard: 35000, premium: 75000, surdevis: -1,
};

// Prix coop par défaut
const coopPrices: Record<string, number> = {
  freemium: 0, basic: 20000, standard: 45000, premium: 90000, surdevis: -1,
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
    const orgPlan = (org.plan || 'freemium').toLowerCase();
    const matchPlan = planFilter === 'all' || orgPlan === planFilter.toLowerCase();
    return matchSearch && matchPlan;
  });

  const handleUpgrade = async (orgId: string, newPlan: string) => {
    setUpgrading(orgId);
    try {
      // Utiliser le proxy avec le bon endpoint
      const res = await fetch(`/api/proxy/organizations/${orgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan: newPlan }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Erreur ' + res.status);
      }
      fetchOrgs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpgrading(null);
    }
  };

  // Stats par plan (normalisé en minuscules)
  const normalizePlan = (plan: string) => (plan || 'freemium').toLowerCase();
  
  const totalFreemium = orgs.filter(o => normalizePlan(o.plan) === 'freemium').length;
  const totalBasic = orgs.filter(o => normalizePlan(o.plan) === 'basic').length;
  const totalStandard = orgs.filter(o => normalizePlan(o.plan) === 'standard').length;
  const totalPremium = orgs.filter(o => normalizePlan(o.plan) === 'premium').length;
  const totalSurDevis = orgs.filter(o => normalizePlan(o.plan) === 'surdevis').length;

  // CA mensuel estimé selon le type d'organisation
  const totalCA = orgs.reduce((sum, org) => {
    const plan = normalizePlan(org.plan);
    const isFleet = org.type === 'FLEET_MANAGER';
    const prices = isFleet ? fleetPrices : coopPrices;
    const price = prices[plan] || 0;
    return sum + (price > 0 ? price : 0);
  }, 0);

  const totalPayants = totalBasic + totalStandard + totalPremium + totalSurDevis;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/dashboard/finances" className="hover:text-purple-600 transition-colors">Finances</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Abonnements</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📋 Abonnements</h1>
          <p className="text-sm text-gray-500 mt-1">Gestion des plans et facturation</p>
        </div>
        <Link href="/dashboard/finances" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
          <ArrowLeft size={16} /> Retour aux finances
        </Link>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

      {/* Stats abonnements */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Total</div>
          <div className="text-xl font-bold text-gray-800">{loading ? '-' : orgs.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <Coffee size={14} className="text-gray-500 mb-1" />
          <div className="text-xs text-gray-500">Freemium</div>
          <div className="text-xl font-bold text-gray-700">{loading ? '-' : totalFreemium}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-teal-200">
          <Star size={14} className="text-teal-500 mb-1" />
          <div className="text-xs text-gray-500">Basic</div>
          <div className="text-xl font-bold text-teal-700">{loading ? '-' : totalBasic}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-200">
          <Zap size={14} className="text-blue-500 mb-1" />
          <div className="text-xs text-gray-500">Standard</div>
          <div className="text-xl font-bold text-blue-700">{loading ? '-' : totalStandard}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-yellow-200">
          <Crown size={14} className="text-yellow-500 mb-1" />
          <div className="text-xs text-gray-500">Premium</div>
          <div className="text-xl font-bold text-yellow-700">{loading ? '-' : totalPremium}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200">
          <FileText size={14} className="text-purple-500 mb-1" />
          <div className="text-xs text-gray-500">Sur devis</div>
          <div className="text-xl font-bold text-purple-700">{loading ? '-' : totalSurDevis}</div>
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
            {totalPayants} abonnement{totalPayants > 1 ? 's' : ''} payant{totalPayants > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Rechercher une organisation..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
        </div>
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none">
          <option value="all">Tous les plans</option>
          <option value="freemium">Freemium</option>
          <option value="basic">Basic</option>
          <option value="standard">Standard</option>
          <option value="premium">Premium</option>
          <option value="surdevis">Sur devis</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400"><div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3" />Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">Aucune organisation trouvée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr><th className="px-4 py-3">Organisation</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Plan actuel</th><th className="px-4 py-3">Prix/mois</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(org => {
                  const orgPlan = (org.plan || 'freemium').toLowerCase();
                  const plan = planConfig[orgPlan] || planConfig.freemium;
                  const PlanIcon = plan.icon;
                  const isFleet = org.type === 'FLEET_MANAGER';
                  const prices = isFleet ? fleetPrices : coopPrices;
                  const currentPrice = prices[orgPlan] || 0;
                  return (
                    <tr key={org.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-gray-800">{org.name}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${isFleet ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>{isFleet ? '🚛 Flotte' : '🏢 Coop'}</span></td>
                      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${plan.bg} ${plan.color}`}><PlanIcon size={12} />{plan.label}</span></td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">{currentPrice === -1 ? 'Sur devis' : currentPrice === 0 ? 'Gratuit' : `${currentPrice.toLocaleString()} Ar`}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${org.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{org.status || 'inactif'}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {orgPlan !== 'premium' && (
                            <button onClick={() => handleUpgrade(org.id, 'premium')} disabled={upgrading === org.id}
                              className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50">{upgrading === org.id ? '...' : 'Premium'}</button>
                          )}
                          {orgPlan !== 'standard' && (
                            <button onClick={() => handleUpgrade(org.id, 'standard')} disabled={upgrading === org.id}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50">{upgrading === org.id ? '...' : 'Standard'}</button>
                          )}
                          {orgPlan !== 'basic' && (
                            <button onClick={() => handleUpgrade(org.id, 'basic')} disabled={upgrading === org.id}
                              className="px-2 py-1 text-xs bg-teal-100 text-teal-700 rounded hover:bg-teal-200 disabled:opacity-50">{upgrading === org.id ? '...' : 'Basic'}</button>
                          )}
                          {orgPlan !== 'freemium' && (
                            <button onClick={() => handleUpgrade(org.id, 'freemium')} disabled={upgrading === org.id}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50">{upgrading === org.id ? '...' : 'Freemium'}</button>
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
