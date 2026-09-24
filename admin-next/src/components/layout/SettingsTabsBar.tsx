'use client';

// ============================================================
// SettingsTabsBar — Navigation a 2 niveaux sous le header
// V1 — Chantier Parametres
//
// Niveau 1 : groupes (5 pour admin, 1 pour flotte)
// Niveau 2 : sous-onglets affiches uniquement pour le groupe actif
//
// Si groups.length === 1 :
//   - la barre principale est masquee
//   - seuls les sous-onglets du groupe unique sont affiches
//
// L'etat actif est determine par l'URL : ?tab=<id>
// ============================================================

import type { LucideIcon } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export interface SettingsSubTab {
  id: string;
  label: string;
}

export interface SettingsGroup {
  id: string;
  label: string;
  icon?: LucideIcon;
  defaultSubTab?: string;
  subTabs?: SettingsSubTab[];
}

interface SettingsTabsBarProps {
  groups: SettingsGroup[];
}

export default function SettingsTabsBar({ groups }: SettingsTabsBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentTab =
    searchParams.get('tab') ||
    groups[0]?.defaultSubTab ||
    groups[0]?.id ||
    '';

  // Variant selon le pathname
  const variant: 'admin' | 'fleet' | 'coop' = pathname.startsWith('/dashboard')
    ? 'admin'
    : pathname.startsWith('/flotte/interurbain')
    ? 'coop'
    : 'fleet';

  const activeClass =
    variant === 'admin'
      ? 'bg-primary text-white shadow-sm'
      : variant === 'coop'
      ? 'bg-emerald-600 text-white shadow-sm'
      : 'bg-accent text-white shadow-sm';

  function navigate(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', id);
    router.push(`${pathname}?${params.toString()}`);
  }

  // Detecte le groupe actif (celui qui contient currentTab dans ses subTabs)
  const activeGroup =
    groups.find((g) => {
      if (g.subTabs && g.subTabs.length > 0) {
        return g.subTabs.some((st) => st.id === currentTab);
      }
      return g.id === currentTab;
    }) || groups[0];

  const showMainBar = groups.length > 1;
  const subTabs = activeGroup?.subTabs ?? [];
  const showSubBar = subTabs.length > 0;

  function handleGroupClick(group: SettingsGroup) {
    if (group.subTabs && group.subTabs.length > 0) {
      const target = group.defaultSubTab || group.subTabs[0].id;
      navigate(target);
    } else {
      navigate(group.id);
    }
  }

  function isGroupActive(group: SettingsGroup) {
    if (group.subTabs && group.subTabs.length > 0) {
      return group.subTabs.some((st) => st.id === currentTab);
    }
    return group.id === currentTab;
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {showMainBar && (
        <div className="overflow-x-auto">
          <div className="flex items-center gap-1 px-4 lg:px-6 py-2 whitespace-nowrap min-w-max border-b border-gray-100 dark:border-gray-700">
            {groups.map((group) => {
              const Icon = group.icon;
              const isActive = isGroupActive(group);
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleGroupClick(group)}
                  className={`flex items-center gap-2 px-4 py-1.5 text-sm rounded-lg transition ${
                    isActive
                      ? activeClass + ' font-semibold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium'
                  }`}
                >
                  {Icon && <Icon size={16} />}
                  <span>{group.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showSubBar && (
        <div className="overflow-x-auto bg-gray-50 dark:bg-gray-900/40">
          <div className="flex items-center gap-1 px-4 lg:px-6 py-1.5 whitespace-nowrap min-w-max">
            {subTabs.map((sub) => {
              const isActive = currentTab === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => navigate(sub.id)}
                  className={`flex items-center gap-2 px-3 py-1 text-sm rounded-md transition ${
                    isActive
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold shadow-sm border border-gray-200 dark:border-gray-600'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
