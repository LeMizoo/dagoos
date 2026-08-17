'use client';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { DollarSign, Save, AlertCircle } from 'lucide-react';

const DEFAULT_COOP_TARIFS: any = {
  livraison: {
    courseNormale: { prixBase: 3000, prixKm: 600 },
    courseExpress: { prixBase: 5000, prixKm: 900 },
  },
  transportCommun: {
    tarifLigne: { prixTrajet: 4000 },
  },
  transportMarchandises: {
    barème: { prixBase: 10000, prixKm: 1500, prixTonne: 5000 },
  },
  locationVoiture: {
    tarifJour: { prixJour: 45000 },
  },
};

const SERVICE_LABELS: Record<string, string> = {
  livraison: '📦 Livraison',
  transportCommun: '🚌 Transport en commun',
  transportMarchandises: '🚛 Transport de marchandises',
  locationVoiture: '🔑 Voiture de location',
};

export default function CoopSettingsPage() {
  const [tarifs, setTarifs] = useState(DEFAULT_COOP_TARIFS);
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

  function updateTarif(service: string, mode: string, field: string, value: number) {
    setTarifs((prev: any) => ({
      ...prev,
      [service]: {
        ...prev[service],
        [mode]: {
          ...prev[service]?.[mode],
          [field]: value,
        },
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
        {/* Livraison */}
        <ServiceCard label={SERVICE_LABELS.livraison}>
          <ModeField label="Course normale" values={tarifs.livraison?.courseNormale} onChange={(f, v) => updateTarif('livraison', 'courseNormale', f, v)} />
          <ModeField label="Course express" values={tarifs.livraison?.courseExpress} onChange={(f, v) => updateTarif('livraison', 'courseExpress', f, v)} />
        </ServiceCard>

        {/* Transport en commun */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-2">{SERVICE_LABELS.transportCommun}</h2>
          <p className="text-xs text-gray-500 mb-4">Tarif par trajet / ligne</p>
          <div className="max-w-xs">
            <label className="block text-xs text-gray-500 mb-1">Tarif trajet (Ar)</label>
            <input type="number" value={tarifs.transportCommun?.tarifLigne?.prixTrajet || 0} onChange={e => updateTarif('transportCommun', 'tarifLigne', 'prixTrajet', Number(e.target.value))} className="w-full px-3 py-2 border rounded text-sm" />
          </div>
        </div>

        {/* Transport de marchandises */}
        <ServiceCard label={SERVICE_LABELS.transportMarchandises}>
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h4 className="text-sm font-medium mb-2">Barème spécifique</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Base (Ar)</label>
                <input type="number" value={tarifs.transportMarchandises?.barème?.prixBase || 0} onChange={e => updateTarif('transportMarchandises', 'barème', 'prixBase', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Km (Ar)</label>
                <input type="number" value={tarifs.transportMarchandises?.barème?.prixKm || 0} onChange={e => updateTarif('transportMarchandises', 'barème', 'prixKm', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tonne (Ar)</label>
                <input type="number" value={tarifs.transportMarchandises?.barème?.prixTonne || 0} onChange={e => updateTarif('transportMarchandises', 'barème', 'prixTonne', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" />
              </div>
            </div>
          </div>
        </ServiceCard>

        {/* Voiture de location */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-2">{SERVICE_LABELS.locationVoiture}</h2>
          <p className="text-xs text-gray-500 mb-4">Tarif de location</p>
          <div className="max-w-xs">
            <label className="block text-xs text-gray-500 mb-1">Tarif / jour (Ar)</label>
            <input type="number" value={tarifs.locationVoiture?.tarifJour?.prixJour || 0} onChange={e => updateTarif('locationVoiture', 'tarifJour', 'prixJour', Number(e.target.value))} className="w-full px-3 py-2 border rounded text-sm" />
          </div>
        </div>

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
        <button onClick={handleSave} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 text-sm">
          <Save size={16} /> {saved ? '✓ Sauvegardé !' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}

function ServiceCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
      <h2 className="text-lg font-semibold mb-4">{label}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ModeField({ label, values, onChange }: { label: string; values?: any; onChange: (field: string, value: number) => void }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border">
      <h4 className="text-sm font-medium mb-2">{label}</h4>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Base (Ar)</label>
          <input type="number" value={values?.prixBase || 0} onChange={e => onChange('prixBase', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Km (Ar)</label>
          <input type="number" value={values?.prixKm || 0} onChange={e => onChange('prixKm', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" />
        </div>
      </div>
    </div>
  );
}
