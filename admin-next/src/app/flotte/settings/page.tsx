'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';

// ============================================================
// TYPES DE TARIFS PAR TYPE D'ORGANISATION
// ============================================================

const FLEET_DEFAULT_TARIFS: any = {
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
  bus: { 
    tarifFixe: { prixTrajet: 6000 }, 
    locationSpeciale: { active: false, prixJour: 50000 } 
  },
  minivan: { 
    tarifFixe: { prixTrajet: 5000 }, 
    locationSpeciale: { active: false, prixJour: 45000 } 
  },
  tricycle: { 
    tarifFixe: { prixTrajet: 1500 }, 
    locationSpeciale: { active: false, prixJour: 12000 } 
  },
};

const COOP_DEFAULT_TARIFS: any = {
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

export default function FlotteSettings() {
  const { organization, isUrbain, isInterurbain } = useOrganization();
  const [tarifs, setTarifs] = useState<any>(isUrbain ? FLEET_DEFAULT_TARIFS : COOP_DEFAULT_TARIFS);
  const [commission, setCommission] = useState(20);
  const [mobileMoney, setMobileMoney] = useState({ mvola: '', orange: '', airtel: '' });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const loadSettings = useCallback(async () => {
    if (!organization?.id) return;
    
    try {
      setLoading(true);
      const tRes = await apiFetch(`/tarifs/${organization.id}`);
      if (tRes.ok) {
        const data = await tRes.json();
        if (data?.vehiculeTarifs) {
          const parsedTarifs = JSON.parse(data.vehiculeTarifs);
          setTarifs(parsedTarifs);
        } else {
          // Initialiser avec les tarifs par défaut selon le type
          setTarifs(isUrbain ? FLEET_DEFAULT_TARIFS : COOP_DEFAULT_TARIFS);
        }
        if (data?.commissionChauffeur !== undefined) setCommission(data.commissionChauffeur);
        if (data?.mobileMoney) setMobileMoney(data.mobileMoney);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [organization, isUrbain]);

  useEffect(() => {
    if (organization?.id) {
      loadSettings();
    }
  }, [organization, loadSettings]);

  // ============================================================
  // HANDLERS FLEET (URBAIN)
  // ============================================================

  function updateFleetMode(key: string, mode: string, field: string, value: number) {
    setTarifs((prev: any) => ({
      ...prev,
      [key]: { ...prev[key], [mode]: { ...prev[key]?.[mode], [field]: value } },
    }));
  }

  function updateFleetLocationSpeciale(key: string, field: string, value: any) {
    setTarifs((prev: any) => ({
      ...prev,
      [key]: { ...prev[key], locationSpeciale: { ...prev[key]?.locationSpeciale, [field]: value } },
    }));
  }

  // ============================================================
  // HANDLERS COOP (INTER-URBAIN)
  // ============================================================

  function updateCoopTarif(service: string, zone: string, mode: string, field: string, value: number) {
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
    if (!organization?.id) {
      setError('Organisation non trouvée');
      return;
    }
    
    try {
      const res = await apiFetch(`/tarifs/${organization.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          commissionChauffeur: commission,
          vehiculeTarifs: JSON.stringify(tarifs),
          mobileMoney,
        }),
      });
      
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const err = await res.json();
        setError(err.error || 'Erreur lors de la sauvegarde');
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement des paramètres...</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">⚙️ Paramètres</h1>
          <p className="text-sm text-gray-500">
            {isUrbain ? 'Configuration Urbain' : isInterurbain ? 'Configuration Inter-urbain' : 'Configuration'}
          </p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full ${
          isUrbain ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
        }`}>
          {isUrbain ? 'URBAIN' : 'INTER-URBAIN'}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {saved && (
        <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <CheckCircle size={16} /> Paramètres sauvegardés avec succès !
        </div>
      )}

      <div className="space-y-6">
        {/* ============================================================
            TARIFS URBAIN (FLEET)
            ============================================================ */}
        {isUrbain && (
          <>
            <Card>
              <h2 className="text-lg font-semibold mb-4">🏍️ Taxi Moto</h2>
              <ModeRow label="Course normale" base={tarifs.moto?.courseNormale?.prixBase || 0} km={tarifs.moto?.courseNormale?.prixKm || 0} onChange={(f, v) => updateFleetMode('moto', 'courseNormale', f, v)} />
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                💰 <strong>Ady varotra</strong> : champ libre — le chauffeur saisit le montant négocié dans son application
              </div>
              <JourRow label="Location journalière (Ar)" value={tarifs.moto?.locationJournalier?.prixJour || 0} onChange={(v) => updateFleetMode('moto', 'locationJournalier', 'prixJour', v)} />
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-4">🚗 Taxi</h2>
              <ModeRow label="Course normale" base={tarifs.voiture?.courseNormale?.prixBase || 0} km={tarifs.voiture?.courseNormale?.prixKm || 0} onChange={(f, v) => updateFleetMode('voiture', 'courseNormale', f, v)} />
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                💰 <strong>Ady varotra</strong> : champ libre — le chauffeur saisit le montant négocié dans son application
              </div>
              <JourRow label="Location journalière (Ar)" value={tarifs.voiture?.locationJournalier?.prixJour || 0} onChange={(v) => updateFleetMode('voiture', 'locationJournalier', 'prixJour', v)} />
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-2">🚌 Bus</h2>
              <p className="text-xs text-gray-500 mb-4">Tarif fixe pour trajet point de départ → terminus</p>
              <JourRow label="Tarif trajet (Ar)" value={tarifs.bus?.tarifFixe?.prixTrajet || 0} onChange={(v) => updateFleetMode('bus', 'tarifFixe', 'prixTrajet', v)} />
              <LocationSpeciale
                active={tarifs.bus?.locationSpeciale?.active || false}
                prix={tarifs.bus?.locationSpeciale?.prixJour || 0}
                onToggle={(v) => updateFleetLocationSpeciale('bus', 'active', v)}
                onPrix={(v) => updateFleetLocationSpeciale('bus', 'prixJour', v)}
              />
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-2">🚐 Mini Van</h2>
              <p className="text-xs text-gray-500 mb-4">Tarif fixe pour trajet point de départ → terminus</p>
              <JourRow label="Tarif trajet (Ar)" value={tarifs.minivan?.tarifFixe?.prixTrajet || 0} onChange={(v) => updateFleetMode('minivan', 'tarifFixe', 'prixTrajet', v)} />
              <LocationSpeciale
                active={tarifs.minivan?.locationSpeciale?.active || false}
                prix={tarifs.minivan?.locationSpeciale?.prixJour || 0}
                onToggle={(v) => updateFleetLocationSpeciale('minivan', 'active', v)}
                onPrix={(v) => updateFleetLocationSpeciale('minivan', 'prixJour', v)}
              />
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-2">🛺 Tricycle</h2>
              <p className="text-xs text-gray-500 mb-4">Tarif fixe pour trajet point de départ → terminus</p>
              <JourRow label="Tarif trajet (Ar)" value={tarifs.tricycle?.tarifFixe?.prixTrajet || 0} onChange={(v) => updateFleetMode('tricycle', 'tarifFixe', 'prixTrajet', v)} />
              <LocationSpeciale
                active={tarifs.tricycle?.locationSpeciale?.active || false}
                prix={tarifs.tricycle?.locationSpeciale?.prixJour || 0}
                onToggle={(v) => updateFleetLocationSpeciale('tricycle', 'active', v)}
                onPrix={(v) => updateFleetLocationSpeciale('tricycle', 'prixJour', v)}
              />
            </Card>
          </>
        )}

        {/* ============================================================
            TARIFS INTER-URBAIN (COOP)
            ============================================================ */}
        {isInterurbain && (
          <>
            <Card>
              <h2 className="text-lg font-semibold mb-4">📦 Livraison</h2>
              <ZoneSection title="Régionale">
                <ModeRow label="Course normale" base={tarifs.livraison?.regionale?.courseNormale?.prixBase || 0} km={tarifs.livraison?.regionale?.courseNormale?.prixKm || 0} onChange={(f, v) => updateCoopTarif('livraison', 'regionale', 'courseNormale', f, v)} />
                <ModeRow label="Course express" base={tarifs.livraison?.regionale?.courseExpress?.prixBase || 0} km={tarifs.livraison?.regionale?.courseExpress?.prixKm || 0} onChange={(f, v) => updateCoopTarif('livraison', 'regionale', 'courseExpress', f, v)} />
              </ZoneSection>
              <ZoneSection title="Nationale">
                <ModeRow label="Course normale" base={tarifs.livraison?.nationale?.courseNormale?.prixBase || 0} km={tarifs.livraison?.nationale?.courseNormale?.prixKm || 0} onChange={(f, v) => updateCoopTarif('livraison', 'nationale', 'courseNormale', f, v)} />
                <ModeRow label="Course express" base={tarifs.livraison?.nationale?.courseExpress?.prixBase || 0} km={tarifs.livraison?.nationale?.courseExpress?.prixKm || 0} onChange={(f, v) => updateCoopTarif('livraison', 'nationale', 'courseExpress', f, v)} />
              </ZoneSection>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-4">🚌 Transport en commun</h2>
              <ZoneSection title="Régionale">
                <JourRow label="Tarif ligne (Ar)" value={tarifs.transportCommun?.regionale?.tarifLigne?.prixTrajet || 0} onChange={(v) => updateCoopTarif('transportCommun', 'regionale', 'tarifLigne', 'prixTrajet', v)} />
              </ZoneSection>
              <ZoneSection title="Nationale">
                <JourRow label="Tarif ligne (Ar)" value={tarifs.transportCommun?.nationale?.tarifLigne?.prixTrajet || 0} onChange={(v) => updateCoopTarif('transportCommun', 'nationale', 'tarifLigne', 'prixTrajet', v)} />
              </ZoneSection>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-4">🚛 Transport de marchandises</h2>
              <ZoneSection title="Régionale">
                <BaremeRow
                  base={tarifs.transportMarchandises?.regionale?.bareme?.prixBase || 0}
                  km={tarifs.transportMarchandises?.regionale?.bareme?.prixKm || 0}
                  tonne={tarifs.transportMarchandises?.regionale?.bareme?.prixTonne || 0}
                  onChange={(f, v) => updateCoopTarif('transportMarchandises', 'regionale', 'bareme', f, v)}
                />
              </ZoneSection>
              <ZoneSection title="Nationale">
                <BaremeRow
                  base={tarifs.transportMarchandises?.nationale?.bareme?.prixBase || 0}
                  km={tarifs.transportMarchandises?.nationale?.bareme?.prixKm || 0}
                  tonne={tarifs.transportMarchandises?.nationale?.bareme?.prixTonne || 0}
                  onChange={(f, v) => updateCoopTarif('transportMarchandises', 'nationale', 'bareme', f, v)}
                />
              </ZoneSection>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-4">🔑 Location de voiture</h2>
              <JourRow label="Touristique (Ar/jour)" value={tarifs.locationVoiture?.touristique?.tarifJour || 0} onChange={(v) => updateCoopTarif('locationVoiture', 'touristique', 'tarifJour', 'prixJour', v)} />
              <JourRow label="Familiale (Ar/jour)" value={tarifs.locationVoiture?.familiale?.tarifJour || 0} onChange={(v) => updateCoopTarif('locationVoiture', 'familiale', 'tarifJour', 'prixJour', v)} />
              <JourRow label="Autres (Ar/jour)" value={tarifs.locationVoiture?.autres?.tarifJour || 0} onChange={(v) => updateCoopTarif('locationVoiture', 'autres', 'tarifJour', 'prixJour', v)} />
            </Card>
          </>
        )}

        {/* ============================================================
            COMMUN : MOBILE MONEY
            ============================================================ */}
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

        {/* ============================================================
            COMMUN : COMMISSION
            ============================================================ */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">📊 Commission chauffeur</h2>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="50"
              value={commission}
              onChange={e => setCommission(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-bold w-12 text-right">{commission}%</span>
          </div>
        </Card>
      </div>

      <button
        onClick={handleSave}
        className="mt-6 bg-emerald-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-emerald-700 text-sm"
      >
        <Save size={16} /> {saved ? '✓ Sauvegardé !' : 'Sauvegarder'}
      </button>
    </div>
  );
}

// ============================================================
// COMPOSANTS RÉUTILISABLES
// ============================================================

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">{children}</div>;
}

function ZoneSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">{title}</h3>
      {children}
    </div>
  );
}

function ModeRow({ label, base, km, onChange }: { label: string; base: number; km: number; onChange: (field: string, value: number) => void }) {
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

function BaremeRow({ base, km, tonne, onChange }: { base: number; km: number; tonne: number; onChange: (field: string, value: number) => void }) {
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
