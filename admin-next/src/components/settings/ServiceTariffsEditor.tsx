'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Pencil,
  Plus,
  Power,
  X,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from './_shared/TarifRows';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type EditorMode = 'admin' | 'organization';

type DimensionKey =
  | 'modePrestation'
  | 'zone'
  | 'mode'
  | 'categorie';

type PricingModel =
  | 'PER_KM'
  | 'FIXED'
  | 'NEGOTIATED'
  | 'BAREME'
  | 'PER_DAY';

interface Organization {
  id: string;
  name: string;
  slug?: string | null;
  type?: string | null;
}

interface VehicleCategory {
  id: string;
  code: string;
  label: string;
  vehicleType?: string | null;
  capacity?: number | null;
}

interface ServiceTariff {
  id: string;
  pricingModel: PricingModel | string;
  modePrestation?: string | null;
  zone?: string | null;
  mode?: string | null;
  categorie?: string | null;
  dimensionKey?: string | null;
  excludeFromUnique?: boolean;
  basePrice: number | null;
  unitPrice: number | null;
  minimumPrice: number | null;
  commissionPct: number;
  currency: string;
  configuration?: Record<string, unknown> | null;
  vehicleCategory: VehicleCategory | null;
}

interface Service {
  id: string;
  code: string;
  label: string;
  category?: string | null;
  tariffs: ServiceTariff[];
  __organizationId?: string;
}

interface BusinessActivity {
  id: string;
  type: string;
  zone?: string | null;
  services: Service[];
}

interface ServiceTariffsResponse {
  organizationId: string;
  activities: BusinessActivity[];
}

interface TariffFormState {
  vehicleCategoryId: string;
  pricingModel: PricingModel | string;
  modePrestation: string;
  zone: string;
  mode: string;
  categorie: string;
  basePrice: string;
  unitPrice: string;
  minimumPrice: string;
  commissionPct: string;
  currency: string;
}

interface ServiceTariffsEditorProps {
  mode: EditorMode;
}

/* -------------------------------------------------------------------------- */
/* VehicleCategory — liste statique Phase 6                                   */
/* -------------------------------------------------------------------------- */

const VEHICLE_CATEGORIES: VehicleCategory[] = [
  {
    id: 'cmttpxj8o001qifc0vjro6nsx',
    code: 'MOTO',
    label: 'Moto',
  },
  {
    id: 'cmttpxk3l001rifc0m3ub9nke',
    code: 'VOITURE',
    label: 'Voiture',
  },
  {
    id: 'cmttpxkyd001sifc0sg17s4nm',
    code: 'BUS',
    label: 'Bus',
  },
  {
    id: 'cmttpxlte001tifc02e8abuo6',
    code: 'MINIVAN',
    label: 'Mini Van',
  },
  {
    id: 'cmttpxmoc001uifc0yhz6pvdi',
    code: 'TRICYCLE',
    label: 'Tricycle',
  },
  {
    id: 'cmttpxnja001vifc0omt62656',
    code: 'FOURGON',
    label: 'Fourgon',
  },
  {
    id: 'cmttpxoe5001wifc07z396wzy',
    code: 'CAMION',
    label: 'Camion',
  },
  {
    id: 'cmttpxp92001xifc0zj1g1fca',
    code: 'SEMI_REMORQUE',
    label: 'Semi-remorque',
  },
  {
    id: 'cmttpxq4f001yifc0a20pvllk',
    code: 'DEPANNEUSE',
    label: 'Dépanneuse',
  },
  {
    id: 'cmttpxqz7001zifc0ls78u2bp',
    code: 'CAMION_FRIGO',
    label: 'Camion frigorifique',
  },
];

/* -------------------------------------------------------------------------- */
/* Dimensions                                                                 */
/* -------------------------------------------------------------------------- */

const SERVICE_DIMENSIONS: Record<string, DimensionKey[]> = {
  TAXI: ['modePrestation'],
  LIVRAISON: ['zone', 'mode'],
  TRANSPORT_COMMUN: ['zone'],
  LOCATION_VOITURE: ['categorie'],
  LOCATION_URBAINE: [],
  LOCATION_INTERURBAINE: [],
  DEPANNAGE: [],
  FRET: [],
  MARCHANDISES: [],
};

const DIMENSION_LABELS: Record<DimensionKey, string> = {
  modePrestation: 'Mode de prestation',
  zone: 'Zone',
  mode: 'Mode',
  categorie: 'Catégorie',
};

const DIMENSION_OPTIONS: Record<
  DimensionKey,
  { value: string; label: string }[]
> = {
  modePrestation: [
    { value: 'normal', label: 'Normal' },
    { value: 'adyVarotra', label: 'Ady Varotra' },
  ],
  zone: [
    { value: 'regionale', label: 'Régionale' },
    { value: 'nationale', label: 'Nationale' },
  ],
  mode: [
    { value: 'courseNormale', label: 'Course normale' },
    { value: 'courseExpress', label: 'Course express' },
  ],
  categorie: [
    { value: 'touristique', label: 'Touristique' },
    { value: 'familiale', label: 'Familiale' },
    { value: 'autres', label: 'Autres' },
  ],
};

/* -------------------------------------------------------------------------- */
/* Pricing models                                                             */
/* -------------------------------------------------------------------------- */

interface PricingModelConfig {
  value: PricingModel;
  label: string;
  fields: ('basePrice' | 'unitPrice')[];
}

const PRICING_MODELS: PricingModelConfig[] = [
  {
    value: 'PER_KM',
    label: 'PER_KM',
    fields: ['basePrice', 'unitPrice'],
  },
  {
    value: 'FIXED',
    label: 'FIXED',
    fields: ['basePrice'],
  },
  {
    value: 'NEGOTIATED',
    label: 'NEGOTIATED',
    fields: [],
  },
  {
    value: 'BAREME',
    label: 'BAREME',
    fields: ['basePrice', 'unitPrice'],
  },
  {
    value: 'PER_DAY',
    label: 'PER_DAY',
    fields: ['basePrice'],
  },
];

const SERVICE_PRICING_MODELS: Record<string, PricingModel[]> = {
  TAXI: ['PER_KM', 'NEGOTIATED'],
  LIVRAISON: ['PER_KM'],
  TRANSPORT_COMMUN: ['FIXED'],
  LOCATION_URBAINE: ['FIXED', 'PER_DAY'],
  LOCATION_INTERURBAINE: ['PER_KM', 'NEGOTIATED'],
  LOCATION_VOITURE: ['PER_DAY'],
  DEPANNAGE: ['NEGOTIATED'],
  FRET: ['NEGOTIATED'],
  MARCHANDISES: ['NEGOTIATED'],
};

/* -------------------------------------------------------------------------- */
/* Constantes                                                                 */
/* -------------------------------------------------------------------------- */

const DEFAULT_COMMISSION = 20;
const MIN_COMMISSION = 0;
const MAX_COMMISSION = 50;

const CURRENCIES = ['MGA', 'EUR', 'USD'];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function emptyForm(
  service: Service,
  tariff?: ServiceTariff | null,
): TariffFormState {
  const allowedModels =
    SERVICE_PRICING_MODELS[service.code] ?? [];

  const firstModel =
    allowedModels[0] ?? 'FIXED';

  if (tariff) {
    return {
      vehicleCategoryId:
        tariff.vehicleCategory?.id ?? '',
      pricingModel:
        tariff.pricingModel,
      modePrestation:
        tariff.modePrestation ?? '',
      zone:
        tariff.zone ?? '',
      mode:
        tariff.mode ?? '',
      categorie:
        tariff.categorie ?? '',
      basePrice:
        tariff.basePrice == null
          ? ''
          : String(tariff.basePrice),
      unitPrice:
        tariff.unitPrice == null
          ? ''
          : String(tariff.unitPrice),
      minimumPrice:
        tariff.minimumPrice == null
          ? ''
          : String(tariff.minimumPrice),
      commissionPct:
        String(tariff.commissionPct ?? DEFAULT_COMMISSION),
      currency:
        tariff.currency || 'MGA',
    };
  }

  return {
    vehicleCategoryId: '',
    pricingModel: firstModel,
    modePrestation: '',
    zone: '',
    mode: '',
    categorie: '',
    basePrice: '',
    unitPrice: '',
    minimumPrice: '',
    commissionPct: String(DEFAULT_COMMISSION),
    currency: 'MGA',
  };
}

function humanizeError(
  status: number,
  data: unknown,
): string {
  if (
    data &&
    typeof data === 'object'
  ) {
    const record =
      data as Record<string, unknown>;

    if (typeof record.error === 'string') {
      return record.error;
    }

    if (typeof record.message === 'string') {
      return record.message;
    }
  }

  if (status === 409) {
    return 'Un tarif existe déjà pour cette combinaison de dimensions.';
  }

  if (status === 401) {
    return 'Session administrateur invalide ou expirée.';
  }

  if (status === 403) {
    return 'Vous n’avez pas les droits nécessaires pour cette opération.';
  }

  return `Erreur HTTP ${status}.`;
}

function parseNumberOrNull(
  value: string,
): number | null {
  if (value.trim() === '') {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function renderDimensionSummary(
  tariff: ServiceTariff,
): string[] {
  const values: string[] = [];

  if (tariff.modePrestation) {
    values.push(
      `Mode : ${
        DIMENSION_OPTIONS.modePrestation.find(
          (option) =>
            option.value === tariff.modePrestation,
        )?.label ??
        tariff.modePrestation
      }`,
    );
  }

  if (tariff.zone) {
    values.push(
      `Zone : ${
        DIMENSION_OPTIONS.zone.find(
          (option) =>
            option.value === tariff.zone,
        )?.label ??
        tariff.zone
      }`,
    );
  }

  if (tariff.mode) {
    values.push(
      `Mode : ${
        DIMENSION_OPTIONS.mode.find(
          (option) =>
            option.value === tariff.mode,
        )?.label ??
        tariff.mode
      }`,
    );
  }

  if (tariff.categorie) {
    values.push(
      `Catégorie : ${
        DIMENSION_OPTIONS.categorie.find(
          (option) =>
            option.value === tariff.categorie,
        )?.label ??
        tariff.categorie
      }`,
    );
  }

  return values;
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

interface TariffFormModalProps {
  service: Service;
  tariff: ServiceTariff | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

function TariffFormModal({
  service,
  tariff,
  onClose,
  onSaved,
}: TariffFormModalProps) {
  const editing = Boolean(tariff);

  const allowedPricingModels =
    SERVICE_PRICING_MODELS[service.code] ??
    [];

  const dimensions =
    SERVICE_DIMENSIONS[service.code] ??
    [];

  const [form, setForm] =
    useState<TariffFormState>(() =>
      emptyForm(service, tariff),
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    setForm(emptyForm(service, tariff));
    setError(null);
  }, [service, tariff]);

  const update = <K extends keyof TariffFormState>(
    key: K,
    value: TariffFormState[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const validate = (): string | null => {
    if (!form.vehicleCategoryId) {
      return 'La catégorie de véhicule est obligatoire.';
    }

    if (
      !allowedPricingModels.includes(
        form.pricingModel as PricingModel,
      )
    ) {
      return 'Le modèle de tarification sélectionné n’est pas autorisé pour ce service.';
    }

    const commission =
      Number(form.commissionPct);

    if (
      !Number.isFinite(commission) ||
      commission < MIN_COMMISSION ||
      commission > MAX_COMMISSION
    ) {
      return `La commission doit être comprise entre ${MIN_COMMISSION} et ${MAX_COMMISSION} %.`;
    }

    for (const dimension of dimensions) {
      if (!form[dimension]) {
        return `La dimension « ${DIMENSION_LABELS[dimension]} » est obligatoire.`;
      }
    }

    const numericFields = [
      {
        value: form.basePrice,
        label: 'Le prix de base',
      },
      {
        value: form.unitPrice,
        label: 'Le prix unitaire',
      },
      {
        value: form.minimumPrice,
        label: 'Le prix minimum',
      },
    ];

    for (const field of numericFields) {
      if (
        field.value !== '' &&
        (
          !Number.isFinite(Number(field.value)) ||
          Number(field.value) < 0
        )
      ) {
        return `${field.label} doit être supérieur ou égal à 0.`;
      }
    }

    return null;
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    setError(null);

    const validationError =
      validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const basePayload = {
        modePrestation:
          dimensions.includes('modePrestation')
            ? form.modePrestation || null
            : null,

        zone:
          dimensions.includes('zone')
            ? form.zone || null
            : null,

        mode:
          dimensions.includes('mode')
            ? form.mode || null
            : null,

        categorie:
          dimensions.includes('categorie')
            ? form.categorie || null
            : null,

        basePrice:
          parseNumberOrNull(form.basePrice),

        unitPrice:
          parseNumberOrNull(form.unitPrice),

        minimumPrice:
          parseNumberOrNull(form.minimumPrice),

        commissionPct:
          Number(form.commissionPct),

        currency:
          form.currency,
      };

      const payload = editing
        ? basePayload
        : {
            ...basePayload,
            serviceId: service.id,
            vehicleCategoryId:
              form.vehicleCategoryId,
            pricingModel:
              form.pricingModel,
          };

      const url = editing
        ? `/organizations/${encodeURIComponent(
            service.__organizationId ?? '',
          )}/service-tariffs/${encodeURIComponent(
            tariff!.id,
          )}`
        : `/organizations/${encodeURIComponent(
            service.__organizationId ?? '',
          )}/service-tariffs`;

      /*
       * Le service reçoit l'organisation via une propriété interne
       * ajoutée par l'éditeur avant ouverture de la modal.
       */
      const response = await apiFetch(
        url,
        {
          method: editing
            ? 'PUT'
            : 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const data =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          humanizeError(
            response.status,
            data,
          ),
        );
      }

      await onSaved();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur inconnue est survenue.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editing
                ? 'Modifier le tarif'
                : 'Ajouter un tarif'}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {service.label}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 p-6"
        >
          {/* Catégorie véhicule */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Catégorie de véhicule
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              value={form.vehicleCategoryId}
              onChange={(event) =>
                update(
                  'vehicleCategoryId',
                  event.target.value,
                )
              }
              disabled={
                editing || saving
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">
                Sélectionner une catégorie
              </option>

              {VEHICLE_CATEGORIES.map(
                (category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.label}
                  </option>
                ),
              )}
            </select>

            {editing && (
              <p className="mt-1 text-xs text-gray-500">
                La catégorie ne peut pas être
                modifiée sur un tarif existant.
              </p>
            )}
          </div>

          {/* Pricing model */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Modèle de tarification
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              value={form.pricingModel}
              onChange={(event) =>
                update(
                  'pricingModel',
                  event.target
                    .value as PricingModel,
                )
              }
              disabled={
                editing || saving
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {allowedPricingModels.map(
                (model) => (
                  <option
                    key={model}
                    value={model}
                  >
                    {model}
                  </option>
                ),
              )}
            </select>

            {editing && (
              <p className="mt-1 text-xs text-gray-500">
                Le modèle de tarification ne
                peut pas être modifié sur un
                tarif existant.
              </p>
            )}
          </div>

          {/* Dimensions */}
          {dimensions.length > 0 && (
            <fieldset className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <legend className="px-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                Dimensions tarifaires
              </legend>

              <div className="grid gap-4 sm:grid-cols-2">
                {dimensions.map(
                  (dimension) => (
                    <div
                      key={dimension}
                    >
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
                        {
                          DIMENSION_LABELS[
                            dimension
                          ]
                        }
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <select
                        value={
                          form[dimension]
                        }
                        onChange={(event) =>
                          update(
                            dimension,
                            event.target
                              .value,
                          )
                        }
                        disabled={saving}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">
                          Sélectionner
                        </option>

                        {DIMENSION_OPTIONS[
                          dimension
                        ].map(
                          (option) => (
                            <option
                              key={
                                option.value
                              }
                              value={
                                option.value
                              }
                            >
                              {
                                option.label
                              }
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  ),
                )}
              </div>
            </fieldset>
          )}

          {/* Prix */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
              Paramètres tarifaires
            </h4>

            <PricingFieldsRow
              pricingModel={
                form.pricingModel
              }
              basePrice={
                form.basePrice
              }
              unitPrice={
                form.unitPrice
              }
              minimumPrice={
                form.minimumPrice
              }
              commissionPct={
                form.commissionPct
              }
              currency={
                form.currency
              }
              editing={editing}
              existingBasePrice={
                tariff?.basePrice
              }
              existingUnitPrice={
                tariff?.unitPrice
              }
              onChange={update}
              disabled={saving}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {saving
                ? 'Enregistrement…'
                : editing
                  ? 'Enregistrer les modifications'
                  : 'Ajouter le tarif'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PricingFieldsRow                                                           */
/* -------------------------------------------------------------------------- */

interface PricingFieldsRowProps {
  pricingModel: string;
  basePrice: string;
  unitPrice: string;
  minimumPrice: string;
  commissionPct: string;
  currency: string;
  editing: boolean;
  existingBasePrice?: number | null;
  existingUnitPrice?: number | null;
  onChange: <K extends keyof TariffFormState>(
    key: K,
    value: TariffFormState[K],
  ) => void;
  disabled: boolean;
}

function PricingFieldsRow({
  pricingModel,
  basePrice,
  unitPrice,
  minimumPrice,
  commissionPct,
  currency,
  editing,
  existingBasePrice,
  existingUnitPrice,
  onChange,
  disabled,
}: PricingFieldsRowProps) {
  const config =
    PRICING_MODELS.find(
      (model) =>
        model.value === pricingModel,
    );

  /*
   * NEGOTIATED n'impose pas de base/unitPrice.
   * Toutefois, certains tarifs NEGOTIATED existants
   * possèdent déjà ces valeurs en base. Elles restent
   * donc visibles en édition afin de ne pas rendre
   * impossible leur modification.
   */
  const showBasePrice =
    config?.fields.includes(
      'basePrice',
    ) ||
    (
      editing &&
      existingBasePrice != null
    );

  const showUnitPrice =
    config?.fields.includes(
      'unitPrice',
    ) ||
    (
      editing &&
      existingUnitPrice != null
    );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {showBasePrice && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Prix de base
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={basePrice}
            onChange={(event) =>
              onChange(
                'basePrice',
                event.target.value,
              )
            }
            disabled={disabled}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      )}

      {showUnitPrice && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Prix unitaire
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={unitPrice}
            onChange={(event) =>
              onChange(
                'unitPrice',
                event.target.value,
              )
            }
            disabled={disabled}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
          Prix minimum
        </label>

        <input
          type="number"
          min="0"
          step="0.01"
          value={minimumPrice}
          onChange={(event) =>
            onChange(
              'minimumPrice',
              event.target.value,
            )
          }
          disabled={disabled}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
          Commission (%)
        </label>

        <input
          type="number"
          min={MIN_COMMISSION}
          max={MAX_COMMISSION}
          step="0.1"
          value={commissionPct}
          onChange={(event) =>
            onChange(
              'commissionPct',
              event.target.value,
            )
          }
          disabled={disabled}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
          Devise
        </label>

        <select
          value={currency}
          onChange={(event) =>
            onChange(
              'currency',
              event.target.value,
            )
          }
          disabled={disabled}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          {CURRENCIES.map(
            (currencyOption) => (
              <option
                key={currencyOption}
                value={currencyOption}
              >
                {currencyOption}
              </option>
            ),
          )}
        </select>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main component                                                             */
/* -------------------------------------------------------------------------- */

export default function ServiceTariffsEditor({
  mode,
}: ServiceTariffsEditorProps) {
  const [organizations, setOrganizations] =
    useState<Organization[]>([]);

  const [selectedOrgId, setSelectedOrgId] =
    useState('');

  const [activities, setActivities] =
    useState<BusinessActivity[]>([]);

  const [loadingOrganizations, setLoadingOrganizations] =
    useState(false);

  const [loadingActivities, setLoadingActivities] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [saved, setSaved] =
    useState(false);

  const [editingContext, setEditingContext] =
    useState<{
      service: Service;
      tariff: ServiceTariff;
    } | null>(null);

  const [creatingContext, setCreatingContext] =
    useState<Service | null>(null);

  /* ---------------------------------------------------------------------- */
  /* Chargement organisations                                               */
  /* ---------------------------------------------------------------------- */

  const loadOrganizations =
    useCallback(async () => {
      if (mode !== 'admin') {
        return;
      }

      setLoadingOrganizations(true);
      setError(null);

      try {
        const response =
          await apiFetch(
            '/organizations?page=1&limit=100',
          );

        if (!response.ok) {
          const data =
            await response
              .json()
              .catch(() => null);

          throw new Error(
            humanizeError(
              response.status,
              data,
            ),
          );
        }

        const data =
          await response.json();

        /*
         * L'API retourne :
         * {
         *   data: [...],
         *   pagination: {...}
         * }
         */
        setOrganizations(
          Array.isArray(data?.data)
            ? data.data
            : [],
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Impossible de charger les organisations.',
        );
      } finally {
        setLoadingOrganizations(false);
      }
    }, [mode]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  /* ---------------------------------------------------------------------- */
  /* Chargement tarifs                                                      */
  /* ---------------------------------------------------------------------- */

  const loadActivities =
    useCallback(async (
      organizationId: string,
    ) => {
      if (!organizationId) {
        setActivities([]);
        return;
      }

      setLoadingActivities(true);
      setError(null);
      setSaved(false);

      try {
        const response =
          await apiFetch(
            `/organizations/${encodeURIComponent(
              organizationId,
            )}/service-tariffs`,
          );

        if (!response.ok) {
          const data =
            await response
              .json()
              .catch(() => null);

          throw new Error(
            humanizeError(
              response.status,
              data,
            ),
          );
        }

        const data =
          (await response.json()) as ServiceTariffsResponse;

        setActivities(
          Array.isArray(data?.activities)
            ? data.activities
            : [],
        );
      } catch (err) {
        setActivities([]);

        setError(
          err instanceof Error
            ? err.message
            : 'Impossible de charger les tarifs V2.',
        );
      } finally {
        setLoadingActivities(false);
      }
    }, []);

  useEffect(() => {
    if (
      mode === 'admin' &&
      selectedOrgId
    ) {
      loadActivities(
        selectedOrgId,
      );
    } else {
      setActivities([]);
    }
  }, [
    mode,
    selectedOrgId,
    loadActivities,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Rechargement après POST / PUT / DELETE                                */
  /* ---------------------------------------------------------------------- */

  const reloadAfterSave =
    useCallback(async () => {
      if (!selectedOrgId) {
        return;
      }

      setSaving(true);
      setEditingContext(null);
      setCreatingContext(null);

      try {
        await loadActivities(
          selectedOrgId,
        );

        setSaved(true);

        window.setTimeout(() => {
          setSaved(false);
        }, 3000);
      } finally {
        setSaving(false);
      }
    }, [
      loadActivities,
      selectedOrgId,
    ]);

  /* ---------------------------------------------------------------------- */
  /* Handlers                                                               */
  /* ---------------------------------------------------------------------- */

  const handleEdit = (
    service: Service,
    tariff: ServiceTariff,
  ) => {
    setError(null);
    setSaved(false);

    setEditingContext({
      service: {
        ...service,
        /*
         * La modal doit connaître l'organisation
         * utilisée par l'endpoint PUT.
         */
        __organizationId:
          selectedOrgId,
      },
      tariff,
    });
  };

  const handleCreate = (
    service: Service,
  ) => {
    /*
     * MARCHANDISES reste explicitement bloqué
     * tant que M3 n'est pas arbitré.
     */
    if (
      service.code === 'MARCHANDISES'
    ) {
      setError(
        'La création de tarifs MARCHANDISES reste bloquée tant que la dimension tarifaire M3 n’est pas arbitrée.',
      );
      return;
    }

    setError(null);
    setSaved(false);

    setCreatingContext({
      ...service,
      __organizationId:
        selectedOrgId,
    });
  };

  const handleDeactivate =
    async (
      service: Service,
      tariff: ServiceTariff,
    ) => {
      if (!selectedOrgId) {
        return;
      }

      const confirmed =
        window.confirm(
          `Désactiver le tarif ${tariff.pricingModel} — ${
            tariff.vehicleCategory?.label ??
            'catégorie inconnue'
          } ?`,
        );

      if (!confirmed) {
        return;
      }

      setSaving(true);
      setError(null);
      setSaved(false);

      try {
        const response =
          await apiFetch(
            `/organizations/${encodeURIComponent(
              selectedOrgId,
            )}/service-tariffs/${encodeURIComponent(
              tariff.id,
            )}`,
            {
              method: 'DELETE',
            },
          );

        if (!response.ok) {
          const data =
            await response
              .json()
              .catch(() => null);

          throw new Error(
            humanizeError(
              response.status,
              data,
            ),
          );
        }

        await loadActivities(
          selectedOrgId,
        );

        setSaved(true);

        window.setTimeout(() => {
          setSaved(false);
        }, 3000);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Impossible de désactiver le tarif.',
        );
      } finally {
        setSaving(false);
      }
    };

  /* ---------------------------------------------------------------------- */
  /* Organisation sélectionnée                                             */
  /* ---------------------------------------------------------------------- */

  const selectedOrganization =
    useMemo(
      () =>
        organizations.find(
          (organization) =>
            organization.id ===
            selectedOrgId,
        ) ?? null,
      [
        organizations,
        selectedOrgId,
      ],
    );

  /* ---------------------------------------------------------------------- */
  /* Mode organization                                                      */
  /* ---------------------------------------------------------------------- */

  if (mode === 'organization') {
    return (
      <Card>
        <div className="flex items-start gap-3 p-5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Configuration organisation
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Le mode organisation sera branché
              sur le contexte de l’organisation
              dans l’étape dédiée. Le mode
              administrateur est actuellement
              opérationnel.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Rendu admin                                                            */
  /* ---------------------------------------------------------------------- */

  return (
    <>
      <Card>
        <div className="space-y-5 p-5">
          {/* Sélection organisation */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
              Organisation
            </label>

            <select
              value={selectedOrgId}
              onChange={(event) => {
                setSelectedOrgId(
                  event.target.value,
                );
                setActivities([]);
                setError(null);
                setSaved(false);
              }}
              disabled={
                loadingOrganizations ||
                saving
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">
                Sélectionner une organisation
              </option>

              {organizations.map(
                (organization) => (
                  <option
                    key={organization.id}
                    value={organization.id}
                  >
                    {organization.name}
                    {organization.slug
                      ? ` — ${organization.slug}`
                      : ''}
                  </option>
                ),
              )}
            </select>

            {loadingOrganizations && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Chargement des organisations…
              </div>
            )}
          </div>

          {/* Organisation sélectionnée */}
          {selectedOrganization && (
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/60">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedOrganization.name}
              </div>

              <div className="mt-1 text-xs text-gray-500">
                {selectedOrganization.type ??
                  'Organisation'}
                {selectedOrganization.slug
                  ? ` · ${selectedOrganization.slug}`
                  : ''}
              </div>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
              <CheckCircle className="h-5 w-5" />
              <span>
                Modification enregistrée. Les
                tarifs ont été rechargés depuis
                l’API.
              </span>
            </div>
          )}

          {/* Aucun organisme */}
          {!selectedOrgId && (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
              <p className="text-sm text-gray-500">
                Sélectionnez une organisation
                pour consulter et gérer son
                catalogue tarifaire V2.
              </p>
            </div>
          )}

          {/* Chargement */}
          {selectedOrgId &&
            loadingActivities && (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Chargement du catalogue V2…
              </div>
            )}

          {/* Activités */}
          {selectedOrgId &&
            !loadingActivities &&
            activities.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
                <p className="text-sm text-gray-500">
                  Aucun BusinessActivity ou
                  service V2 actif pour cette
                  organisation.
                </p>
              </div>
            )}

          {selectedOrgId &&
            !loadingActivities &&
            activities.map(
              (activity) => (
                <div
                  key={activity.id}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      {activity.type}
                      {activity.zone
                        ? ` — ${activity.zone}`
                        : ''}
                    </h3>
                  </div>

                  {activity.services.map(
                    (service) => {
                      const dimensions =
                        SERVICE_DIMENSIONS[
                          service.code
                        ] ?? [];

                      const isM3Blocked =
                        service.code ===
                        'MARCHANDISES';

                      return (
                        <div
                          key={service.id}
                          className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                        >
                          {/* Service header */}
                          <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {service.label}
                                </h4>

                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                  {service.code}
                                </span>

                                {isM3Blocked && (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                    M3 à arbitrer
                                  </span>
                                )}
                              </div>

                              {dimensions.length >
                                0 && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Dimensions :{' '}
                                  {dimensions
                                    .map(
                                      (
                                        dimension,
                                      ) =>
                                        DIMENSION_LABELS[
                                          dimension
                                        ],
                                    )
                                    .join(
                                      ' · ',
                                    )}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleCreate(
                                  service,
                                )
                              }
                              disabled={
                                saving ||
                                isM3Blocked
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Plus className="h-4 w-4" />
                              Ajouter un tarif
                            </button>
                          </div>

                          {/* Tarifs */}
                          <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {service.tariffs
                              .length === 0 && (
                              <div className="p-5 text-sm text-gray-500">
                                Aucun tarif actif
                                pour ce service.
                              </div>
                            )}

                            {service.tariffs.map(
                              (tariff) => {
                                const category =
                                  tariff.vehicleCategory;

                                const summary =
                                  renderDimensionSummary(
                                    tariff,
                                  );

                                return (
                                  <div
                                    key={
                                      tariff.id
                                    }
                                    className="p-4"
                                  >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="font-medium text-gray-900 dark:text-white">
                                            {category?.label ??
                                              'Catégorie inconnue'}
                                          </span>

                                          {category?.code && (
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                                              {
                                                category.code
                                              }
                                            </span>
                                          )}

                                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                            {
                                              tariff.pricingModel
                                            }
                                          </span>

                                          {tariff.excludeFromUnique && (
                                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                              À arbitrer
                                            </span>
                                          )}
                                        </div>

                                        {summary.length >
                                          0 && (
                                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                            {summary.map(
                                              (
                                                item,
                                              ) => (
                                                <span
                                                  key={
                                                    item
                                                  }
                                                >
                                                  {item}
                                                </span>
                                              ),
                                            )}
                                          </div>
                                        )}

                                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
                                          {tariff.basePrice !=
                                            null && (
                                            <span>
                                              Base :{' '}
                                              <strong>
                                                {tariff.basePrice.toLocaleString(
                                                  'fr-FR',
                                                )}{' '}
                                                {
                                                  tariff.currency
                                                }
                                              </strong>
                                            </span>
                                          )}

                                          {tariff.unitPrice !=
                                            null && (
                                            <span>
                                              Unité :{' '}
                                              <strong>
                                                {tariff.unitPrice.toLocaleString(
                                                  'fr-FR',
                                                )}{' '}
                                                {
                                                  tariff.currency
                                                }
                                              </strong>
                                            </span>
                                          )}

                                          {tariff.minimumPrice !=
                                            null && (
                                            <span>
                                              Minimum :{' '}
                                              <strong>
                                                {tariff.minimumPrice.toLocaleString(
                                                  'fr-FR',
                                                )}{' '}
                                                {
                                                  tariff.currency
                                                }
                                              </strong>
                                            </span>
                                          )}

                                          <span>
                                            Commission :{' '}
                                            <strong>
                                              {
                                                tariff.commissionPct
                                              }
                                              %
                                            </strong>
                                          </span>
                                        </div>
                                      </div>

                                      {/* Actions */}
                                      <div className="flex shrink-0 items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleEdit(
                                              service,
                                              tariff,
                                            )
                                          }
                                          disabled={
                                            saving ||
                                            Boolean(
                                              tariff.excludeFromUnique,
                                            )
                                          }
                                          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                                          title={
                                            tariff.excludeFromUnique
                                              ? 'Tarif MARCHANDISES en quarantaine'
                                              : 'Modifier'
                                          }
                                        >
                                          <Pencil className="h-4 w-4" />
                                          Modifier
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleDeactivate(
                                              service,
                                              tariff,
                                            )
                                          }
                                          disabled={
                                            saving
                                          }
                                          className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                                          title="Désactiver"
                                        >
                                          <Power className="h-4 w-4" />
                                          Désactiver
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              ),
            )}
        </div>
      </Card>

      {/* Modal création */}
      {creatingContext && (
        <TariffFormModal
          service={creatingContext}
          tariff={null}
          onClose={() =>
            setCreatingContext(null)
          }
          onSaved={reloadAfterSave}
        />
      )}

      {/* Modal édition */}
      {editingContext && (
        <TariffFormModal
          service={editingContext.service}
          tariff={editingContext.tariff}
          onClose={() =>
            setEditingContext(null)
          }
          onSaved={reloadAfterSave}
        />
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Extension locale du type Service pour transmettre l'organisation          */
/* -------------------------------------------------------------------------- */
