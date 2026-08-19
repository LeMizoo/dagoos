'use client';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Users, Car, DollarSign, Building2, ArrowUpRight, TrendingUp, CheckCircle, FileCheck } from 'lucide-react';
import Greeting from '@/components/dashboard/Greeting';

export default function CoopHome() {
  const [stats, setStats] = useState({ drivers: 0, vehicles: 0, societes: 0, coursesJour: 0, caJour: 0, contratsActifs: 0, livraisonsJour: 0 });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);

  useEffect(() => { load(); }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      load();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    try {
      const [driversRes, vehiclesRes, societesRes, contratsRes, livraisonsRes, statsSummary, coursesData, reservationsRes] = await Promise.all([
        apiFetch('/drivers').then(r => r.json()).catch(() => []),
        apiFetch('/vehicles').then(r => r.json()).catch(() => []),
        apiFetch('/societes').then(r => r.json()).catch(() => []),
        apiFetch('/contrats').then(r => r.json()).catch(() => []),
        apiFetch('/livraisons').then(r => r.json()).catch(() => []),
        apiFetch('/finances/stats/summary').then(r => r.ok ? r.json() : null).catch(() => null),
        apiFetch('/finances/courses').then(r => r.ok ? r.json() : []).catch(() => []),
        apiFetch('/reservations').then(r => r.ok ? r.json() : []).catch(() => []),
      ]);
      setReservations(Array.isArray(reservationsRes) ? reservationsRes : []);
      
      setCourses(Array.isArray(coursesData) ? coursesData : []);

      setStats({
        drivers: Array.isArray(driversRes) ? driversRes.length : 0,
        vehicles: Array.isArray(vehiclesRes) ? vehiclesRes.length : 0,
        societes: Array.isArray(societesRes) ? societesRes.length : 0,
        coursesJour: statsSummary?.today?.count || 0,
        caJour: statsSummary?.today?.ca || 0,
        contratsActifs: Array.isArray(contratsRes) ? contratsRes.filter((c: any) => c.statut === 'actif' || c.status === 'actif').length : 0,
        livraisonsJour: Array.isArray(livraisonsRes) ? livraisonsRes.filter((l: any) => {
          const d = new Date(l.createdAt || l.date || new Date());
          const today = new Date();
          return d.toDateString() === today.toDateString();
        }).length : 0,
      });

      const recentCourses = Array.isArray(coursesData) ? coursesData.slice(0, 5).map((c: any) => ({
        type: 'course',
        driver: c.driver?.user?.name || c.driver?.driverCode || 'Chauffeur',
        desc: `Course - ${c.vehicle?.plate || 'véhicule'}`,
        montant: Number(c.price || 0),
      })) : [];

      setRecentActivity(recentCourses);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  return (
    <div>
      <Greeting />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPI icon={Building2} label="Sociétés" value={stats.societes} color="blue" loading={loading} />
        <KPI icon={Users} label="Chauffeurs" value={stats.drivers} color="green" loading={loading} />
        <KPI icon={Car} label="Véhicules" value={stats.vehicles} color="yellow" loading={loading} />
        <KPI icon={DollarSign} label="CA Aujourd'hui" value={`${stats.caJour.toLocaleString()} Ar`} color="purple" loading={loading} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">📊 Activité - 7 derniers jours</h3>
          <div className="flex items-end gap-3 h-40">
            {(() => {
              const last7Days = [...Array(7)].map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return {
                  dateStr: d.toISOString().split('T')[0],
                  label: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
                };
              });

              const caByDay = last7Days.map(({ dateStr }) => {
                return courses
                  .filter((c: any) => c.date?.startsWith(dateStr))
                  .reduce((sum: number, c: any) => sum + Number(c.price || 0), 0);
              });

              const max = Math.max(...caByDay, 1);

              return last7Days.map(({ dateStr, label }, i) => {
                const ca = caByDay[i];
                const height = ca > 0 ? (ca / max) * 100 : 2;

                return (
                  <div key={dateStr} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {ca > 0 ? `${Math.round(ca / 1000)}K` : ''}
                    </span>
                    <div 
                      className="w-full bg-emerald-500 rounded-t-lg hover:bg-emerald-600 transition-all"
                      style={{ height: `${height}%` }}
                      title={`${ca.toLocaleString()} Ar`}
                    />
                    <span className="text-xs text-gray-500 capitalize">{label}</span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">🕐 Activité récente</h3>
          <div className="space-y-3">
            {recentActivity.map((act, i) => (
              <div key={i} className="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${act.type === 'livraison' ? 'bg-blue-100 text-blue-600' : act.type === 'contrat' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                  {act.type === 'livraison' ? <ArrowUpRight size={14} /> : act.type === 'contrat' ? <FileCheck size={14} /> : <DollarSign size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-white truncate">{act.desc}</p>
                  <p className="text-xs text-gray-500">{act.societe || act.driver}{act.montant > 0 ? ` - ${act.montant.toLocaleString()} Ar` : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <AlertCard icon={FileCheck} color="blue" title="Contrats actifs" desc={`${stats.contratsActifs} contrats en cours`} />
        <AlertCard icon={CheckCircle} color="green" title="Livraisons aujourd'hui" desc={`${stats.livraisonsJour} livraisons`} />
        <AlertCard icon={TrendingUp} color="purple" title="Performance" desc="+15% vs hier" />
      </div>
    </div>
  );
}

function KPI({ icon: Icon, label, value, color, loading }: any) {
  const colors: any = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', yellow: 'bg-yellow-100 text-yellow-600', purple: 'bg-purple-100 text-purple-600' };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-2"><div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}><Icon size={20} /></div></div>
      <div className="text-2xl font-bold text-gray-800 dark:text-white">{loading ? '-' : value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function AlertCard({ icon: Icon, color, title, desc }: any) {
  const borders: any = { blue: 'border-blue-200 bg-blue-50', green: 'border-green-200 bg-green-50', purple: 'border-purple-200 bg-purple-50' };
  const icons: any = { blue: 'text-blue-600', green: 'text-green-600', purple: 'text-purple-600' };
  return (
    <div className={`rounded-xl p-4 border flex items-center gap-3 ${borders[color]} dark:bg-opacity-10 dark:border-opacity-30`}>
      <Icon size={20} className={icons[color]} />
      <div><p className="text-sm font-medium text-gray-800 dark:text-white">{title}</p><p className="text-xs text-gray-600 dark:text-gray-400">{desc}</p></div>
    </div>
  );
}
