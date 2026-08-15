'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Car, Wrench, Users, ClipboardList, DollarSign, CreditCard, MessageSquare, Bell, ScrollText, Settings, LogOut, Menu, X } from 'lucide-react';

const menu = [
  { section: 'Principal', items: [{ href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' }] },
  { section: 'Flotte', items: [{ href: '/dashboard/vehicules', icon: Car, label: 'Véhicules' }, { href: '/dashboard/entretien', icon: Wrench, label: 'Entretien' }] },
  { section: 'Chauffeurs', items: [{ href: '/dashboard/chauffeurs', icon: Users, label: 'Chauffeurs' }] },
  { section: 'Missions', items: [{ href: '/dashboard/missions', icon: ClipboardList, label: 'Missions' }] },
  { section: 'Finances', items: [{ href: '/dashboard/finances', icon: DollarSign, label: 'Finances' }, { href: '/dashboard/paiements', icon: CreditCard, label: 'Paiements' }] },
  { section: 'Communication', items: [{ href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' }, { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' }] },
  { section: 'Système', items: [{ href: '/dashboard/system-logs', icon: ScrollText, label: 'Logs' }, { href: '/dashboard/settings', icon: Settings, label: 'Paramètres' }] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
            <span className="text-dark font-bold text-sm">D</span>
          </div>
          <h2 className="text-lg font-bold">DAGOO</h2>
        </div>
        <p className="text-xs text-gray-400">Chez les potes, ça roule.</p>
        <span className="inline-block bg-primary/50 text-white text-[10px] px-2 py-0.5 rounded-full mt-2">Admin</span>
      </div>
      <nav className="flex-1 p-3 overflow-y-auto">
        {menu.map(s => (
          <div key={s.section} className="mb-4">
            <div className="text-xs text-gray-500 uppercase px-3 mb-1 tracking-wider">{s.section}</div>
            {s.items.map(item => { const Icon = item.icon; const isActive = pathname === item.href; return (
              <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition mb-0.5 ${isActive ? 'bg-primary text-white font-medium' : 'text-gray-300 hover:bg-white/10'}`}>
                <Icon size={18} /><span>{item.label}</span>
              </Link>
            );})}
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
    <>
      {/* Bouton hamburger mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3 left-3 z-50 lg:hidden bg-dark text-white p-2 rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-60 bg-dark text-white fixed h-full flex-col z-40">
        {sidebarContent}
      </aside>

      {/* Sidebar mobile (overlay) */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-dark text-white flex flex-col shadow-2xl">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <span className="font-bold">Menu</span>
              <button onClick={() => setIsOpen(false)}><X size={20} /></button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Contenu principal : marges responsive */}
      <div className="lg:ml-60 p-4 lg:p-6 bg-gray-50 min-h-screen pt-16 lg:pt-6">
        {/* Ce composant est le layout, il affiche children */}
      </div>
    </>
  );
}
