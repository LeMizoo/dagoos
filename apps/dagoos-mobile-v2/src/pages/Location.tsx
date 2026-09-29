import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  CalendarDays,
  Car,
  CheckCircle2,
  Clock3,
  ImagePlus,
  MapPin,
  Minus,
  Package,
  Plus,
  Send,
  Users,
  X,
} from 'lucide-react';

import { useBranding } from '../hooks/useBranding';
import { useLocationEstimate } from '../hooks/useLocationEstimate';
import { useLocationRequest } from '../hooks/useLocationRequest';
import { useOrganizations } from '../hooks/useOrganizations';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { storage } from '../services/storage';
import type {
  LocationEstimateRequest,
  LocationMode,
  LocationService,
  LocationTripType,
  LocationVehicle,
  Organization,
} from '../types/api';

const LONG_HAUL_SERVICES: Array<{
  value: LocationService;
  label: string;
}> = [
  { value: 'passagers', label: 'Transport de passagers' },
  { value: 'marchandises', label: 'Marchandises' },
  { value: 'demenagement', label: 'Déménagement' },
  { value: 'depannage', label: 'Dépannage' },
  { value: 'fret', label: 'Fret' },
];

const URBAN_VEHICLES: Array<{
  value: LocationVehicle;
  label: string;
}> = [
  { value: 'bus', label: 'Bus' },
  { value: 'minivan', label: 'Minivan' },
  { value: 'tricycle', label: 'Tricycle' },
];

const LONG_HAUL_VEHICLES: Record<
  LocationService,
  Array<{
    value: LocationVehicle;
    label: string;
  }>
> = {
  passagers: [
    { value: 'bus', label: 'Bus' },
    { value: 'minivan', label: 'Minivan' },
  ],
  marchandises: [
    { value: 'camion', label: 'Camion' },
  ],
  demenagement: [
    { value: 'camion', label: 'Camion' },
  ],
  depannage: [
    { value: 'depanneuse', label: 'Dépanneuse' },
  ],
  fret: [
    { value: 'camion', label: 'Camion' },
    { value: 'semi_remorque', label: 'Semi-remorque' },
  ],
};

const TRIP_TYPES: Array<{
  value: LocationTripType;
  label: string;
}> = [
  { value: 'A_B', label: 'Aller simple' },
  { value: 'A_B_A', label: 'Aller-retour' },
  { value: 'A_B_A_MULTI', label: 'Aller-retour avec plusieurs jours' },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #d8dee8',
  background: '#fff',
  color: '#172033',
  fontSize: 14,
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 7,
  fontSize: 13,
  fontWeight: 700,
  color: '#344054',
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e4e7ec',
  borderRadius: 18,
  padding: 16,
  boxShadow: '0 4px 18px rgba(6, 36, 95, 0.06)',
};

function formatAr(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) {
    return '—';
  }

  return new Intl.NumberFormat('fr-FR').format(value) + ' Ar';
}

function serviceNeedsDescription(service: LocationService): boolean {
  return [
    'marchandises',
    'demenagement',
    'depannage',
    'fret',
  ].includes(service);
}

function serviceNeedsPhotos(service: LocationService): boolean {
  return serviceNeedsDescription(service);
}

function getDefaultOrganization(
  organizations: Organization[],
  slug: string | null
): Organization | null {
  if (slug) {
    const cached = organizations.find(
      (organization) => organization.slug === slug
    );

    if (cached) {
      return cached;
    }
  }

  return organizations.length === 1
    ? organizations[0] ?? null
    : null;
}

export function LocationPage() {
  const navigate = useNavigate();
  const { slug: brandingSlug } = useBranding();

  const {
    organizations,
    loading: organizationsLoading,
    error: organizationsError,
  } = useOrganizations();

  const {
    estimate,
    loading: estimating,
    error: estimateError,
    compute,
    reset: resetEstimate,
  } = useLocationEstimate();

  const {
    loading: submitting,
    error: requestError,
    submit,
  } = useLocationRequest();

  const {
    photos,
    uploading: uploadingPhotos,
    error: photoError,
    addFiles,
    removePhoto,
    clearPhotos,
  } = usePhotoUpload();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [mode, setMode] = useState<LocationMode>('urbain');
  const [organizationSlug, setOrganizationSlug] = useState(
    brandingSlug ?? ''
  );

  const [clientNom, setClientNom] = useState('');
  const [clientTel, setClientTel] = useState('');

  const [typeService, setTypeService] =
    useState<LocationService>('passagers');

  const [typeVehicule, setTypeVehicule] =
    useState<LocationVehicle>('bus');

  const [typeTrajet, setTypeTrajet] =
    useState<LocationTripType>('A_B');

  const [depart, setDepart] = useState('');
  const [arrivee, setArrivee] = useState('');

  const [dateAller, setDateAller] = useState('');
  const [dateRetour, setDateRetour] = useState('');

  const [carburant, setCarburant] =
    useState<'AVEC' | 'SANS'>('AVEC');

  const [nbPassagers, setNbPassagers] = useState(1);
  const [description, setDescription] = useState('');

  const filteredOrganizations = useMemo(() => {
    if (mode === 'urbain') {
      return organizations.filter(
        (organization) =>
          organization.type === 'FLEET_MANAGER'
      );
    }

    return organizations.filter(
      (organization) =>
        organization.type === 'COOPERATIVE' ||
        organization.type === 'COOP_MANAGER'
    );
  }, [mode, organizations]);

  const selectedOrganization = useMemo(() => {
    return (
      filteredOrganizations.find(
        (organization) =>
          organization.slug === organizationSlug
      ) ?? null
    );
  }, [filteredOrganizations, organizationSlug]);

  const vehicleOptions = useMemo(() => {
    if (mode === 'urbain') {
      return URBAN_VEHICLES;
    }

    return LONG_HAUL_VEHICLES[typeService];
  }, [mode, typeService]);

  const showReturnDates =
    mode === 'long_haul' &&
    typeTrajet !== 'A_B';

  const showPassengers =
    mode === 'long_haul' &&
    typeService === 'passagers';

  const showDescription =
    mode === 'long_haul' &&
    serviceNeedsDescription(typeService);

  const showPhotos =
    mode === 'long_haul' &&
    serviceNeedsPhotos(typeService);

  const effectiveTypeTrajet: LocationTripType =
    mode === 'urbain' ? 'A_B' : typeTrajet;

  const changeMode = (nextMode: LocationMode) => {
    setMode(nextMode);
    resetEstimate();
    clearPhotos();

    if (nextMode === 'urbain') {
      setTypeVehicule('bus');
      setTypeTrajet('A_B');
      setCarburant('AVEC');
    } else {
      setTypeService('passagers');
      setTypeVehicule('bus');
      setTypeTrajet('A_B');
    }

    const nextOrganizations =
      nextMode === 'urbain'
        ? organizations.filter(
            (organization) =>
              organization.type === 'FLEET_MANAGER'
          )
        : organizations.filter(
            (organization) =>
              organization.type === 'COOPERATIVE' ||
              organization.type === 'COOP_MANAGER'
          );

    const preferred = getDefaultOrganization(
      nextOrganizations,
      brandingSlug
    );

    setOrganizationSlug(preferred?.slug ?? '');
  };

  const handleServiceChange = (
    service: LocationService
  ) => {
    setTypeService(service);
    setTypeVehicule(
      LONG_HAUL_VEHICLES[service][0]?.value ?? 'bus'
    );
    resetEstimate();
    clearPhotos();
  };

  const handleEstimate = async () => {
    if (!organizationSlug || !depart.trim() || !arrivee.trim()) {
      return;
    }

    const payload: LocationEstimateRequest = {
      organizationSlug,
      type:
        mode === 'long_haul'
          ? 'LONG_HAUL'
          : 'CAR_RENTAL',
      typeVehicule,
      depart: depart.trim(),
      arrivee: arrivee.trim(),
      ...(effectiveTypeTrajet
        ? { typeTrajet: effectiveTypeTrajet }
        : {}),
      ...(mode === 'long_haul'
        ? {
            typeService,
            ...(showPassengers
              ? { nbPassagers }
              : {}),
            ...(showDescription && description.trim()
              ? { description: description.trim() }
              : {}),
          }
        : {
            dateAller: dateAller || null,
            dateRetour: dateRetour || null,
            carburant,
          }),
    };

    await compute(payload);
  };

  const handleFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length > 0) {
      await addFiles(files, typeService);
    }

    event.target.value = '';
  };

  const handleSubmit = async () => {
    if (
      !organizationSlug ||
      !clientNom.trim() ||
      !clientTel.trim() ||
      !depart.trim() ||
      !arrivee.trim()
    ) {
      return;
    }

    const result = await submit({
      organizationSlug,
      type:
        mode === 'long_haul'
          ? 'LONG_HAUL'
          : 'CAR_RENTAL',
      clientNom: clientNom.trim(),
      clientTel: clientTel.trim(),
      details: {
        depart: depart.trim(),
        arrivee: arrivee.trim(),
        typeVehicule,
        ...(effectiveTypeTrajet
          ? { typeTrajet: effectiveTypeTrajet }
          : {}),
        ...(photos.length > 0 ? { photos } : {}),
        ...(mode === 'long_haul'
          ? {
              typeService,
              ...(showPassengers
                ? { nbPassagers }
                : {}),
              ...(showDescription && description.trim()
                ? { description: description.trim() }
                : {}),
            }
          : {
              dateAller: dateAller || null,
              dateRetour: dateRetour || null,
              carburant,
            }),
      },
    });

    if (!result?.codeSuivi) {
      return;
    }

    storage.setLastCode(result.codeSuivi);
    navigate(
      '/suivi?code=' +
        encodeURIComponent(result.codeSuivi)
    );
  };

  const canEstimate =
    Boolean(organizationSlug) &&
    Boolean(depart.trim()) &&
    Boolean(arrivee.trim()) &&
    !estimating;

  const canSubmit =
    Boolean(organizationSlug) &&
    Boolean(clientNom.trim()) &&
    Boolean(clientTel.trim()) &&
    Boolean(depart.trim()) &&
    Boolean(arrivee.trim()) &&
    !submitting &&
    !uploadingPhotos;

  const price =
    estimate?.price ?? estimate?.prixEstime;

  return (
    <main
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '20px 16px 100px',
      }}
    >
      <header style={{ marginBottom: 18 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 6,
          }}
        >
          <Car size={24} strokeWidth={2.2} />
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800,
              color: '#06245F',
            }}
          >
            Location
          </h1>
        </div>

        <p
          style={{
            margin: 0,
            color: '#667085',
            fontSize: 14,
          }}
        >
          Louez un véhicule ou demandez un transport
          longue distance.
        </p>
      </header>

      <section style={cardStyle}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 18,
          }}
        >
          <button
            type="button"
            onClick={() => changeMode('urbain')}
            style={{
              padding: '12px 10px',
              borderRadius: 12,
              border:
                mode === 'urbain'
                  ? '2px solid #E0A01C'
                  : '1px solid #d8dee8',
              background:
                mode === 'urbain'
                  ? '#fff8e8'
                  : '#fff',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Urbain
          </button>

          <button
            type="button"
            onClick={() => changeMode('long_haul')}
            style={{
              padding: '12px 10px',
              borderRadius: 12,
              border:
                mode === 'long_haul'
                  ? '2px solid #0A6F35'
                  : '1px solid #d8dee8',
              background:
                mode === 'long_haul'
                  ? '#eef8f1'
                  : '#fff',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Interurbain
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>
            Organisation
          </label>

          <select
            value={organizationSlug}
            onChange={(event) => {
              setOrganizationSlug(event.target.value);
              resetEstimate();
            }}
            style={inputStyle}
            disabled={organizationsLoading}
          >
            <option value="">
              {organizationsLoading
                ? 'Chargement...'
                : 'Sélectionner une organisation'}
            </option>

            {filteredOrganizations.map(
              (organization) => (
                <option
                  key={organization.id}
                  value={organization.slug}
                >
                  {organization.name}
                </option>
              )
            )}
          </select>

          {selectedOrganization && (
            <div
              style={{
                marginTop: 7,
                fontSize: 12,
                color: '#667085',
              }}
            >
              {selectedOrganization.slogan ||
                selectedOrganization.name}
            </div>
          )}
        </div>

        {organizationsError && (
          <div
            style={{
              marginBottom: 14,
              padding: 12,
              borderRadius: 10,
              background: '#fff4f4',
              color: '#b42318',
              fontSize: 13,
            }}
          >
            Impossible de charger les organisations.
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              mode === 'long_haul'
                ? '1fr 1fr'
                : '1fr',
            gap: 14,
          }}
        >
          {mode === 'long_haul' && (
            <div>
              <label style={labelStyle}>
                Service
              </label>

              <select
                value={typeService}
                onChange={(event) =>
                  handleServiceChange(
                    event.target.value as LocationService
                  )
                }
                style={inputStyle}
              >
                {LONG_HAUL_SERVICES.map(
                  (service) => (
                    <option
                      key={service.value}
                      value={service.value}
                    >
                      {service.label}
                    </option>
                  )
                )}
              </select>
            </div>
          )}

          <div>
            <label style={labelStyle}>
              Véhicule
            </label>

            <select
              value={typeVehicule}
              onChange={(event) => {
                setTypeVehicule(
                  event.target.value as LocationVehicle
                );
                resetEstimate();
              }}
              style={inputStyle}
            >
              {vehicleOptions.map((vehicle) => (
                <option
                  key={vehicle.value}
                  value={vehicle.value}
                >
                  {vehicle.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 14,
            marginTop: 14,
          }}
        >
          <div>
            <label style={labelStyle}>
              Nom complet
            </label>

            <input
              value={clientNom}
              onChange={(event) =>
                setClientNom(event.target.value)
              }
              placeholder="Votre nom"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              Téléphone
            </label>

            <input
              value={clientTel}
              onChange={(event) =>
                setClientTel(event.target.value)
              }
              placeholder="034 XX XXX XX"
              inputMode="tel"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={labelStyle}>
            <MapPin
              size={14}
              style={{
                verticalAlign: 'middle',
                marginRight: 5,
              }}
            />
            Départ
          </label>

          <input
            value={depart}
            onChange={(event) => {
              setDepart(event.target.value);
              resetEstimate();
            }}
            placeholder="Lieu de départ"
            style={inputStyle}
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={labelStyle}>
            <MapPin
              size={14}
              style={{
                verticalAlign: 'middle',
                marginRight: 5,
              }}
            />
            Arrivée
          </label>

          <input
            value={arrivee}
            onChange={(event) => {
              setArrivee(event.target.value);
              resetEstimate();
            }}
            placeholder="Lieu d'arrivée"
            style={inputStyle}
          />
        </div>

        {mode === 'long_haul' && (
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>
              <CalendarDays
                size={14}
                style={{
                  verticalAlign: 'middle',
                  marginRight: 5,
                }}
              />
              Type de trajet
            </label>

          <select
            value={typeTrajet}
            onChange={(event) => {
              setTypeTrajet(
                event.target.value as LocationTripType
              );
              resetEstimate();
            }}
            style={inputStyle}
          >
            {TRIP_TYPES.map((trip) => (
              <option
                key={trip.value}
                value={trip.value}
              >
                {trip.label}
              </option>
            ))}
          </select>
          </div>
        )}

        {mode === 'urbain' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
              marginTop: 14,
            }}
          >
            <div>
              <label style={labelStyle}>
                Date de départ
              </label>

              <input
                type="date"
                value={dateAller}
                onChange={(event) => {
                  setDateAller(event.target.value);
                  resetEstimate();
                }}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Carburant
              </label>

              <select
                value={carburant}
                onChange={(event) => {
                  setCarburant(
                    event.target.value as
                      | 'AVEC'
                      | 'SANS'
                  );
                  resetEstimate();
                }}
                style={inputStyle}
              >
                <option value="AVEC">
                  Avec carburant
                </option>
                <option value="SANS">
                  Sans carburant
                </option>
              </select>
            </div>
          </div>
        )}

        {mode === 'long_haul' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                showReturnDates
                  ? '1fr 1fr'
                  : '1fr',
              gap: 14,
              marginTop: 14,
            }}
          >
            <div>
              <label style={labelStyle}>
                Date de départ
              </label>

              <input
                type="date"
                value={dateAller}
                onChange={(event) => {
                  setDateAller(event.target.value);
                  resetEstimate();
                }}
                style={inputStyle}
              />
            </div>

            {showReturnDates && (
              <div>
                <label style={labelStyle}>
                  Date de retour
                </label>

                <input
                  type="date"
                  value={dateRetour}
                  onChange={(event) => {
                    setDateRetour(event.target.value);
                    resetEstimate();
                  }}
                  style={inputStyle}
                />
              </div>
            )}
          </div>
        )}

        {showPassengers && (
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>
              <Users
                size={14}
                style={{
                  verticalAlign: 'middle',
                  marginRight: 5,
                }}
              />
              Nombre de passagers
            </label>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setNbPassagers(
                    Math.max(1, nbPassagers - 1)
                  )
                }
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  border: '1px solid #d8dee8',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                <Minus size={16} />
              </button>

              <strong
                style={{
                  minWidth: 32,
                  textAlign: 'center',
                }}
              >
                {nbPassagers}
              </strong>

              <button
                type="button"
                onClick={() =>
                  setNbPassagers(
                    Math.min(50, nbPassagers + 1)
                  )
                }
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  border: '1px solid #d8dee8',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        )}

        {showDescription && (
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>
              <Package
                size={14}
                style={{
                  verticalAlign: 'middle',
                  marginRight: 5,
                }}
              />
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Décrivez votre besoin..."
              rows={4}
              style={{
                ...inputStyle,
                resize: 'vertical',
              }}
            />
          </div>
        )}

        {showPhotos && (
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>
              <ImagePlus
                size={14}
                style={{
                  verticalAlign: 'middle',
                  marginRight: 5,
                }}
              />
              Photos
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              multiple
              hidden
              onChange={handleFilesSelected}
            />

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={
                uploadingPhotos || photos.length >= 5
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px dashed #98a2b3',
                background: '#fff',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              <ImagePlus size={17} />
              Ajouter des photos
            </button>

            {photos.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(3, 1fr)',
                  gap: 8,
                  marginTop: 12,
                }}
              >
                {photos.map((photo, index) => (
                  <div
                    key={photo}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      overflow: 'hidden',
                      borderRadius: 10,
                      border:
                        '1px solid #e4e7ec',
                    }}
                  >
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removePhoto(index)
                      }
                      aria-label={
                        `Supprimer la photo ${index + 1}`
                      }
                      style={{
                        position: 'absolute',
                        top: 5,
                        right: 5,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: 'none',
                        background:
                          'rgba(0,0,0,0.65)',
                        color: '#fff',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {uploadingPhotos && (
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: 12,
                  color: '#667085',
                }}
              >
                Envoi des photos...
              </p>
            )}

            {photoError && (
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: 12,
                  color: '#b42318',
                }}
              >
                {photoError.message}
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => void handleEstimate()}
          disabled={!canEstimate}
          style={{
            width: '100%',
            marginTop: 18,
            padding: '13px 16px',
            border: 'none',
            borderRadius: 12,
            background: '#06245F',
            color: '#fff',
            fontWeight: 800,
            cursor: canEstimate
              ? 'pointer'
              : 'not-allowed',
            opacity: canEstimate ? 1 : 0.55,
          }}
        >
          {estimating
            ? 'Calcul en cours...'
            : 'Estimer le prix'}
        </button>

        {estimateError && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 10,
              background: '#fff4f4',
              color: '#b42318',
              fontSize: 13,
            }}
          >
            {estimateError.message}
          </div>
        )}

        {estimate && (
          <section
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 14,
              background: '#f8fafc',
              border: '1px solid #e4e7ec',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
              }}
            >
              {estimate.status ===
              'NEGOTIATION_REQUIRED' ? (
                <Clock3
                  size={19}
                  strokeWidth={2.2}
                />
              ) : (
                <CheckCircle2
                  size={19}
                  strokeWidth={2.2}
                />
              )}

              <strong>
                {estimate.status ===
                'NEGOTIATION_REQUIRED'
                  ? 'Tarification à négocier'
                  : 'Estimation'}
              </strong>
            </div>

            {estimate.distanceKm !== undefined && (
              <p
                style={{
                  margin: '5px 0',
                  fontSize: 14,
                }}
              >
                Distance :{' '}
                <strong>
                  {estimate.distanceKm} km
                </strong>
              </p>
            )}

            {estimate.nbJours !== undefined && (
              <p
                style={{
                  margin: '5px 0',
                  fontSize: 14,
                }}
              >
                Durée :{' '}
                <strong>
                  {estimate.nbJours} jour
                  {estimate.nbJours > 1
                    ? 's'
                    : ''}
                </strong>
              </p>
            )}

            {estimate.status ===
            'NEGOTIATION_REQUIRED' ? (
              <p
                style={{
                  margin: '10px 0 0',
                  color: '#667085',
                  fontSize: 13,
                }}
              >
                Le prix final sera déterminé lors de
                la négociation.
              </p>
            ) : (
              <p
                style={{
                  margin: '10px 0 0',
                  fontSize: 20,
                  fontWeight: 900,
                  color: '#06245F',
                }}
              >
                {formatAr(price)}
              </p>
            )}

            {estimate.pricingModel && (
              <p
                style={{
                  margin: '8px 0 0',
                  fontSize: 12,
                  color: '#667085',
                }}
              >
                Mode tarifaire :{' '}
                {estimate.pricingModel}
              </p>
            )}
          </section>
        )}

        {requestError && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 10,
              background: '#fff4f4',
              color: '#b42318',
              fontSize: 13,
            }}
          >
            {requestError.message}
          </div>
        )}

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          style={{
            width: '100%',
            marginTop: 14,
            padding: '14px 16px',
            border: 'none',
            borderRadius: 12,
            background: '#0A6F35',
            color: '#fff',
            fontWeight: 800,
            cursor: canSubmit
              ? 'pointer'
              : 'not-allowed',
            opacity: canSubmit ? 1 : 0.55,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Send size={17} />
          {submitting
            ? 'Envoi en cours...'
            : 'Envoyer la demande'}
        </button>
      </section>
    </main>
  );
}