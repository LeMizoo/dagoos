'use client';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { DollarSign, Save, AlertCircle } from 'lucide-react';

const DEFAULT_TARIFS: any = {
  moto: {
    courseNormale: { prixBase: 2000, prixKm: 500 },
    adyVarotra: { prixBase: 2500, prixKm: 600 },
    locationJournalier: { prixBase: 15000, prixKm: 0 },
  },
  voiture: {
    courseNormale: { prixBase: 4000, prixKm: 800 },
    adyVarotra: { prixBase: 5000, prixKm: 1000 },
    locationJournalier: { prixBase: 35000, prixKm: 0 },
  },
  bus: { tarifFixe: { prixTrajet: 6000 } },
  minivan: { tarifFixe: { prixTrajet: 5000 } },
  tricycle: { tarifFixe: { prixTrajet: 1500 } },
};

const VEHICLE_LABELS: Record<string, string> = {
  moto: '🏍️ Taxi Moto',
  voiture: '🚗 Taxi',
  bus: '🚌 Bus',
  minivan: '🚐 Mini Van',
  tricycle: '🛺 Tricycle',
};

export default function FleetSettingsPage() {
  const [tarifs, setTarifs] = useState(DEFAULT_TARIFS);
  const [commission, setCommission] = useState(20);
  const [orgId, setOrgId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadOrgAndTarifs(); }, []);

  async function loadOrgAndTarifs() {
    try {
      const meRes = await apiFetch('/api/auth/me');
      if (!meRes.ok) { setError('Erreur chargement'); setLoading(false); return; }
      const meData = await meRes.json();
      const me = meData?.user || meData;
      if (!me || !me.organizationId) { setError('Organisation introuvable'); setLoading(false); return; }
      setOrgId(me.organizationId);

      const tRes = await apiFetch(`/tarifs/${me.organizationId}`);
      if (tRes.ok) {
        const data = await tRes.json();
        if (data && data.vehiculeTarifs) {
          setTarifs(JSON.parse(data.vehiculeTarifs));
        }
        if (data && data.commissionChauffeur !== undefined) {
          setCommission(data.commissionChauffeur);
        }
      }
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  function updateTarif(key: string, mode: string, field: string, value: number) {
    setTarifs((prev: any) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [mode]: {
          ...prev[key]?.[mode],
          [field]: value,
        },
      },
    }));
  }

  function updateTarifFixe(key: string, value: number) {
    setTarifs((prev: any) => ({
      ...prev,
      [key]: {
        ...prev[key],
        tarifFixe: { prixTrajet: value },
      },
    }));
  }

  async function handleSave() {
    setError('');
    if (!orgId) { setError('Organisation non trouvée'); return; }
    try {
      const res = await apiFetch(`/tarifs/${orgId}`, {
        method: 'PUT',
        body: JSON.stringify({
          commissionChauffeur: commission,
          vehiculeTarifs: JSON.stringify(tarifs),
        }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
      else { const err = await res.json(); setError(err.error || 'Erreur'); }
    } catch (e: any) { setError(e.message); }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">⚙️ Paramètres</h1>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

      <div className="space-y-6">
        {/* Taxi Moto */}
        <VehicleCard label={VEHICLE_LABELS.moto}>
          <ModeField label="Course normale" values={tarifs.moto?.courseNormale} onChange={(field, val) => updateTarif('moto', 'courseNormale', field, val)} />
          <ModeField label="Ady varotra" values={tarifs.moto?.adyVarotra} onChange={(field, val) => updateTarif('moto', 'adyVarotra', field, val)} />
          <ModeField label="Location journalière" values={tarifs.moto?.locationJournalier} onChange={(field, val) => updateTarif('moto', 'locationJournalier', field, val)} isLocation />
        </VehicleCard>

        {/* Taxi */}
        <VehicleCard label={VEHICLE_LABELS.voiture}>
          <ModeField label="Course normale" values={tarifs.voiture?.courseNormale} onChange={(field, val) => updateTarif('voiture', 'courseNormale', field, val)} />
          <ModeField label="Ady varotra" values={tarifs.voiture?.adyVarotra} onChange={(field, val) => updateTarif('voiture', 'adyVarotra', field, val)} />
          <ModeField label="Location journalière" values={tarifs.voiture?.locationJournalier} onChange={(field, val) => updateTarif('voiture', 'locationJournalier', field, val)} isLocation />
        </VehicleCard>

        {/* Bus - Tarif fixe */}
        <TarifFixeCard label={VEHICLE_LABELS.bus} value={tarifs.bus?.tarifFixe?.prixTrajet || 0} onChange={(val) => updateTarifFixe('bus', val)} />

        {/* Mini Van - Tarif fixe */}
        <TarifFixeCard label={VEHICLE_LABELS.minivan} value={tarifs.minivan?.tarifFixe?.prixTrajet || 0} onChange={(val) => updateTarifFixe('minivan', val)} />

        {/* Tricycle - Tarif fixe */}
        <TarifFixeCard label={VEHICLE_LABELS.tricycle} value={tarifs.tricycle?.tarifFixe?.prixTrajet || 0} onChange={(val) => updateTarifFixe('tricycle', val)} />

        {/* Commission */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">📊 Commission</h2>
          <label className="block text-xs text-gray-500 mb-1">Part chauffeur (%)</label>
          <div className="flex items-center gap-3">
            <input type="range" min="0" max="50" value={commission} onChange={e => setCommission(Number(e.target.value))} className="flex-1" />
            <span className="text-sm font-bold w-12 text-right">{commission}%</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm">
          <Save size={16} /> {saved ? '✓ Sauvegardé !' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}

function VehicleCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
      <h2 className="text-lg font-semibold mb-4">{label}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ModeField({ label, values, onChange, isLocation }: { label: string; values?: any; onChange: (field: string, value: number) => void; isLocation?: boolean }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border">
      <h4 className="text-sm font-medium mb-2">{label}</h4>
      <div className={`grid ${isLocation ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Base (Ar)</label>
          <input type="number" value={values?.prixBase || 0} onChange={e => onChange('prixBase', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" />
        </div>
        {!isLocation && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Km (Ar)</label>
            <input type="number" value={values?.prixKm || 0} onChange={e => onChange('prixKm', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" />
          </div>
        )}
      </div>
    </div>
  );
}

function TarifFixeCard({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
      <h2 className="text-lg font-semibold mb-2">{label}</h2>
      <p className="text-xs text-gray-500 mb-4">Tarif fixe pour trajet point de départ → terminus</p>
      <div className="max-w-xs">
        <label className="block text-xs text-gray-500 mb-1">Tarif trajet (Ar)</label>
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} className="w-full px-3 py-2 border rounded text-sm" />
      </div>
    </div>
  );
}
