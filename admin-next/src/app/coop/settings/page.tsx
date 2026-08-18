'use client';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';

const DEFAULT_TARIFS: any = {
  livraison: {
    regionale: {
      courseNormale: { prixBase: 3000, prixKm: 600 },
      courseExpress: { prixBase: 5000, prixKm: 900 },
    },
    nationale: {
      courseNormale: { prixBase: 6000, prixKm: 1200 },
      courseExpress: { prixBase: 9000, prixKm: 1800 },
    },
  },
  transportCommun: {
    regionale: { tarifLigne: { prixTrajet: 4000 } },
    nationale: { tarifLigne: { prixTrajet: 8000 } },
  },
  transportMarchandises: {
    regionale: { bareme: { prixBase: 10000, prixKm: 1500, prixTonne: 5000 } },
    nationale: { bareme: { prixBase: 20000, prixKm: 2500, prixTonne: 8000 } },
  },
  locationVoiture: {
    touristique: { tarifJour: 60000 },
    familiale: { tarifJour: 45000 },
    autres: { tarifJour: 35000 },
  },
};

export default function CoopSettingsPage() {
  const [tarifs, setTarifs] = useState(DEFAULT_TARIFS);
  const [commission, setCommission] = useState(20);
  const [mobileMoney, setMobileMoney] = useState({ mvola: '', orange: '', airtel: '' });
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
        if (data?.mobileMoney) setMobileMoney(data.mobileMoney);
      }
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  function updateTarif(service: string, zone: string, mode: string, field: string, value: number) {
    setTarifs((prev: any) => ({
      ...prev,
      [service]: {
        ...prev[service],
        [zone]: {
          ...prev[service]?.[zone],
          [mode]: { ...prev[service]?.[zone]?.[mode], [field]: value },
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
        body: JSON.stringify({ commissionChauffeur: commission, vehiculeTarifs: JSON.stringify(tarifs) }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
      else { const err = await res.json(); setError(err.error || 'Erreur'); }
    } catch (e: any) { setError(e.message); }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">⚙️ Paramètres Coop</h1>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

      <div className="space-y-6">
        {/* Livraison */}
        <Card>
          <h2 className="text-lg font-semibold mb-2">📦 Livraison</h2>
          <p className="text-xs text-gray-500 mb-4">
            <strong>Régionale</strong> : trajet dans la même province (ex : Tanà → Antsirabe)<br />
            <strong>Nationale</strong> : trajet entre 2 provinces différentes (ex : Tanà → Mahajanga)
          </p>
          <ZoneRow label="Régionale" service="livraison" zone="regionale" tarifs={tarifs.livraison?.regionale} onChange={updateTarif} modes={['courseNormale', 'courseExpress']} />
          <ZoneRow label="Nationale" service="livraison" zone="nationale" tarifs={tarifs.livraison?.nationale} onChange={updateTarif} modes={['courseNormale', 'courseExpress']} />
        </Card>

        {/* Transport en commun */}
        <Card>
          <h2 className="text-lg font-semibold mb-2">🚌 Transport en commun</h2>
          <p className="text-xs text-gray-500 mb-4">
            <strong>Régionale</strong> : trajet dans la même province<br />
            <strong>Nationale</strong> : trajet entre 2 provinces différentes
          </p>
          <TarifLigneRow label="Régionale" value={tarifs.transportCommun?.regionale?.tarifLigne?.prixTrajet || 0} onChange={(v) => updateTarif('transportCommun', 'regionale', 'tarifLigne', 'prixTrajet', v)} />
          <TarifLigneRow label="Nationale" value={tarifs.transportCommun?.nationale?.tarifLigne?.prixTrajet || 0} onChange={(v) => updateTarif('transportCommun', 'nationale', 'tarifLigne', 'prixTrajet', v)} />
        </Card>

        {/* Transport de marchandises */}
        <Card>
          <h2 className="text-lg font-semibold mb-2">🚛 Transport de marchandises</h2>
          <p className="text-xs text-gray-500 mb-4">
            <strong>Régionale</strong> : trajet dans la même province<br />
            <strong>Nationale</strong> : trajet entre 2 provinces différentes
          </p>
          <BaremeRow label="Régionale" values={tarifs.transportMarchandises?.regionale?.bareme} onChange={(f, v) => updateTarif('transportMarchandises', 'regionale', 'bareme', f, v)} />
          <BaremeRow label="Nationale" values={tarifs.transportMarchandises?.nationale?.bareme} onChange={(f, v) => updateTarif('transportMarchandises', 'nationale', 'bareme', f, v)} />
        </Card>

        {/* Voiture de location */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">🔑 Voiture de location</h2>
          <JourRow label="Touristique" value={tarifs.locationVoiture?.touristique?.tarifJour || 0} onChange={(v) => updateTarif('locationVoiture', 'touristique', 'tarifJour', 'prixJour', v)} />
          <JourRow label="Familiale" value={tarifs.locationVoiture?.familiale?.tarifJour || 0} onChange={(v) => updateTarif('locationVoiture', 'familiale', 'tarifJour', 'prixJour', v)} />
          <JourRow label="Autres" value={tarifs.locationVoiture?.autres?.tarifJour || 0} onChange={(v) => updateTarif('locationVoiture', 'autres', 'tarifJour', 'prixJour', v)} />
        </Card>

        {/* Mobile Money */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">📱 Numéros Mobile Money</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-yellow-400 rounded-lg p-3">
              <span className="font-bold text-black text-sm w-24">MVola</span>
              <input
                type="text"
                placeholder="034 00 000 00"
                value={mobileMoney.mvola}
                onChange={e => setMobileMoney({ ...mobileMoney, mvola: e.target.value })}
                className="flex-1 px-3 py-2 rounded bg-white text-black text-sm font-semibold"
              />
            </div>
            <div className="flex items-center gap-2 bg-black rounded-lg p-3">
              <span className="font-bold text-orange-500 text-sm w-24">Orange</span>
              <input
                type="text"
                placeholder="032 00 000 00"
                value={mobileMoney.orange}
                onChange={e => setMobileMoney({ ...mobileMoney, orange: e.target.value })}
                className="flex-1 px-3 py-2 rounded bg-gray-800 text-orange-400 text-sm font-semibold border border-orange-500/30"
              />
            </div>
            <div className="flex items-center gap-2 bg-red-600 rounded-lg p-3">
              <span className="font-bold text-white text-sm w-24">Airtel</span>
              <input
                type="text"
                placeholder="033 00 000 00"
                value={mobileMoney.airtel}
                onChange={e => setMobileMoney({ ...mobileMoney, airtel: e.target.value })}
                className="flex-1 px-3 py-2 rounded bg-white text-sm font-semibold"
              />
            </div>
          </div>
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

      <button onClick={handleSave} className="mt-6 bg-emerald-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-emerald-700 text-sm">
        <Save size={16} /> {saved ? '✓ Sauvegardé !' : 'Sauvegarder'}
      </button>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">{children}</div>;
}

function ZoneRow({ label, service, zone, tarifs, onChange, modes }: { label: string; service: string; zone: string; tarifs: any; onChange: (s: string, z: string, m: string, f: string, v: number) => void; modes: string[] }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border mb-3">
      <h4 className="text-sm font-semibold mb-2">{label}</h4>
      <div className="space-y-3">
        {modes.map(mode => (
          <div key={mode} className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
            <h5 className="text-xs font-medium mb-2">{mode === 'courseNormale' ? 'Course normale' : 'Course express'}</h5>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-xs text-gray-500 mb-1">Base (Ar)</label><input type="number" value={tarifs?.[mode]?.prixBase || 0} onChange={e => onChange(service, zone, mode, 'prixBase', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Km (Ar)</label><input type="number" value={tarifs?.[mode]?.prixKm || 0} onChange={e => onChange(service, zone, mode, 'prixKm', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TarifLigneRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border mb-3">
      <h4 className="text-sm font-medium mb-2">{label}</h4>
      <div className="max-w-[200px]">
        <label className="block text-xs text-gray-500 mb-1">Tarif trajet / ligne (Ar)</label>
        <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" />
      </div>
    </div>
  );
}

function BaremeRow({ label, values, onChange }: { label: string; values: any; onChange: (f: string, v: number) => void }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border mb-3">
      <h4 className="text-sm font-medium mb-2">{label}</h4>
      <div className="grid grid-cols-3 gap-2">
        <div><label className="block text-xs text-gray-500 mb-1">Base (Ar)</label><input type="number" value={values?.prixBase || 0} onChange={e => onChange('prixBase', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" /></div>
        <div><label className="block text-xs text-gray-500 mb-1">Km (Ar)</label><input type="number" value={values?.prixKm || 0} onChange={e => onChange('prixKm', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" /></div>
        <div><label className="block text-xs text-gray-500 mb-1">Tonne (Ar)</label><input type="number" value={values?.prixTonne || 0} onChange={e => onChange('prixTonne', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs" /></div>
      </div>
    </div>
  );
}

function JourRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border mb-3">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-xs max-w-[200px]" />
    </div>
  );
}
