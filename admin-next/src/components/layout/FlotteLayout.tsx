'use client';

import { useAuth } from '@/lib/auth-context';
import { useOrganization } from '@/lib/organization-context';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  Menu, X, LogOut, LayoutDashboard, Car, Users, DollarSign, 
  CreditCard, MessageSquare, Bell, Settings, Truck, Building2,
  Calendar, Ticket, FileCheck, FileText, User, ClipboardList,
  ArrowRightLeft, QrCode, Wrench, Receipt, Clock
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/theme-context';
import ThemeSwitcher from './ThemeSwitcher';

interface FlotteLayoutProps {
  children: React.ReactNode;
}

export default function FlotteLayout({ children }: FlotteLayoutProps) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const { organization } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { theme, setTheme } = useTheme();

  const isUrbain = organization?.type === 'FLEET_MANAGER';
  const isInterurbain = organization?.type === 'COOPERATIVE';

  // Menu Fleet (Urbain)
  const fleetMenu = [
    { section: 'Principal', items: [
      { href: '/flotte', icon: LayoutDashboard, label: 'Tableau de bord' }
    ]},
    { section: 'Opérations', items: [
      { href: '/flotte/urbain/courses', icon: Truck, label: 'Courses' },
      { href: '/flotte/urbain/maintenance', icon: Wrench, label: 'Maintenance' },
      { href: '/flotte/pointages', icon: Clock, label: 'Pointage' },
      { href: '/flotte/rapports', icon: FileText, label: 'Rapports' }
    ]},
    { section: 'Gestion', items: [
      { href: '/flotte/vehicules', icon: Car, label: 'Véhicules' },
      { href: '/flotte/chauffeurs', icon: Users, label: 'Chauffeurs' },
      { href: '/flotte/proprietaires', icon: Users, label: 'Propriétaires' }
    ]},
    { section: 'Finances', items: [
      { href: '/flotte/finances', icon: DollarSign, label: 'Finances' },
      { href: '/flotte/versements', icon: Receipt, label: 'Versements' },
      { href: '/flotte/depenses', icon: CreditCard, label: 'Dépenses' }
    ]},
    { section: 'Communication', items: [
      { href: '/flotte/messages', icon: MessageSquare, label: 'Messages' },
      { href: '/flotte/notifications', icon: Bell, label: 'Notifications' }
    ]},
    { section: 'Systèmes', items: [
      { href: '/flotte/profil', icon: User, label: 'Profil' },
      { href: '/flotte/settings', icon: Settings, label: 'Paramètres' }
    ]}
  ];

  // Menu Coop (Inter-urbain)
  const coopMenu = [
    { section: 'Principal', items: [
      { href: '/flotte/interurbain', icon: LayoutDashboard, label: 'Tableau de bord' }
    ]},
    { section: 'Opérations', items: [
      { href: '/flotte/interurbain/departs', icon: Calendar, label: 'Départs' },
      { href: '/flotte/interurbain/reservations', icon: Ticket, label: 'Réservations' },
      { href: '/flotte/interurbain/livraisons', icon: Truck, label: 'Livraisons' },
      { href: '/flotte/interurbain/societes', icon: Building2, label: 'Sociétés' },
      { href: '/flotte/interurbain/contrats', icon: FileCheck, label: 'Contrats' },
      { href: '/flotte/interurbain/pointages', icon: Clock, label: 'Pointage' },
      { href: '/flotte/interurbain/rapports', icon: FileText, label: 'Rapports' }
    ]},
    { section: 'Gestion', items: [
      { href: '/flotte/interurbain/vehicles', icon: Car, label: 'Véhicules' },
      { href: '/flotte/interurbain/drivers', icon: Users, label: 'Chauffeurs' },
      { href: '/flotte/interurbain/proprietaires', icon: Users, label: 'Propriétaires' }
    ]},
    { section: 'Finances', items: [
      { href: '/flotte/interurbain/finances', icon: DollarSign, label: 'Finances' },
      { href: '/flotte/interurbain/versements', icon: Receipt, label: 'Versements' },
      { href: '/flotte/interurbain/depenses', icon: CreditCard, label: 'Dépenses' }
    ]},
    { section: 'Communication', items: [
      { href: '/flotte/interurbain/messages', icon: MessageSquare, label: 'Messages' },
      { href: '/flotte/interurbain/notifications', icon: Bell, label: 'Notifications' }
    ]},
    { section: 'Systèmes', items: [
      { href: '/flotte/interurbain/profil', icon: User, label: 'Profil' },
      { href: '/flotte/interurbain/settings', icon: Settings, label: 'Paramètres' }
    ]}
  ];

  const menu = isUrbain ? fleetMenu : coopMenu;

  // ============================================================
  // Notifications : compteur non lues
  // Le backend reste la source de vérité.
  // apiFetch ajoute automatiquement x-auth-space selon l'URL.
  // ============================================================
  useEffect(() => {
    let cancelled = false;

    const loadUnreadNotifications = async () => {
      try {
        const { default: apiFetch } = await import('@/lib/api');

        const response = await apiFetch('/notifications/unread-count');

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const count = Number(data?.count);

        if (!cancelled) {
          setUnreadNotifications(
            Number.isFinite(count) && count > 0
              ? count
              : 0
          );
        }
      } catch (error) {
        console.error('Compteur notifications:', error);
      }
    };

    loadUnreadNotifications();

    const interval = window.setInterval(
      loadUnreadNotifications,
      30000
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const notificationPath = isInterurbain
    ? '/flotte/interurbain/notifications'
    : '/flotte/urbain/notifications';




  const handleLogout = async () => {
    // Attendre le logout pour que Clear-Site-Data soit traité
    await logout();
    const loginPath = isInterurbain ? '/interurbain-login' : '/urbain-login';
    window.location.replace(loginPath);
  };

  const isActive = (href: string) => {
    if (href === '/flotte') return pathname === '/flotte';
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      <div className="p-5 border-b border-gray-700">
        <Link href="/flotte" className="flex flex-col items-center gap-2">
          <Image src="/b-trans.svg" alt="DAGOO" width={56} height={56} className="brightness-0 invert" />
          <div className="text-center">
            <h2 className="text-lg font-bold tracking-wide">DAGOO&apos;S</h2>
            <p className="text-xs text-gray-400 mt-0.5">Chez les potes, ça roule.</p>
          </div>
        </Link>
        <div className="flex justify-center mt-3">
          <span className="inline-block bg-primary/50 text-white text-[10px] px-3 py-0.5 rounded-full">
            {organization?.name || 'Flotte'}
          </span>
        </div>
        <div className="flex justify-center mt-2">
          <span className={`inline-block text-white text-[10px] px-3 py-0.5 rounded-full ${
            isUrbain ? 'bg-blue-500/50' : isInterurbain ? 'bg-emerald-500/50' : 'bg-gray-500/50'
          }`}>
            {isUrbain ? 'URBAIN' : isInterurbain ? 'INTER-URBAIN' : 'Chargement...'}
          </span>
        </div>
      </div>
      <nav className="flex-1 p-3 overflow-y-auto">
        {menu.map((s: any) => (
          <div key={s.section} className="mb-4">
            <div className="text-xs text-gray-500 uppercase px-3 mb-1 tracking-wider">{s.section}</div>
            {s.items.map((item: any) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition mb-0.5 ${
                    active ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/10 font-medium' 
                           : 'text-gray-300 hover:bg-white/10'
                  }`}>
                  <Icon size={18} className={active ? 'text-emerald-400' : ''} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-700">
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition w-full">
          <LogOut size={18} /><span>Déconnexion</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <aside className="hidden lg:flex w-60 bg-[#1A1A2E] dark:bg-gray-950 text-white fixed h-full flex-col z-40">
        {sidebarContent}
      </aside>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#1A1A2E] dark:bg-gray-950 text-white">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setIsOpen(!isOpen)} className="p-1">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-2">
            <Image src="/b-trans.svg" alt="DAGOO" width={24} height={24} className="brightness-0 invert" />
            <span className="font-bold text-sm">DAGOO&apos;S - Flotte</span>
          </div>
          <button onClick={handleLogout} className="p-1 text-red-400"><LogOut size={18} /></button>
        </div>
      </div>
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-[#1A1A2E] dark:bg-gray-950 text-white flex flex-col shadow-2xl pt-14">
            {sidebarContent}
          </aside>
        </div>
      )}
      <main className="flex-1 lg:ml-60 min-h-screen w-full">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">
              {organization?.name || 'Administration Flotte'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isUrbain ? 'Gestion Urbaine' : isInterurbain ? 'Gestion Inter-urbaine' : 'Chargement...'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={notificationPath}
              aria-label={
                unreadNotifications > 0
                  ? `${unreadNotifications} notification${unreadNotifications > 1 ? 's' : ''} non lue${unreadNotifications > 1 ? 's' : ''}`
                  : 'Notifications'
              }
              className="relative flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <Bell size={21} />

              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-gray-800">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </Link>

            <ThemeSwitcher />
            <div className="relative">
              <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-3 py-2 transition">
              <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-800 dark:text-white">{user?.name || 'Utilisateur'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || ''}</p>
              </div>
            </button>
            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <p className="font-semibold text-gray-800 dark:text-white">{user?.name || 'Utilisateur'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || ''}</p>
                    <span className="inline-block mt-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      {isUrbain ? 'Urbain' : isInterurbain ? 'Inter-urbain' : 'Flotte'}
                    </span>
                  </div>
                  <div className="p-2">
                    <Link href="/flotte/profil" onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                      <User size={18} />Mon Profil
                    </Link>
                    <button onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                      <LogOut size={18} />Déconnexion
                    </button>
                  </div>
                </div>
                </>
              )}
            </div>
          </div>
        </header>
        <div className="p-4 lg:p-6 pt-4">{children}</div>
      </main>
    </div>
  );
}
