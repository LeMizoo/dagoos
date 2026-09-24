'use client';

// ============================================================
// TarifRows — Helpers UI partages
// Extraction depuis admin-next/src/app/flotte/settings/page.tsx
// Utilises par : flotte/settings (urbain) et InterurbainTarifsSettings
// ============================================================

import type { ReactNode } from 'react';

export function Card({ children }: { children: ReactNode }) {
  return <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">{children}</div>;
}

export function ZoneSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{title}</h3>
      {children}
    </div>
  );
}

export function ModeRow({ label, base, km, onChange }: { label: string; base: number; km: number; onChange: (field: string, value: number) => void }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border mb-3">
      <h4 className="text-sm font-medium mb-2">{label}</h4>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Base (Ar)</label>
          <input type="number" value={base} onChange={e => onChange('prixBase', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Km (Ar)</label>
          <input type="number" value={km} onChange={e => onChange('prixKm', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" />
        </div>
      </div>
    </div>
  );
}

export function JourRow({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border mb-3">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs max-w-[200px]" />
    </div>
  );
}

export function LocationSpeciale({ active, prix, onToggle, onPrix }: { active: boolean; prix: number; onToggle: (v: boolean) => void; onPrix: (v: number) => void }) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">🔐 Location disponible (autorisation spéciale)</span>
        <button type="button" onClick={() => onToggle(!active)} className={`px-3 py-1 rounded-full text-xs font-semibold transition ${active ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
          {active ? 'ON' : 'OFF'}
        </button>
      </div>
      {active && (
        <div className="max-w-[200px]">
          <label className="block text-xs text-gray-500 mb-1">Tarif spécial / jour (Ar)</label>
          <input type="number" value={prix} onChange={e => onPrix(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" />
        </div>
      )}
    </div>
  );
}

export function BaremeRow({ base, km, tonne, onChange }: { base: number; km: number; tonne: number; onChange: (field: string, value: number) => void }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border mb-3">
      <h4 className="text-sm font-medium mb-2">Barème</h4>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Base (Ar)</label>
          <input type="number" value={base} onChange={e => onChange('prixBase', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Km (Ar)</label>
          <input type="number" value={km} onChange={e => onChange('prixKm', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tonne (Ar)</label>
          <input type="number" value={tonne} onChange={e => onChange('prixTonne', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" />
        </div>
      </div>
    </div>
  );
}
