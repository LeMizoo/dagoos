'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import { useAuth } from '@/lib/auth-context';
import { 
  Users, Car, DollarSign, TrendingUp, Clock, MapPin, 
  CheckCircle, XCircle, Calendar, Ticket, AlertCircle 
} from 'lucide-react';

export default function FlotteDashboard() {
  const { organization, isUrbain, isInterurbain, isLoading } = useOrganization();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      const [driversRes, vehiclesRes, statsRes, departsRes, reservationsRes] = await Promise.all([
        apiFetch('/drivers').then(r => r.ok ? r.json() : []),
        apiFetch('/vehicles?page=1&limit=100').then(r => r.ok ? r.json() : []),
        apiFetch('/finances/stats/summary').then(r => r.ok ? r.json() : null),
        isInterurbain ? apiFetch('/departs?page=1&limit=100').then(r => r.ok ? r.json() : []) : Promise.resolve([]),
        isInterurbain ? apiFetch('/reservations?page=1&limit=100').then(r => r.ok ? r.json() : []) : Promise.resolve([]),
      ]);

      const drivers = Array.isArray(driversRes?.data) ? driversRes.data : (Array.isArray(driversRes) ? driversRes : []);
      const vehicles = Array.isArray(vehiclesRes?.data) ? vehiclesRes.data : (Array.isArray(vehiclesRes) ? vehiclesRes : []);
      const departs = Array.isArray(departsRes?.data) ? departsRes.data : (Array.isArray(departsRes) ? departsRes : []);
      const reservations = Array.isArray(reservationsRes?.data) ? reservationsRes.data : (Array.isArray(reservationsRes) ? reservationsRes : []);

      const orgDrivers = drivers.filter((d: any) => d.organizationId === organization.id);
      const orgVehicles = vehicles.filter((v: any) => v.organizationId === organization.id);
      const orgDeparts = departs.filter((d: any) => d.organizationId === organization.id);
      const orgReservations = reservations.filter((r: any) => 
        orgDeparts.some((d: any) => d.id === r.departId)
      );

      setStats({
        drivers: orgDrivers.length,
        driversActifs: orgDrivers.filter((d: any) => d.status === 'active' || d.status === 'AVAILABLE').length,
        vehicles: orgVehicles.length,
        vehiclesActifs: orgVehicles.filter((v: any) => v.status === 'active').length,
        caJour: statsRes?.today?.ca || 0,
        coursesJour: statsRes?.today?.count || 0,
        departs: orgDeparts.length,
        draft: orgDeparts.filter((d: any) => d.statut === 'DRAFT').length,
        departsPublies: orgDeparts.filter((d: any) => d.statut === 'PUBLISHED').length,
        departsAujourdhui: orgDeparts.filter((d: any) => {
          const today = new Date().toDateString();
          return new Date(d.date).toDateString() === today;
        }).length,
        reservations: orgReservations.length,
        reservationsConfirmees: orgReservations.filter((r: any) => r.statut === 'CONFIRMED').length,
        reservationsEnAttente: orgReservations.filter((r: any) => r.statut === 'PENDING').length,
        tauxRemplissage: orgDeparts.length > 0 
          ? Math.round((orgReservations.filter((r: any) => r.statut !== 'CANCELLED').length / 
              orgDeparts.reduce((sum: number, d: any) => sum + (d.placesTotal || 0), 0)) * 100)
          : 0,
      });
    } catch (e) {
      console.error('Erreur dashboard:', e);
    } finally {
      setLoading(false);
    }
  }, [organization, isInterurbain]);

  useEffect(() => {
    load();
  }, [load]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête de bienvenue */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-sm p-6 text-white">
        <h2 className="text-2xl font-bold">
          Bienvenue, {user?.name || 'Utilisateur'} 👋
        </h2>
        <p className="mt-2 text-white/80">
          {organization?.name || 'Votre organisation'}
        </p>
        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
            {isUrbain ? '🚕 URBAIN' : isInterurbain ? '🚌 INTER-URBAIN' : 'Type inconnu'}
          </span>
          <span className="text-xs text-white/70">
            {isUrbain ? 'Gestion de flotte urbaine' : 'Gestion de flotte inter-urbaine'}
          </span>
        </div>
      </div>

      {/* KPIs communs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={Users} label="Chauffeurs" value={stats?.drivers || 0} sub={`${stats?.driversActifs || 0} actifs`} color="blue" />
        <KPI icon={Car} label="Véhicules" value={stats?.vehicles || 0} sub={`${stats?.vehiclesActifs || 0} actifs`} color="emerald" />
        <KPI icon={DollarSign} label="CA Aujourd'hui" value={`${(stats?.caJour || 0).toLocaleString()} Ar`} sub={`${stats?.coursesJour || 0} courses`} color="green" />
        {isUrbain ? (
          <KPI icon={MapPin} label="Courses du jour" value={stats?.coursesJour || 0} sub="Aujourd'hui" color="yellow" />
        ) : (
          <KPI icon={Calendar} label="Départs aujourd'hui" value={stats?.departsAujourdhui || 0} sub={`${stats?.departsPublies || 0} publiés`} color="yellow" />
        )}
      </div>

      {/* KPIs spécifiques */}
      {isInterurbain && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI icon={Ticket} label="Réservations" value={stats?.reservations || 0} sub={`${stats?.reservationsConfirmees || 0} confirmées`} color="purple" />
          <KPI icon={CheckCircle} label="Confirmées" value={stats?.reservationsConfirmees || 0} sub={`${stats?.reservationsEnAttente || 0} en attente`} color="green" />
          <KPI icon={Clock} label="En attente" value={stats?.reservationsEnAttente || 0} sub="À traiter" color="yellow" />
          <KPI icon={TrendingUp} label="Taux remplissage" value={`${stats?.tauxRemplissage || 0}%`} sub="Tous départs" color="cyan" />
        </div>
      )}

      {isUrbain && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KPI icon={MapPin} label="Courses aujourd'hui" value={stats?.coursesJour || 0} sub="Activité du jour" color="orange" />
          <KPI icon={TrendingUp} label="CA 7 jours" value={`${(stats?.caJour || 0).toLocaleString()} Ar`} sub="Cumul hebdomadaire" color="purple" />
        </div>
      )}

      {/* Accès rapides */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold text-gray-800 dark:text-white mb-4">⚡ Accès rapides</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {isUrbain ? (
            <>
              <QuickLink href="/flotte/chauffeurs" icon={Users} label="Chauffeurs" color="blue" />
              <QuickLink href="/flotte/vehicules" icon={Car} label="Véhicules" color="emerald" />
              <QuickLink href="/flotte/urbain/courses" icon={MapPin} label="Courses" color="yellow" />
              <QuickLink href="/flotte/finances" icon={DollarSign} label="Finances" color="green" />
            </>
          ) : (
            <>
              <QuickLink href="/flotte/interurbain/departs" icon={Calendar} label="Départs" color="yellow" />
              <QuickLink href="/flotte/interurbain/reservations" icon={Ticket} label="Réservations" color="purple" />
              <QuickLink href="/flotte/chauffeurs" icon={Users} label="Chauffeurs" color="blue" />
              <QuickLink href="/flotte/vehicules" icon={Car} label="Véhicules" color="emerald" />
            </>
          )}
        </div>
      </div>

      {/* Alerte si départs non publiés */}
      {isInterurbain && (stats?.draft || 0) > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-yellow-600" />
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            Vous avez {stats.draft} départs en brouillon. Pensez à les publier pour qu'ils soient visibles par les voyageurs.
          </p>
        </div>
      )}
    </div>
  );
}

function KPI({ icon: Icon, label, value, sub, color }: any) {
  const colors: any = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-800 dark:text-white">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

function QuickLink({ href, icon: Icon, label, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    yellow: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
    green: 'bg-green-50 text-green-700 hover:bg-green-100',
    purple: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
  };

  return (
    <a
      href={href}
      className={`flex items-center gap-3 p-4 rounded-lg transition ${colors[color]}`}
    >
      <Icon size={20} />
      <span className="font-medium text-sm">{label}</span>
    </a>
  );
}
