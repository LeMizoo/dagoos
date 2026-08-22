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

const planConfig: Record<string, { icon: any; color: string; bg: string; label: string; price: number }> = {
  premium:  { icon: Crown, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: 'Premium', price: 75000 },
  standard: { icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Standard', price: 35000 },
  basic:    { icon: Star, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200', label: 'Basic', price: 15000 },
  freemium: { icon: Coffee, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', label: 'Freemium', price: 0 },
  surdevis: { icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', label: 'Sur devis', price: -1 },
};

const fleetPrices: Record<string, number> = { freemium: 0, basic: 15000, standard: 35000, premium: 75000, surdevis: -1 };
const coopPrices: Record<string, number> = { freemium: 0, basic: 20000, standard: Number(process.env.NEXT_PUBLIC_PLAN_STANDARD || 45000), premium: 90000, surdevis: -1 };

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
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleUpgrade = async (orgId: string, newPlan: string) => {
    setUpgrading(orgId);
    try {
      const res = await fetch('/api/organizations/upgrade', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, plan: newPlan }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erreur ' + res.status);
      }
      await fetchOrgs();
    } catch (err: any) { setError(err.message); } finally { setUpgrading(null); }
  };

  const filtered = orgs.filter(org => {
    const match = org.name.toLowerCase().includes(search.toLowerCase()) || org.email.toLowerCase().includes(search.toLowerCase());
    const mp = planFilter === 'all' || (org.plan || 'freemium').toLowerCase() === planFilter;
    return match && mp;
  });

  const norm = (p: string) => (p || 'freemium').toLowerCase();
  const tf = orgs.filter(o => norm(o.plan) === 'freemium').length;
  const tb = orgs.filter(o => norm(o.plan) === 'basic').length;
  const ts = orgs.filter(o => norm(o.plan) === 'standard').length;
  const tp = orgs.filter(o => norm(o.plan) === 'premium').length;
  const td = orgs.filter(o => norm(o.plan) === 'surdevis').length;

  const totalCA = orgs.reduce((sum, org) => {
    const plan = norm(org.plan);
    const prices = org.type === 'FLEET_MANAGER' ? fleetPrices : coopPrices;
    return sum + (prices[plan] > 0 ? prices[plan] : 0);
  }, 0);
  const payants = tb + ts + tp + td;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/dashboard/finances" className="hover:text-purple-600">Finances</Link><span>/</span><span className="text-gray-800 font-medium">Abonnements</span>
      </div>
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900">📋 Abonnements</h1><p className="text-sm text-gray-500">Gestion des plans et facturation</p></div>
        <Link href="/dashboard/finances" className="flex items-center gap-2 text-sm text-gray-600"><ArrowLeft size={16} /> Retour</Link>
      </div>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Stat label="Total" value={orgs.length} />
        <Stat label="Freemium" value={tf} icon={Coffee} color="text-gray-500" />
        <Stat label="Basic" value={tb} icon={Star} color="text-teal-500" />
        <Stat label="Standard" value={ts} icon={Zap} color="text-blue-500" />
        <Stat label="Premium" value={tp} icon={Crown} color="text-yellow-500" />
        <Stat label="Sur devis" value={td} icon={FileText} color="text-purple-500" />
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div><p className="text-sm opacity-80">CA mensuel estimé</p><p className="text-3xl font-bold mt-1">{loading ? '...' : totalCA.toLocaleString() + ' Ar'}</p></div>
          <div className="text-sm opacity-80">{payants} abonnement{payants>1?'s':''} payant{payants>1?'s':''}</div>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg text-sm" /></div>
        <select value={planFilter} onChange={e=>setPlanFilter(e.target.value)} className="px-3 py-2.5 bg-white border rounded-lg text-sm">
          <option value="all">Tous</option><option value="freemium">Freemium</option><option value="basic">Basic</option><option value="standard">Standard</option><option value="premium">Premium</option><option value="surdevis">Sur devis</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? <div className="p-12 text-center text-gray-400">Chargement...</div> :
         filtered.length === 0 ? <div className="p-12 text-center text-gray-400">Aucune organisation.</div> :
         <table className="w-full text-sm">
           <thead className="bg-gray-50 text-gray-500"><tr><th className="px-4 py-3">Organisation</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Plan</th><th className="px-4 py-3">Prix</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Actions</th></tr></thead>
           <tbody>
             {filtered.map(org => {
               const p = norm(org.plan);
               const cfg = planConfig[p] || planConfig.freemium;
               const Icon = cfg.icon;
               const prices = org.type === 'FLEET_MANAGER' ? fleetPrices : coopPrices;
               const price = prices[p] || 0;
               return (
                 <tr key={org.id} className="border-t hover:bg-gray-50">
                   <td className="px-4 py-3 font-medium">{org.name}</td>
                   <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${org.type==='FLEET_MANAGER'?'bg-blue-50 text-blue-700':'bg-emerald-50 text-emerald-700'}`}>{org.type==='FLEET_MANAGER'?'🚛 Flotte':'🏢 Coop'}</span></td>
                   <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}><Icon size={12} />{cfg.label}</span></td>
                   <td className="px-4 py-3 text-sm font-medium">{price===-1?'Sur devis':price===0?'Gratuit':price.toLocaleString()+' Ar'}</td>
                   <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${org.status==='active'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{org.status||'inactif'}</span></td>
                   <td className="px-4 py-3">
                     <div className="flex gap-1 flex-wrap">
                       {p!=='premium' && <Btn onClick={()=>handleUpgrade(org.id,'premium')} loading={upgrading===org.id} label="Premium" color="bg-yellow-100 text-yellow-700 hover:bg-yellow-200" />}
                       {p!=='standard' && <Btn onClick={()=>handleUpgrade(org.id,'standard')} loading={upgrading===org.id} label="Standard" color="bg-blue-100 text-blue-700 hover:bg-blue-200" />}
                       {p!=='basic' && <Btn onClick={()=>handleUpgrade(org.id,'basic')} loading={upgrading===org.id} label="Basic" color="bg-teal-100 text-teal-700 hover:bg-teal-200" />}
                       {p!=='freemium' && <Btn onClick={()=>handleUpgrade(org.id,'freemium')} loading={upgrading===org.id} label="Freemium" color="bg-gray-100 text-gray-600 hover:bg-gray-200" />}
                     </div>
                   </td>
                 </tr>
               );
             })}
           </tbody>
         </table>}
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      {Icon && <Icon size={14} className={color + " mb-1"} />}
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-bold text-gray-800">{value}</div>
    </div>
  );
}

function Btn({ onClick, loading, label, color }: any) {
  return <button onClick={onClick} disabled={loading} className={`px-2 py-1 text-xs rounded transition disabled:opacity-50 ${color}`}>{loading?'...':label}</button>;
}
