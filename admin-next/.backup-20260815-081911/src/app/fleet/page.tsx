'use client';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Users, Car, DollarSign, TrendingUp, TrendingDown, Activity, AlertTriangle, CheckCircle, Clock, ArrowUpRight } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import Greeting from '@/components/dashboard/Greeting';

export default function FleetHome() {
  const [stats, setStats] = useState({ drivers: 0, vehicles: 0, activeVehicles: 0, maintenanceVehicles: 0, coursesJour: 0, caJour: 0, commissionJour: 0, messages: 0 });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [driversRes, vehiclesRes, messagesRes] = await Promise.all([
        fetch('/api/proxy/drivers').then(r => r.json()).catch(() => []),
        fetch('/api/proxy/vehicles').then(r => r.json()).catch(() => []),
        fetch('/api/proxy/messages').then(r => r.json()).catch(() => []),
      ]);
      
      const vehicles = Array.isArray(vehiclesRes) ? vehiclesRes : [];
      const drivers = Array.isArray(driversRes) ? driversRes : [];
      const messages = Array.isArray(messagesRes) ? messagesRes : [];

      setStats({
        drivers: drivers.length,
        vehicles: vehicles.length,
        activeVehicles: vehicles.filter((v: any) => v.status === 'active').length,
        maintenanceVehicles: vehicles.filter((v: any) => v.status === 'maintenance').length,
        coursesJour: 12,
        caJour: 245000,
        commissionJour: 36750,
        messages: messages.filter((m: any) => !m.read).length,
      });

      setRecentActivity([
        { type: 'course', driver: 'Rakoto Jean', vehicle: 'FL-FR-100', montant: 35000, date: new Date().toISOString() },
        { type: 'maintenance', vehicle: 'FL-PR-M100', desc: 'Vidange', date: new Date(Date.now() - 86400000).toISOString() },
        { type: 'course', driver: 'Rabe Pierre', vehicle: 'FL-RA-200', montant: 28000, date: new Date(Date.now() - 3600000).toISOString() },
        { type: 'permutation', driver: 'Andry Miary', from: 'FL-FR-100', to: 'FL-PR-M100', date: new Date(Date.now() - 7200000).toISOString() },
      ]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  return (
    <div>
      <Greeting />

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center"><Car size={20} className="text-blue-600" /></div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${stats.activeVehicles > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{stats.activeVehicles} actifs</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{loading ? '-' : stats.vehicles}</div>
          <div className="text-xs text-gray-500 mt-1">Véhicules total</div>
          <div className="flex gap-2 mt-2 text-xs">
            <span className="text-green-600">🟢 {stats.activeVehicles} actifs</span>
            <span className="text-red-600">🔴 {stats.maintenanceVehicles} maintenance</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center"><Users size={20} className="text-green-600" /></div>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{loading ? '-' : stats.drivers}</div>
          <div className="text-xs text-gray-500 mt-1">Chauffeurs enregistrés</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center"><Activity size={20} className="text-yellow-600" /></div>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{loading ? '-' : stats.coursesJour}</div>
          <div className="text-xs text-gray-500 mt-1">Courses aujourd'hui</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center"><DollarSign size={20} className="text-purple-600" /></div>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">{loading ? '-' : `${stats.caJour.toLocaleString()} Ar`}</div>
          <div className="text-xs text-gray-500 mt-1">CA aujourd'hui</div>
          <div className="text-xs text-purple-600 mt-1">Commission : {stats.commissionJour.toLocaleString()} Ar</div>
        </div>
      </div>

      {/* Graphique simple + Activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique CA (barres simples) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">📊 Chiffre d'affaires - 7 derniers jours</h3>
          <div className="flex items-end gap-3 h-40">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day, i) => {
              const values = [180, 220, 195, 245, 280, 310, 150];
              const height = values[i];
              const max = 310;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{height}K</span>
                  <div 
                    className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                    style={{ height: `${(height / max) * 100}%` }}
                  />
                  <span className="text-xs text-gray-500">{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">🕐 Activité récente</h3>
          <div className="space-y-3">
            {recentActivity.map((act, i) => (
              <div key={i} className="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  act.type === 'course' ? 'bg-green-100 text-green-600' :
                  act.type === 'maintenance' ? 'bg-orange-100 text-orange-600' :
                  'bg-blue-100 text-blue-600'
                }`}>
                  {act.type === 'course' ? <DollarSign size={14} /> : act.type === 'maintenance' ? <AlertTriangle size={14} /> : <ArrowUpRight size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 dark:text-white truncate">
                    {act.type === 'course' && `Course de ${act.driver} - ${act.montant?.toLocaleString()} Ar`}
                    {act.type === 'maintenance' && `${act.desc} - ${act.vehicle}`}
                    {act.type === 'permutation' && `Permutation ${act.driver} : ${act.from} → ${act.to}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(act.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alertes */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-orange-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-orange-800 dark:text-orange-300">Maintenance en attente</p>
            <p className="text-xs text-orange-600 dark:text-orange-400">{stats.maintenanceVehicles} véhicule{stats.maintenanceVehicles > 1 ? 's' : ''} en maintenance</p>
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-800 dark:text-green-300">Véhicules opérationnels</p>
            <p className="text-xs text-green-600 dark:text-green-400">{stats.activeVehicles} prêts à rouler</p>
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3">
          <Clock size={20} className="text-blue-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Prochaine échéance</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Assurance FL-FR-100 : 15 août</p>
          </div>
        </div>
      </div>
    </div>
  );
}
