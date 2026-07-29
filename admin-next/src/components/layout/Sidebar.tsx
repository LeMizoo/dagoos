'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Car, Wrench, Users, ClipboardList, DollarSign, CreditCard, MessageSquare, Bell, ScrollText, Settings, LogOut } from 'lucide-react';

const menu = [
  {
    section: 'Principal',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
    ],
  },
  {
    section: 'Flotte',
    items: [
      { href: '/dashboard/vehicules', icon: Car, label: 'Véhicules' },
      { href: '/dashboard/entretien', icon: Wrench, label: 'Entretien' },
    ],
  },
  {
    section: 'Chauffeurs',
    items: [
      { href: '/dashboard/chauffeurs', icon: Users, label: 'Chauffeurs' },
    ],
  },
  {
    section: 'Missions',
    items: [
      { href: '/dashboard/missions', icon: ClipboardList, label: 'Missions' },
    ],
  },
  {
    section: 'Finances',
    items: [
      { href: '/dashboard/finances', icon: DollarSign, label: 'Finances' },
      { href: '/dashboard/paiements', icon: CreditCard, label: 'Paiements' },
    ],
  },
  {
    section: 'Communication',
    items: [
      { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
      { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
    ],
  },
  {
    section: 'Système',
    items: [
      { href: '/dashboard/system-logs', icon: ScrollText, label: 'Logs' },
      { href: '/dashboard/settings', icon: Settings, label: 'Paramètres' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="w-60 bg-dark text-white fixed h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold">DAG<span className="text-secondary">OO</span>&apos;S</h2>
        <p className="text-xs text-gray-400">Super Admin</p>
      </div>
      <nav className="flex-1 p-3 overflow-y-auto">
        {menu.map((s) => (
          <div key={s.section} className="mb-4">
            <div className="text-xs text-gray-500 uppercase px-3 mb-1 tracking-wider">
              {s.section}
            </div>
            {s.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition mb-0.5 ${
                    isActive
                      ? 'bg-primary text-white font-medium'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition w-full"
        >
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
