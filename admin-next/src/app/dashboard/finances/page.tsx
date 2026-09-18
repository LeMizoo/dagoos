'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2, Truck, Search, AlertCircle, Crown, Zap, Coffee, Star,
  FileText, Wallet, TrendingUp, Receipt, ArrowRight, RefreshCw,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Organization {
  id: string;
  name: string;
  email?: string;
  type?: string;
  plan: string;
  status: string;
  paymentStatus?: string | null;
  paymentRef?: string | null;
  paymentAmount?: number | null;
  subscriptionEnd?: string | null;
  createdAt?: string;
}

interface Plan {
  id: string;
  type: string;
  name: string;
  price: number;
  vehiclesMax: number;
  driversMax: number;
  active: boolean;
}

type StatusKey = 'all' | 'paid' | 'unpaid' | 'overdue' | 'free';

const planConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  premium:  { icon: Crown,    color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: 'Premium'  },
  standard: { icon: Zap,      color: 'text-blue-600',   bg: 'bg-blue-50 border-blue-200',     label: 'Standard' },
  basic:    { icon: Star,     color: 'text-teal-600',   bg: 'bg-teal-50 border-teal-200',     label: 'Basic'    },
  freemium: { icon: Coffee,   color: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200',     label: 'Freemium' },
  surdevis: { icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', label: 'Sur devis'},
};

const norm = (p?: string) => (p || 'freemium').toLowerCase();

export default function FinancesPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'FLEET_MANAGER' | 'COOPERATIVE'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusKey>('all');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [resOrgs, resPlans] = await Promise.all([
        apiFetch('/organizations?page=1&limit=200'),
        apiFetch('/plans'),
      ]);
      if (!resOrgs.ok) throw new Error(`Organisations : erreur ${resOrgs.status}`);
      if (!resPlans.ok) throw new Error(`Plans : erreur ${resPlans.status}`);

      const orgData = await resOrgs.json();
      const planData = await resPlans.json();

      setOrgs(Array.isArray(orgData?.data) ? orgData.data : (Array.isArray(orgData) ? orgData : []));
      setPlans(Array.isArray(planData) ? planData : []);
    } catch (err: any) {
      setError(err.message || 'Impossible de charger les données d\'abonnement.');
    } finally {
      setLoading(false);
    }
  };

  const getPlanPrice = (org: Organization): number => {
    const plan = plans.find(
      p => p.type === org.type && p.name.toLowerCase() === norm(org.plan),
    );
    return plan?.price ?? 0;
  };

  const orgsWithoutAdmin = orgs.filter(o => o.type !== 'ADMIN');
  const totalOrgs = orgsWithoutAdmin.length;
  const payantes = orgsWithoutAdmin.filter(o => getPlanPrice(o) > 0).length;
  const gratuites = orgsWithoutAdmin.filter(o => getPlanPrice(o) === 0).length;
  const mrrTheorique = orgsWithoutAdmin.reduce((s, o) => s + Math.max(0, getPlanPrice(o)), 0);

  const now = Date.now();
  const overdue = orgsWithoutAdmin.filter(o => {
    if (getPlanPrice(o) === 0) return false;
    if (o.paymentStatus === 'paid') return false;
    if (!o.subscriptionEnd) return true;
    return new Date(o.subscriptionEnd).getTime() < now;
  }).length;

  const mrrReel = orgsWithoutAdmin
    .filter(o => o.paymentStatus === 'paid')
    .reduce((s, o) => s + Math.max(0, o.paymentAmount ?? getPlanPrice(o)), 0);

  const filtered = orgsWithoutAdmin.filter(o => {
    const matchSearch =
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.email || '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || o.type === typeFilter;
    const price = getPlanPrice(o);
    const isFree = price === 0;
    const isPaid = o.paymentStatus === 'paid';
    const isOverdue = !isFree && !isPaid;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'free' && isFree) ||
      (statusFilter === 'paid' && isPaid) ||
      (statusFilter === 'unpaid' && !isFree && !isPaid && o.paymentStatus !== 'paid') ||
      (statusFilter === 'overdue' && isOverdue);
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💰 Finances</h1>
          <p className="text-sm text-gray-500 mt-1">
            État des abonnements des organisations — plateforme Dagoos
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw size={16} /> Actualiser
          </button>
          <Link
            href="/dashboard/finances/abonnements"
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-purple-700 transition shadow-sm"
          >
            <Receipt size={18} /> Gérer les abonnements
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
          <button onClick={fetchAll} className="ml-auto text-red-700 underline text-xs">Réessayer</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={Building2}
          label="Organisations actives"
          value={loading ? '—' : totalOrgs.toLocaleString()}
          sub={loading ? '' : `${payantes} payantes · ${gratuites} gratuites`}
          color="blue"
        />
        <KpiCard
          icon={TrendingUp}
          label="MRR théorique"
          value={loading ? '—' : `${mrrTheorique.toLocaleString()} Ar`}
          sub="Somme des plans actifs"
          color="purple"
        />
        <KpiCard
          icon={Wallet}
          label="MRR encaissé"
          value={loading ? '—' : `${mrrReel.toLocaleString()} Ar`}
          sub="Basé sur paymentAmount déclaré"
          color="green"
        />
        <KpiCard
          icon={AlertCircle}
          label="Impayés / en retard"
          value={loading ? '—' : overdue.toLocaleString()}
          sub="Payantes sans règlement"
          color="red"
        />
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-6 text-xs">
        <strong>Niveau administration générale.</strong> Cette vue présente l'<em>état courant</em> des
        abonnements (plan choisi, prix catalogue, statut de paiement, échéance). Elle ne retrace
        pas d'historique de transactions — cet historique n'existe pas encore dans le schéma
        actuel. Les activités opérationnelles (courses, versements chauffeurs, dépenses) sont
        gérées dans le dashboard propre à chaque organisation.
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3">
          <div className="flex gap-2 flex-wrap">
            {(['all', 'FLEET_MANAGER', 'COOPERATIVE'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  typeFilter === t
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t === 'all' ? 'Tous' : t === 'FLEET_MANAGER' ? '🚛 Flottes' : '🏢 Coops'}
              </button>
            ))}
            <span className="w-px bg-gray-200 mx-1" />
            {([
              ['all', 'Tous statuts'],
              ['paid', 'Payés'],
              ['unpaid', 'Non payés'],
              ['overdue', 'En retard'],
              ['free', 'Gratuits'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key as StatusKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  statusFilter === key
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative max-w-xs w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une organisation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Organisation</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Prix / mois</th>
                <th className="px-4 py-3 font-medium">Statut paiement</th>
                <th className="px-4 py-3 font-medium">Référence</th>
                <th className="px-4 py-3 font-medium">Échéance</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-2" />
                    Chargement...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    {search || typeFilter !== 'all' || statusFilter !== 'all'
                      ? 'Aucun résultat avec ces filtres.'
                      : 'Aucune organisation.'}
                  </td>
                </tr>
              ) : (
                filtered.map(org => {
                  const p = norm(org.plan);
                  const cfg = planConfig[p] || planConfig.freemium;
                  const Icon = cfg.icon;
                  const price = getPlanPrice(org);
                  const isFree = price === 0;
                  const isPaid = org.paymentStatus === 'paid';
                  const statusKey = isFree ? 'free' : isPaid ? 'paid' : 'unpaid';
                  const statusLabel =
                    statusKey === 'free' ? 'Gratuit' :
                    statusKey === 'paid' ? 'Payé' :
                    'Non payé';
                  const statusClass =
                    statusKey === 'free' ? 'bg-gray-100 text-gray-700' :
                    statusKey === 'paid' ? 'bg-green-100 text-green-700' :
                    'bg-amber-100 text-amber-700';

                  return (
                    <tr key={org.id} className="border-t hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {org.type === 'FLEET_MANAGER'
                            ? <Truck size={14} className="text-blue-500" />
                            : <Building2 size={14} className="text-emerald-500" />}
                          <div>
                            <div className="font-medium text-gray-800">{org.name}</div>
                            {org.email && (
                              <div className="text-xs text-gray-400">{org.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          org.type === 'FLEET_MANAGER'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {org.type === 'FLEET_MANAGER' ? 'Flotte' : 'Coop'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                          <Icon size={12} /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {isFree ? 'Gratuit' : `${price.toLocaleString()} Ar`}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                        {org.paymentRef || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {org.subscriptionEnd
                          ? new Date(org.subscriptionEnd).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href="/dashboard/finances/abonnements"
                          className="text-purple-600 hover:text-purple-800 text-xs font-medium flex items-center gap-1"
                        >
                          Gérer <ArrowRight size={12} />
                        </Link>
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

function KpiCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: any; label: string; value: string; sub?: string; color: string;
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
  };
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.blue}`}>
          <Icon size={20} />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}
