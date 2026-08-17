'use client';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';

const DEFAULT_TARIFS: any = {
  moto: {
    courseNormale: { prixBase: 2000, prixKm: 500 },
    adyVarotra: { prixBase: 2500, prixKm: 600 },
    locationJournalier: { prixJour: 15000 },
  },
  voiture: {
    courseNormale: { prixBase: 4000, prixKm: 800 },
    adyVarotra: { prixBase: 5000, prixKm: 1000 },
    locationJournalier: { prixJour: 35000 },
  },
  bus: { tarifFixe: { prixTrajet: 6000 }, locationSpeciale: { disponible: false, prixJour: 50000 } },
  minivan: { tarifFixe: { prixTrajet: 5000 }, locationSpeciale: { disponible: false, prixJour: 45000 } },
  tricycle: { tarifFixe: { prixTrajet: 1500 }, locationSpeciale: { disponible: false, prixJour: 12000 } },
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
        if (data?.vehiculeTarifs) setTarifs(JSON.parse(data.vehiculeTarifs));
        if (data?.commissionChauffeur !== undefined) setCommission(data.commissionChauffeur);
      }
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  function updateMode(key: string, mode: string, field: string, value: number) {
    setTarifs((prev: any) => ({
      ...prev,
      [key]: { ...prev[key], [mode]: { ...prev[key]?.[mode], [field]: value } },
    }));
  }

  function updateLocationSpeciale(key: string, field: string, value: any) {
    setTarifs((prev: any) => ({
      ...prev,
      [key]: { ...prev[key], locationSpeciale: { ...prev[key]?.locationSpeciale, [field]: value } },
    }));
  }

  async function handleSave() {
    setError('');
    if (!orgId) { setError('Organisation non trouvée'); return; }
    try {
      const res = await apiFetch(`/tarifs/${orgId}`, {
        method: 'PUT',
        body: JSON.stringify({ commissionChauffeur: commission, vehiculeTarifs: JSON.stringify(tarifs) }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
      else { const err = await res.json(); setError(err.error || 'Erreur'); }
    } catch (e: any) { setError(e.message); }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">⚙️ Paramètres Fleet</h1>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

      <div className="space-y-6">
        {/* Taxi Moto */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">🏍️ Taxi Moto</h2>
          <ModeRow label="Course normale" base={tarifs.moto?.courseNormale?.prixBase || 0} km={tarifs.moto?.courseNormale?.prixKm || 0} onChange={(f, v) => updateMode('moto', 'courseNormale', f, v)} />
          <ModeRow label="Ady varotra" base={tarifs.moto?.adyVarotra?.prixBase || 0} km={tarifs.moto?.adyVarotra?.prixKm || 0} onChange={(f, v) => updateMode('moto', 'adyVarotra', f, v)} />
          <JourRow label="Location journalière" value={tarifs.moto?.locationJournalier?.prixJour || 0} onChange={(v) => updateMode('moto', 'locationJournalier', 'prixJour', v)} />
        </Card>

        {/* Taxi */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">🚗 Taxi</h2>
          <ModeRow label="Course normale" base={tarifs.voiture?.courseNormale?.prixBase || 0} km={tarifs.voiture?.courseNormale?.prixKm || 0} onChange={(f, v) => updateMode('voiture', 'courseNormale', f, v)} />
          <ModeRow label="Ady varotra" base={tarifs.voiture?.adyVarotra?.prixBase || 0} km={tarifs.voiture?.adyVarotra?.prixKm || 0} onChange={(f, v) => updateMode('voiture', 'adyVarotra', f, v)} />
          <JourRow label="Location journalière" value={tarifs.voiture?.locationJournalier?.prixJour || 0} onChange={(v) => updateMode('voiture', 'locationJournalier', 'prixJour', v)} />
        </Card>

        {/* Bus */}
        <Card>
          <h2 className="text-lg font-semibold mb-2">🚌 Bus</h2>
          <p className="text-xs text-gray-500 mb-4">Tarif fixe pour trajet point de départ → terminus</p>
          <JourRow label="Tarif trajet (Ar)" value={tarifs.bus?.tarifFixe?.prixTrajet || 0} onChange={(v) => updateMode('bus', 'tarifFixe', 'prixTrajet', v)} />
          <LocationSpeciale
            active={tarifs.bus?.locationSpeciale?.active || false}
            prix={tarifs.bus?.locationSpeciale?.prixJour || 0}
            onToggle={(v) => updateLocationSpeciale('bus', 'active', v)}
            onPrix={(v) => updateLocationSpeciale('bus', 'prixJour', v)}
          />
        </Card>

        {/* Mini Van */}
        <Card>
          <h2 className="text-lg font-semibold mb-2">🚐 Mini Van</h2>
          <p className="text-xs text-gray-500 mb-4">Tarif fixe pour trajet point de départ → terminus</p>
          <JourRow label="Tarif trajet (Ar)" value={tarifs.minivan?.tarifFixe?.prixTrajet || 0} onChange={(v) => updateMode('minivan', 'tarifFixe', 'prixTrajet', v)} />
          <LocationSpeciale
            active={tarifs.minivan?.locationSpeciale?.active || false}
            prix={tarifs.minivan?.locationSpeciale?.prixJour || 0}
            onToggle={(v) => updateLocationSpeciale('minivan', 'active', v)}
            onPrix={(v) => updateLocationSpeciale('minivan', 'prixJour', v)}
          />
        </Card>

        {/* Tricycle */}
        <Card>
          <h2 className="text-lg font-semibold mb-2">🛺 Tricycle</h2>
          <p className="text-xs text-gray-500 mb-4">Tarif fixe pour trajet point de départ → terminus</p>
          <JourRow label="Tarif trajet (Ar)" value={tarifs.tricycle?.tarifFixe?.prixTrajet || 0} onChange={(v) => updateMode('tricycle', 'tarifFixe', 'prixTrajet', v)} />
          <LocationSpeciale
            active={tarifs.tricycle?.locationSpeciale?.active || false}
            prix={tarifs.tricycle?.locationSpeciale?.prixJour || 0}
            onToggle={(v) => updateLocationSpeciale('tricycle', 'active', v)}
            onPrix={(v) => updateLocationSpeciale('tricycle', 'prixJour', v)}
          />
        </Card>

        {/* Commission */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">📊 Commission chauffeur</h2>
          <div className="flex items-center gap-3">
            <input type="range" min="0" max="50" value={commission} onChange={e => setCommission(Number(e.target.value))} className="flex-1" />
            <span className="text-sm font-bold w-12 text-right">{commission}%</span>
          </div>
        </Card>
      </div>

      <button onClick={handleSave} className="mt-6 bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm">
        <Save size={16} /> {saved ? '✓ Sauvegardé !' : 'Sauvegarder'}
      </button>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">{children}</div>;
}

function ModeRow({ label, base, km, onChange }: { label: string; base: number; km: number; onChange: (field: string, value: number) => void }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border mb-3">
      <h4 className="text-sm font-medium mb-2">{label}</h4>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="block text-xs text-gray-500 mb-1">Base (Ar)</label><input type="number" value={base} onChange={e => onChange('prixBase', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" /></div>
        <div><label className="block text-xs text-gray-500 mb-1">Km (Ar)</label><input type="number" value={km} onChange={e => onChange('prixKm', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" /></div>
      </div>
    </div>
  );
}

function JourRow({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border mb-3">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs max-w-[200px]" />
    </div>
  );
}

function LocationSpeciale({ active, prix, onToggle, onPrix }: { active: boolean; prix: number; onToggle: (v: boolean) => void; onPrix: (v: number) => void }) {
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
