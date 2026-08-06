'use client';
import { useState, useEffect } from 'react';
import { resolveOrganization } from '@/lib/organization';

interface UserInfo {
  name?: string;
  email?: string;
  role?: string;
}
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, LayoutDashboard, Car, Wrench, Users, ClipboardList, DollarSign, CreditCard, MessageSquare, Bell, ScrollText, Settings, Truck, Building2, ArrowRightLeft, Receipt, User, QrCode, FileText, FileCheck } from 'lucide-react';

// Menus par type
const menus: Record<string, any> = {
  admin: [
    { 
      section: 'Principal', 
      items: [
        { href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
        { href: '/dashboard/flottes', icon: Truck, label: 'Flottes' },
        { href: '/dashboard/cooperatives', icon: Building2, label: 'Coopératives' },
        { href: '/dashboard/finances', icon: DollarSign, label: 'Finances' },
      ] 
    },
    { 
      section: 'Communication', 
      items: [
        { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
        { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
      ] 
    },
    { 
      section: 'Système', 
      items: [
        { href: '/dashboard/system-logs', icon: ScrollText, label: 'Logs' },
        { href: '/dashboard/settings', icon: Settings, label: 'Paramètres' },
      ] 
    },
  ],
  fleet: [
    { section: 'Principal', items: [{ href: '/fleet', icon: LayoutDashboard, label: 'Tableau de bord' }] },
    { section: 'Gestion', items: [{ href: '/fleet/proprietaires', icon: User, label: 'Propriétaires' }, { href: '/fleet/drivers', icon: Users, label: 'Chauffeurs' }, { href: '/fleet/vehicles', icon: Car, label: 'Véhicules' }] },
    { section: 'Opérations', items: [{ href: '/fleet/permutation', icon: ArrowRightLeft, label: 'Permutation' }, { href: '/fleet/codes', icon: QrCode, label: 'Codes' }] },
    { section: 'Finances', items: [{ href: '/fleet/finances', icon: DollarSign, label: 'Finances' }, { href: '/fleet/versements', icon: Receipt, label: 'Versements' }, { href: '/fleet/depenses', icon: DollarSign, label: 'Dépenses' }] },
    { section: 'Autres', items: [{ href: '/fleet/messages', icon: MessageSquare, label: 'Messages' }, { href: '/fleet/rapports', icon: FileText, label: 'Rapports' }, { href: '/fleet/profil', icon: User, label: 'Profil' }, { href: '/fleet/settings', icon: Settings, label: 'Paramètres' }] },
  ],
  coop: [
    { section: 'Principal', items: [{ href: '/coop', icon: LayoutDashboard, label: 'Tableau de bord' }] },
    { section: 'Gestion', items: [{ href: '/coop/societes', icon: Building2, label: 'Sociétés' }, { href: '/coop/drivers', icon: Users, label: 'Chauffeurs' }, { href: '/coop/vehicles', icon: Car, label: 'Véhicules' }] },
    { section: 'Opérations', items: [{ href: '/coop/contrats', icon: FileCheck, label: 'Contrats' }, { href: '/coop/livraisons', icon: Truck, label: 'Livraisons' }, { href: '/coop/permutation', icon: ArrowRightLeft, label: 'Permutation' }, { href: '/coop/codes', icon: QrCode, label: 'Codes' }] },
    { section: 'Finances', items: [{ href: '/coop/finances', icon: DollarSign, label: 'Finances' }, { href: '/coop/versements', icon: Receipt, label: 'Versements' }, { href: '/coop/depenses', icon: DollarSign, label: 'Dépenses' }] },
    { section: 'Autres', items: [{ href: '/coop/messages', icon: MessageSquare, label: 'Messages' }, { href: '/coop/rapports', icon: FileText, label: 'Rapports' }, { href: '/coop/profil', icon: User, label: 'Profil' }, { href: '/coop/settings', icon: Settings, label: 'Paramètres' }] },
  ],
};

interface ResponsiveLayoutProps {
  app: 'admin' | 'fleet' | 'coop';
  children: React.ReactNode;
}

export default function ResponsiveLayout({ app, children }: ResponsiveLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [menuAccess, setMenuAccess] = useState({ showOwners: true, showSocieties: true, showDrivers: true, showVehicles: true });

  useEffect(() => {
    // Essayer d'abord l'API locale, puis le proxy
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(async (d) => {
        if (d && !d.error) {
          const authUser = d.user || d;
          setUser({
            name: authUser?.name || authUser?.fullName || 'Utilisateur',
            email: authUser?.email,
            role: authUser?.role,
          });

          try {
            const [orgsRes, driversRes, vehiclesRes] = await Promise.all([
              fetch('/api/proxy/organizations').then(r => r.ok ? r.json() : []),
              fetch('/api/proxy/drivers').then(r => r.ok ? r.json() : []),
              fetch('/api/proxy/vehicles').then(r => r.ok ? r.json() : [])
            ]);

            const organizations = Array.isArray(orgsRes) ? orgsRes : [];
            const currentOrg = resolveOrganization(authUser, organizations, app === 'fleet' ? 'FLEET_MANAGER' : 'COOPERATIVE');
            const orgId = currentOrg?.id || authUser?.organizationId || authUser?.organization?.id || null;
            const isFleet = app === 'fleet';
            const allDrivers = Array.isArray(driversRes) ? driversRes : [];
            const allVehicles = Array.isArray(vehiclesRes) ? vehiclesRes : [];

            const matchesOrg = (item: any) => {
              if (!orgId) return false;
              return item?.organizationId === orgId || item?.organization?.id === orgId;
            };

            const hasOwners = Boolean((currentOrg as any)?.proprietaires?.length || (currentOrg as any)?.proprietairesCount || (currentOrg as any)?.ownersCount || (currentOrg as any)?.owners?.length);
            const hasSocieties = Boolean((currentOrg as any)?.societes?.length || (currentOrg as any)?.societesCount || (currentOrg as any)?.societies?.length);
            const hasDrivers = allDrivers.some(matchesOrg);
            const hasVehicles = allVehicles.some(matchesOrg);

            setMenuAccess({
              showOwners: isFleet ? (hasOwners || hasDrivers || hasVehicles) : true,
              showSocieties: !isFleet ? (hasSocieties || hasDrivers || hasVehicles) : true,
              showDrivers: isFleet ? (hasOwners || hasDrivers || hasVehicles) : (hasSocieties || hasDrivers || hasVehicles),
              showVehicles: isFleet ? (hasOwners || hasDrivers || hasVehicles) : (hasSocieties || hasDrivers || hasVehicles),
            });
          } catch {}
        } else {
          // Fallback : récupérer depuis le token JWT dans le cookie
          const token = document.cookie.split('; ').find(row => row.startsWith('dagoos_token='));
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              setUser({ name: payload.name || 'Utilisateur', email: payload.email, role: payload.role });
            } catch {}
          }
        }
      })
      .catch(() => {});
  }, [app]);

  const menu = menus[app] || menus.admin;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    const loginPaths: Record<string, string> = { admin: '/login', fleet: '/fleet-login', coop: '/coop-login' };
    router.push(loginPaths[app] || '/login');
    router.refresh();
  };

  // Vérifie si un item est actif (correspondance exacte ou préfixe)
  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      {/* En-tête avec logo */}
      <div className="p-5 border-b border-gray-700 dark:border-gray-800/50">
        <Link href={app === 'admin' ? '/dashboard' : `/${app}`} className="flex flex-col items-center gap-2">
          <Image 
            src="/b-trans.svg" 
            alt="DAGOO" 
            width={56} 
            height={56}
            className="brightness-0 invert"
          />
          <div className="text-center">
            <h2 className="text-lg font-bold tracking-wide">DAGOO{app !== 'admin' ? "'S" : ''}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Chez les potes, ça roule.</p>
          </div>
        </Link>
        <div className="flex justify-center mt-3">
          <span className="inline-block bg-primary/50 text-white text-[10px] px-3 py-0.5 rounded-full capitalize">
            {app === 'admin' ? 'Admin' : app === 'fleet' ? 'Flotte' : 'Coopérative'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {menu.map((s: any) => (
          <div key={s.section} className="mb-4">
            <div className="text-xs text-gray-500 uppercase px-3 mb-1 tracking-wider">{s.section}</div>
            {s.items.map((item: any) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition mb-0.5 ${
                    active 
                      ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10 font-medium' 
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-emerald-400' : ''} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Déconnexion */}
      <div className="p-3 border-t border-gray-700 dark:border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition w-full"
        >
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-60 bg-[#1A1A2E] dark:bg-gray-950 text-white fixed h-full flex-col z-40">
        {sidebarContent}
      </aside>

      {/* Menu mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#1A1A2E] dark:bg-gray-950 text-white">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setIsOpen(!isOpen)} className="p-1">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-2">
            <Image src="/b-trans.svg" alt="DAGOO" width={24} height={24} className="brightness-0 invert" />
            <span className="font-bold text-sm">
              DAGOO{app !== 'admin' ? "'S" : ''} - {app === 'admin' ? 'Admin' : app === 'fleet' ? 'Flotte' : 'Coopérative'}
            </span>
          </div>
          <button onClick={handleLogout} className="p-1 text-red-400"><LogOut size={18} /></button>
        </div>
      </div>

      {/* Overlay mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-[#1A1A2E] dark:bg-gray-950 text-white flex flex-col shadow-2xl pt-14">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Contenu principal */}
      <main className="flex-1 lg:ml-60 min-h-screen w-full">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">
              {app === 'admin' ? 'Tableau de Bord Admin' : app === 'fleet' ? 'Tableau de Bord Flotte' : 'Tableau de Bord Coopérative'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Gestion complète de {app === 'admin' ? 'la plateforme' : app === 'fleet' ? 'la flotte' : 'la coopérative'}</p>
          </div>
          
          {/* Profil utilisateur */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-3 py-2 transition"
            >
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-800 dark:text-white">{user?.name || 'Utilisateur'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || ''}</p>
              </div>
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <p className="font-semibold text-gray-800 dark:text-white">{user?.name || 'Utilisateur'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || ''}</p>
                    <span className="inline-block mt-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full capitalize">
                      {user?.role || app}
                    </span>
                  </div>
                  <div className="p-2">
                    <Link
                      href={app === 'admin' ? '/dashboard/settings' : `/${app}/profil`}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                      <User size={18} />
                      Mon Profil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                    >
                      <LogOut size={18} />
                      Déconnexion
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-6 pt-4">
          {children}
        </div>
      </main>
    </div>
  );
}
