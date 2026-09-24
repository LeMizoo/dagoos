'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import { Save, AlertCircle, CheckCircle, Palette } from 'lucide-react';
import LandingPageSettings from '@/components/settings/LandingPageSettings';
import InterurbainTarifsSettings from '@/components/settings/InterurbainTarifsSettings';
import ServiceTariffsEditor from '@/components/settings/ServiceTariffsEditor';
import {
  Card,
  ZoneSection,
  ModeRow,
  JourRow,
  LocationSpeciale,
  BaremeRow,
} from '@/components/settings/_shared/TarifRows';
import { useTheme } from '@/lib/theme-context';

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
    locationSpeciale: { active: false, prixJour: 50000 },
  },
  minivan: {
    tarifFixe: { prixTrajet: 5000 },
    locationSpeciale: { active: false, prixJour: 45000 },
  },
  tricycle: {
    tarifFixe: { prixTrajet: 1500 },
    locationSpeciale: { active: false, prixJour: 12000 },
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
    regionale: {
      bareme: {
        prixBase: 10000,
        prixKm: 1500,
        prixTonne: 5000,
      },
    },
    nationale: {
      bareme: {
        prixBase: 20000,
        prixKm: 2500,
        prixTonne: 8000,
      },
    },
  },
  locationVoiture: {
    touristique: { tarifJour: 60000 },
    familiale: { tarifJour: 45000 },
    autres: { tarifJour: 35000 },
  },
  bus: {
    longueDistance: {
      prixBase: 50000,
      prixKm: 1500,
      forfaitService: 100000,
    },
  },
  minivan: {
    longueDistance: {
      prixBase: 40000,
      prixKm: 1200,
      forfaitService: 80000,
    },
  },
  fourgon: {
    longueDistance: {
      prixBase: 60000,
      prixKm: 1800,
      forfaitService: 120000,
    },
  },
  camion: {
    longueDistance: {
      prixBase: 80000,
      prixKm: 2200,
      forfaitService: 150000,
    },
  },
  semi_remorque: {
    longueDistance: {
      prixBase: 120000,
      prixKm: 3000,
      forfaitService: 200000,
    },
  },
  depanneuse: {
    longueDistance: {
      prixBase: 70000,
      prixKm: 2000,
      forfaitService: 130000,
    },
  },
  camion_frigo: {
    longueDistance: {
      prixBase: 100000,
      prixKm: 2500,
      forfaitService: 180000,
    },
  },
};

export default function FlotteSettings() {
  const { organization, isUrbain, isInterurbain } = useOrganization();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'tarifs';

  const [tarifs, setTarifs] = useState<any>(
    isUrbain ? FLEET_DEFAULT_TARIFS : COOP_DEFAULT_TARIFS,
  );

  const [commission, setCommission] = useState(20);

  const [mobileMoney, setMobileMoney] = useState({
    mvola: '',
    orange: '',
    airtel: '',
  });

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { theme, setTheme } = useTheme();

  const loadSettings = useCallback(async () => {
    if (!organization?.id) return;

    try {
      setLoading(true);

      const tRes = await apiFetch(
        `/tarifs/${organization.id}`,
      );

      if (tRes.ok) {
        const data = await tRes.json();

        if (data?.vehiculeTarifs) {
          const parsedTarifs = JSON.parse(
            data.vehiculeTarifs,
          );

          setTarifs(parsedTarifs);
        } else {
          setTarifs(
            isUrbain
              ? FLEET_DEFAULT_TARIFS
              : COOP_DEFAULT_TARIFS,
          );
        }

        if (
          data?.commissionChauffeur !== undefined
        ) {
          setCommission(
            data.commissionChauffeur,
          );
        }

        if (data?.mobileMoney) {
          setMobileMoney(data.mobileMoney);
        }
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

  function updateFleetMode(
    key: string,
    mode: string,
    field: string,
    value: number,
  ) {
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

  function updateFleetLocationSpeciale(
    key: string,
    field: string,
    value: any,
  ) {
    setTarifs((prev: any) => ({
      ...prev,
      [key]: {
        ...prev[key],
        locationSpeciale: {
          ...prev[key]?.locationSpeciale,
          [field]: value,
        },
      },
    }));
  }

  // ============================================================
  // HANDLERS COOP (INTER-URBAIN)
  // ============================================================

  function updateLongueDistance(
    vehicle: string,
    field: string,
    value: number,
  ) {
    setTarifs((prev: any) => ({
      ...prev,
      [vehicle]: {
        ...prev[vehicle],
        longueDistance: {
          ...prev[vehicle]?.longueDistance,
          [field]: value,
        },
      },
    }));
  }

  function updateCoopTarif(
    service: string,
    zone: string,
    mode: string,
    field: string,
    value: number,
  ) {
    setTarifs((prev: any) => ({
      ...prev,
      [service]: {
        ...prev[service],
        [zone]: {
          ...prev[service]?.[zone],
          [mode]: {
            ...prev[service]?.[zone]?.[mode],
            [field]: value,
          },
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
      const res = await apiFetch(
        `/tarifs/${organization.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            commissionChauffeur: commission,
            vehiculeTarifs: JSON.stringify(tarifs),
            mobileMoney,
          }),
        },
      );

      if (res.ok) {
        setSaved(true);

        setTimeout(() => {
          setSaved(false);
        }, 2000);
      } else {
        const err = await res.json();

        setError(
          err.error ||
            'Erreur lors de la sauvegarde',
        );
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400">
        Chargement des paramètres...
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            ⚙️ Paramètres
          </h1>

          <p className="text-sm text-gray-500">
            {isUrbain
              ? 'Configuration Urbain'
              : isInterurbain
                ? 'Configuration Inter-urbain'
                : 'Configuration'}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs ${
            isUrbain
              ? 'bg-blue-100 text-blue-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {isUrbain
            ? 'URBAIN'
            : 'INTER-URBAIN'}
        </span>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {saved && currentTab !== 'tarifs-v2' && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-600">
          <CheckCircle size={16} />
          Paramètres sauvegardés avec succès !
        </div>
      )}

      {/* ============================================================
          TARIFS V1
          ============================================================ */}

      {currentTab === 'tarifs' && (
        <>
          <div className="space-y-6">
            {/* ========================================================
                TARIFS URBAIN (FLEET)
                ======================================================== */}

            {isUrbain && (
              <>
                <Card>
                  <h2 className="mb-4 text-lg font-semibold">
                    🏍️ Taxi Moto
                  </h2>

                  <ModeRow
                    label="Course normale"
                    base={
                      tarifs.moto
                        ?.courseNormale
                        ?.prixBase || 0
                    }
                    km={
                      tarifs.moto
                        ?.courseNormale
                        ?.prixKm || 0
                    }
                    onChange={(
                      f,
                      v,
                    ) =>
                      updateFleetMode(
                        'moto',
                        'courseNormale',
                        f,
                        v,
                      )
                    }
                  />

                  <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                    💰{' '}
                    <strong>
                      Ady varotra
                    </strong>{' '}
                    : champ libre — le
                    chauffeur saisit le
                    montant négocié dans
                    son application
                  </div>

                  <JourRow
                    label="Location journalière (Ar)"
                    value={
                      tarifs.moto
                        ?.locationJournalier
                        ?.prixJour || 0
                    }
                    onChange={(v) =>
                      updateFleetMode(
                        'moto',
                        'locationJournalier',
                        'prixJour',
                        v,
                      )
                    }
                  />
                </Card>

                <Card>
                  <h2 className="mb-4 text-lg font-semibold">
                    🚗 Taxi
                  </h2>

                  <ModeRow
                    label="Course normale"
                    base={
                      tarifs.voiture
                        ?.courseNormale
                        ?.prixBase || 0
                    }
                    km={
                      tarifs.voiture
                        ?.courseNormale
                        ?.prixKm || 0
                    }
                    onChange={(
                      f,
                      v,
                    ) =>
                      updateFleetMode(
                        'voiture',
                        'courseNormale',
                        f,
                        v,
                      )
                    }
                  />

                  <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                    💰{' '}
                    <strong>
                      Ady varotra
                    </strong>{' '}
                    : champ libre — le
                    chauffeur saisit le
                    montant négocié dans
                    son application
                  </div>

                  <JourRow
                    label="Location journalière (Ar)"
                    value={
                      tarifs.voiture
                        ?.locationJournalier
                        ?.prixJour || 0
                    }
                    onChange={(v) =>
                      updateFleetMode(
                        'voiture',
                        'locationJournalier',
                        'prixJour',
                        v,
                      )
                    }
                  />
                </Card>

                <Card>
                  <h2 className="mb-2 text-lg font-semibold">
                    🚌 Bus
                  </h2>

                  <p className="mb-4 text-xs text-gray-500">
                    Tarif fixe pour trajet
                    point de départ → terminus
                  </p>

                  <JourRow
                    label="Tarif trajet (Ar)"
                    value={
                      tarifs.bus
                        ?.tarifFixe
                        ?.prixTrajet || 0
                    }
                    onChange={(v) =>
                      updateFleetMode(
                        'bus',
                        'tarifFixe',
                        'prixTrajet',
                        v,
                      )
                    }
                  />

                  <LocationSpeciale
                    active={
                      tarifs.bus
                        ?.locationSpeciale
                        ?.active || false
                    }
                    prix={
                      tarifs.bus
                        ?.locationSpeciale
                        ?.prixJour || 0
                    }
                    onToggle={(v) =>
                      updateFleetLocationSpeciale(
                        'bus',
                        'active',
                        v,
                      )
                    }
                    onPrix={(v) =>
                      updateFleetLocationSpeciale(
                        'bus',
                        'prixJour',
                        v,
                      )
                    }
                  />
                </Card>

                <Card>
                  <h2 className="mb-2 text-lg font-semibold">
                    🚐 Mini Van
                  </h2>

                  <p className="mb-4 text-xs text-gray-500">
                    Tarif fixe pour trajet
                    point de départ → terminus
                  </p>

                  <JourRow
                    label="Tarif trajet (Ar)"
                    value={
                      tarifs.minivan
                        ?.tarifFixe
                        ?.prixTrajet || 0
                    }
                    onChange={(v) =>
                      updateFleetMode(
                        'minivan',
                        'tarifFixe',
                        'prixTrajet',
                        v,
                      )
                    }
                  />

                  <LocationSpeciale
                    active={
                      tarifs.minivan
                        ?.locationSpeciale
                        ?.active || false
                    }
                    prix={
                      tarifs.minivan
                        ?.locationSpeciale
                        ?.prixJour || 0
                    }
                    onToggle={(v) =>
                      updateFleetLocationSpeciale(
                        'minivan',
                        'active',
                        v,
                      )
                    }
                    onPrix={(v) =>
                      updateFleetLocationSpeciale(
                        'minivan',
                        'prixJour',
                        v,
                      )
                    }
                  />
                </Card>

                <Card>
                  <h2 className="mb-2 text-lg font-semibold">
                    🛺 Tricycle
                  </h2>

                  <p className="mb-4 text-xs text-gray-500">
                    Tarif fixe pour trajet
                    point de départ → terminus
                  </p>

                  <JourRow
                    label="Tarif trajet (Ar)"
                    value={
                      tarifs.tricycle
                        ?.tarifFixe
                        ?.prixTrajet || 0
                    }
                    onChange={(v) =>
                      updateFleetMode(
                        'tricycle',
                        'tarifFixe',
                        'prixTrajet',
                        v,
                      )
                    }
                  />

                  <LocationSpeciale
                    active={
                      tarifs.tricycle
                        ?.locationSpeciale
                        ?.active || false
                    }
                    prix={
                      tarifs.tricycle
                        ?.locationSpeciale
                        ?.prixJour || 0
                    }
                    onToggle={(v) =>
                      updateFleetLocationSpeciale(
                        'tricycle',
                        'active',
                        v,
                      )
                    }
                    onPrix={(v) =>
                      updateFleetLocationSpeciale(
                        'tricycle',
                        'prixJour',
                        v,
                      )
                    }
                  />
                </Card>
              </>
            )}

            {/* ========================================================
                TARIFS INTER-URBAIN (COOP)
                ======================================================== */}

            {isInterurbain && (
              <InterurbainTarifsSettings
                tarifs={tarifs}
                setTarifs={setTarifs}
              />
            )}

            {/* ========================================================
                COMMUN : MOBILE MONEY
                ======================================================== */}

            <Card>
              <h2 className="mb-4 text-lg font-semibold">
                📱 Numéros Mobile Money
              </h2>

              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-lg bg-yellow-400 p-3">
                  <span className="w-24 text-sm font-bold text-black">
                    MVola
                  </span>

                  <input
                    type="text"
                    placeholder="034 00 000 00"
                    value={
                      mobileMoney.mvola
                    }
                    onChange={(e) =>
                      setMobileMoney({
                        ...mobileMoney,
                        mvola:
                          e.target.value,
                      })
                    }
                    className="flex-1 rounded bg-white px-3 py-2 text-sm font-semibold text-black"
                  />
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-black p-3">
                  <span className="w-24 text-sm font-bold text-orange-500">
                    Orange
                  </span>

                  <input
                    type="text"
                    placeholder="032 00 000 00"
                    value={
                      mobileMoney.orange
                    }
                    onChange={(e) =>
                      setMobileMoney({
                        ...mobileMoney,
                        orange:
                          e.target.value,
                      })
                    }
                    className="flex-1 rounded border border-orange-500/30 bg-gray-800 px-3 py-2 text-sm font-semibold text-orange-400"
                  />
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-red-600 p-3">
                  <span className="w-24 text-sm font-bold text-white">
                    Airtel
                  </span>

                  <input
                    type="text"
                    placeholder="033 00 000 00"
                    value={
                      mobileMoney.airtel
                    }
                    onChange={(e) =>
                      setMobileMoney({
                        ...mobileMoney,
                        airtel:
                          e.target.value,
                      })
                    }
                    className="flex-1 rounded bg-white px-3 py-2 text-sm font-semibold"
                  />
                </div>
              </div>
            </Card>

            {/* ========================================================
                COMMUN : COMMISSION
                ======================================================== */}

            <Card>
              <h2 className="mb-4 text-lg font-semibold">
                📊 Commission chauffeur
              </h2>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={commission}
                  onChange={(e) =>
                    setCommission(
                      Number(
                        e.target.value,
                      ),
                    )
                  }
                  className="flex-1"
                />

                <span className="w-12 text-right text-sm font-bold">
                  {commission}%
                </span>
              </div>
            </Card>
          </div>

          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Palette size={18} />
              Apparence
            </h2>

            <div className="flex max-w-lg gap-2">
              {[
                {
                  id: 'light' as const,
                  icon: '☀️',
                  label: 'Clair',
                },
                {
                  id: 'dark' as const,
                  icon: '🌙',
                  label: 'Sombre',
                },
                {
                  id: 'system' as const,
                  icon: '💻',
                  label: 'Système',
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    setTheme(item.id)
                  }
                  className={`flex-1 rounded-xl border p-3 text-center transition-all ${
                    theme === item.id
                      ? 'border-blue-300 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="text-lg">
                    {item.icon}
                  </div>

                  <div className="mt-1 text-xs">
                    {item.label}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ============================================================
          TARIFS V2
          Catalogue tarifaire propre à l'organisation connectée.
          Le backend reste la source de vérité pour l'autorisation
          et l'isolation de l'organisation.
          ============================================================ */}

      {currentTab === 'tarifs-v2' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Tarifs V2
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Gestion du catalogue tarifaire V2
              de votre organisation.
            </p>
          </div>

          <ServiceTariffsEditor mode="organization" />
        </div>
      )}

      {/* ============================================================
          LANDING PAGE PREMIUM
          Le composant est partagé entre Fleet et Coop.
          Le template dépend automatiquement du type d'organisation.
          ============================================================ */}

      {currentTab === 'landing' && (
        <>
          {isUrbain && (
            <LandingPageSettings
              app="fleet"
            />
          )}

          {isInterurbain && (
            <LandingPageSettings
              app="coop"
            />
          )}
        </>
      )}

      {/* ============================================================
          SAUVEGARDE V1 UNIQUEMENT
          ============================================================ */}

      {currentTab === 'tarifs' && (
        <button
          onClick={handleSave}
          className="mt-6 flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm text-white hover:bg-emerald-700"
        >
          <Save size={16} />

          {saved
            ? '✓ Sauvegardé !'
            : 'Sauvegarder'}
        </button>
      )}
    </div>
  );
}