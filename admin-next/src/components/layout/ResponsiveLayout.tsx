'use client';
import { useState } from 'react';
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
    { section: 'Gestion', items: [{ href: '/fleet/drivers', icon: Users, label: 'Chauffeurs' }, { href: '/fleet/vehicles', icon: Car, label: 'Véhicules' }, { href: '/fleet/proprietaires', icon: User, label: 'Propriétaires' }] },
    { section: 'Opérations', items: [{ href: '/fleet/permutation', icon: ArrowRightLeft, label: 'Permutation' }, { href: '/fleet/codes', icon: QrCode, label: 'Codes' }] },
    { section: 'Finances', items: [{ href: '/fleet/finances', icon: DollarSign, label: 'Finances' }, { href: '/fleet/versements', icon: Receipt, label: 'Versements' }, { href: '/fleet/depenses', icon: DollarSign, label: 'Dépenses' }] },
    { section: 'Autres', items: [{ href: '/fleet/messages', icon: MessageSquare, label: 'Messages' }, { href: '/fleet/rapports', icon: FileText, label: 'Rapports' }, { href: '/fleet/profil', icon: User, label: 'Profil' }, { href: '/fleet/settings', icon: Settings, label: 'Paramètres' }] },
  ],
  coop: [
    { section: 'Principal', items: [{ href: '/coop', icon: LayoutDashboard, label: 'Tableau de bord' }] },
    { section: 'Gestion', items: [{ href: '/coop/drivers', icon: Users, label: 'Chauffeurs' }, { href: '/coop/vehicles', icon: Car, label: 'Véhicules' }, { href: '/coop/societes', icon: Building2, label: 'Sociétés' }] },
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
      <main className="flex-1 lg:ml-60 p-4 lg:p-6 pt-16 lg:pt-6 min-h-screen w-full">
        {children}
      </main>
    </div>
  );
}
