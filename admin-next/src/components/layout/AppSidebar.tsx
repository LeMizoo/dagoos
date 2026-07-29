'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Car, Users, DollarSign, MessageSquare, 
  Settings, LogOut, FileText, ArrowRightLeft, Receipt, 
  User, QrCode, Building2, FileCheck, Truck 
} from 'lucide-react';

interface MenuSection {
  section: string;
  items: { href: string; icon: any; label: string }[];
}

interface AppSidebarProps {
  app: 'fleet' | 'coop';
}

export default function AppSidebar({ app }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const basePath = `/${app}`;

  const menuFleet: MenuSection[] = [
    { section: 'Principal', items: [{ href: basePath, icon: LayoutDashboard, label: 'Tableau de bord' }] },
    { section: 'Gestion', items: [
      { href: `${basePath}/drivers`, icon: Users, label: 'Chauffeurs' },
      { href: `${basePath}/vehicles`, icon: Car, label: 'Véhicules' },
      { href: `${basePath}/proprietaires`, icon: User, label: 'Propriétaires' },
    ]},
    { section: 'Opérations', items: [
      { href: `${basePath}/permutation`, icon: ArrowRightLeft, label: 'Permutation' },
      { href: `${basePath}/codes`, icon: QrCode, label: 'Codes' },
    ]},
    { section: 'Finances', items: [
      { href: `${basePath}/finances`, icon: DollarSign, label: 'Finances' },
      { href: `${basePath}/versements`, icon: Receipt, label: 'Versements' },
      { href: `${basePath}/depenses`, icon: DollarSign, label: 'Dépenses' },
    ]},
    { section: 'Autres', items: [
      { href: `${basePath}/messages`, icon: MessageSquare, label: 'Messages' },
      { href: `${basePath}/rapports`, icon: FileText, label: 'Rapports' },
      { href: `${basePath}/profil`, icon: User, label: 'Profil' },
      { href: `${basePath}/settings`, icon: Settings, label: 'Paramètres' },
    ]},
  ];

  const menuCoop: MenuSection[] = [
    { section: 'Principal', items: [{ href: basePath, icon: LayoutDashboard, label: 'Tableau de bord' }] },
    { section: 'Gestion', items: [
      { href: `${basePath}/drivers`, icon: Users, label: 'Chauffeurs' },
      { href: `${basePath}/vehicles`, icon: Car, label: 'Véhicules' },
      { href: `${basePath}/societes`, icon: Building2, label: 'Sociétés' },
    ]},
    { section: 'Opérations', items: [
      { href: `${basePath}/contrats`, icon: FileCheck, label: 'Contrats' },
      { href: `${basePath}/livraisons`, icon: Truck, label: 'Livraisons' },
      { href: `${basePath}/permutation`, icon: ArrowRightLeft, label: 'Permutation' },
      { href: `${basePath}/codes`, icon: QrCode, label: 'Codes' },
    ]},
    { section: 'Finances', items: [
      { href: `${basePath}/finances`, icon: DollarSign, label: 'Finances' },
      { href: `${basePath}/versements`, icon: Receipt, label: 'Versements' },
      { href: `${basePath}/depenses`, icon: DollarSign, label: 'Dépenses' },
    ]},
    { section: 'Autres', items: [
      { href: `${basePath}/messages`, icon: MessageSquare, label: 'Messages' },
      { href: `${basePath}/rapports`, icon: FileText, label: 'Rapports' },
      { href: `${basePath}/profil`, icon: User, label: 'Profil' },
      { href: `${basePath}/settings`, icon: Settings, label: 'Paramètres' },
    ]},
  ];

  const menu = app === 'fleet' ? menuFleet : menuCoop;

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push(`/${app}/login`);
    router.refresh();
  }

  return (
    <aside className="w-60 bg-dark text-white fixed h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold">DAG<span className="text-secondary">OO</span>&apos;S</h2>
        <p className="text-xs text-gray-400 capitalize">{app === 'fleet' ? 'Flotte' : 'Coopérative'}</p>
      </div>
      <nav className="flex-1 p-3 overflow-y-auto">
        {menu.map((s) => (
          <div key={s.section} className="mb-4">
            <div className="text-xs text-gray-500 uppercase px-3 mb-1 tracking-wider">{s.section}</div>
            {s.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition mb-0.5 ${
                    isActive ? 'bg-primary text-white font-medium' : 'text-gray-300 hover:bg-white/10'
                  }`}>
                  <Icon size={18} /><span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-700">
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition w-full">
          <LogOut size={18} /><span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
