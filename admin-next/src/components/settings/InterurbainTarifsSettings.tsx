'use client';

// ============================================================
// InterurbainTarifsSettings — Parametres tarifaires interurbain
// V1 — Chantier Parametres
//
// Extraction depuis admin-next/src/app/flotte/settings/page.tsx
// Utilise les helpers _shared/TarifRows
//
// Parent : fournit tarifs + setTarifs (etat central)
// Enfant : rend les cartes interurbaines uniquement
// ============================================================

import { Card, ZoneSection, ModeRow, JourRow, BaremeRow } from './_shared/TarifRows';

interface InterurbainTarifsSettingsProps {
  tarifs: any;
  setTarifs: (updater: (prev: any) => any) => void;
}

export default function InterurbainTarifsSettings({
  tarifs,
  setTarifs,
}: InterurbainTarifsSettingsProps) {
  // ---------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------
  function updateCoopTarif(
    service: string,
    zone: string,
    mode: string,
    field: string,
    value: number
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

  function updateLongueDistance(vehicle: string, field: string, value: number) {
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

  // ---------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------
  return (
    <>
      {/* Livraison */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">📦 Livraison</h2>
        <ZoneSection title="Régionale">
          <ModeRow
            label="Course normale"
            base={tarifs.livraison?.regionale?.courseNormale?.prixBase || 0}
            km={tarifs.livraison?.regionale?.courseNormale?.prixKm || 0}
            onChange={(f, v) =>
              updateCoopTarif('livraison', 'regionale', 'courseNormale', f, v)
            }
          />
          <ModeRow
            label="Course express"
            base={tarifs.livraison?.regionale?.courseExpress?.prixBase || 0}
            km={tarifs.livraison?.regionale?.courseExpress?.prixKm || 0}
            onChange={(f, v) =>
              updateCoopTarif('livraison', 'regionale', 'courseExpress', f, v)
            }
          />
        </ZoneSection>
        <ZoneSection title="Nationale">
          <ModeRow
            label="Course normale"
            base={tarifs.livraison?.nationale?.courseNormale?.prixBase || 0}
            km={tarifs.livraison?.nationale?.courseNormale?.prixKm || 0}
            onChange={(f, v) =>
              updateCoopTarif('livraison', 'nationale', 'courseNormale', f, v)
            }
          />
          <ModeRow
            label="Course express"
            base={tarifs.livraison?.nationale?.courseExpress?.prixBase || 0}
            km={tarifs.livraison?.nationale?.courseExpress?.prixKm || 0}
            onChange={(f, v) =>
              updateCoopTarif('livraison', 'nationale', 'courseExpress', f, v)
            }
          />
        </ZoneSection>
      </Card>

      {/* Transport en commun */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">🚌 Transport en commun</h2>
        <ZoneSection title="Régionale">
          <JourRow
            label="Tarif ligne (Ar)"
            value={tarifs.transportCommun?.regionale?.tarifLigne?.prixTrajet || 0}
            onChange={(v) =>
              updateCoopTarif('transportCommun', 'regionale', 'tarifLigne', 'prixTrajet', v)
            }
          />
        </ZoneSection>
        <ZoneSection title="Nationale">
          <JourRow
            label="Tarif ligne (Ar)"
            value={tarifs.transportCommun?.nationale?.tarifLigne?.prixTrajet || 0}
            onChange={(v) =>
              updateCoopTarif('transportCommun', 'nationale', 'tarifLigne', 'prixTrajet', v)
            }
          />
        </ZoneSection>
      </Card>

      {/* Transport de marchandises */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">🚛 Transport de marchandises</h2>
        <ZoneSection title="Régionale">
          <BaremeRow
            base={tarifs.transportMarchandises?.regionale?.bareme?.prixBase || 0}
            km={tarifs.transportMarchandises?.regionale?.bareme?.prixKm || 0}
            tonne={tarifs.transportMarchandises?.regionale?.bareme?.prixTonne || 0}
            onChange={(f, v) =>
              updateCoopTarif('transportMarchandises', 'regionale', 'bareme', f, v)
            }
          />
        </ZoneSection>
        <ZoneSection title="Nationale">
          <BaremeRow
            base={tarifs.transportMarchandises?.nationale?.bareme?.prixBase || 0}
            km={tarifs.transportMarchandises?.nationale?.bareme?.prixKm || 0}
            tonne={tarifs.transportMarchandises?.nationale?.bareme?.prixTonne || 0}
            onChange={(f, v) =>
              updateCoopTarif('transportMarchandises', 'nationale', 'bareme', f, v)
            }
          />
        </ZoneSection>
      </Card>

      {/* Location de voiture */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">🔑 Location de voiture</h2>
        <JourRow
          label="Touristique (Ar/jour)"
          value={tarifs.locationVoiture?.touristique?.tarifJour || 0}
          onChange={(v) =>
            updateCoopTarif('locationVoiture', 'touristique', 'tarifJour', 'prixJour', v)
          }
        />
        <JourRow
          label="Familiale (Ar/jour)"
          value={tarifs.locationVoiture?.familiale?.tarifJour || 0}
          onChange={(v) =>
            updateCoopTarif('locationVoiture', 'familiale', 'tarifJour', 'prixJour', v)
          }
        />
        <JourRow
          label="Autres (Ar/jour)"
          value={tarifs.locationVoiture?.autres?.tarifJour || 0}
          onChange={(v) =>
            updateCoopTarif('locationVoiture', 'autres', 'tarifJour', 'prixJour', v)
          }
        />
      </Card>

      {/* Longue distance */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">🚛 Longue distance (LONG_HAUL)</h2>
        <p className="text-xs text-gray-500 mb-4">
          Tarifs par type de vehicule pour le transport long-courrier.
        </p>

        {[
          { key: 'bus', label: 'Bus' },
          { key: 'minivan', label: 'Mini Van' },
          { key: 'fourgon', label: 'Fourgon' },
          { key: 'camion', label: 'Camion' },
          { key: 'semi_remorque', label: 'Semi-remorque' },
          { key: 'depanneuse', label: 'Depanneuse' },
          { key: 'camion_frigo', label: 'Camion frigorifique' },
        ].map(({ key, label }) => (
          <ZoneSection key={key} title={label}>
            <ModeRow
              label="Tarif"
              base={tarifs[key]?.longueDistance?.prixBase || 0}
              km={tarifs[key]?.longueDistance?.prixKm || 0}
              onChange={(f, v) => updateLongueDistance(key, f, v)}
            />
            <JourRow
              label="Forfait service (Ar)"
              value={tarifs[key]?.longueDistance?.forfaitService || 0}
              onChange={(v) => updateLongueDistance(key, 'forfaitService', v)}
            />
          </ZoneSection>
        ))}
      </Card>
    </>
  );
}
