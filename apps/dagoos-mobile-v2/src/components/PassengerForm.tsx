// ============================================================
// Components — PassengerForm
// Phase 1 — Étape 1.7.b
//
// Formulaire des informations passagers :
//   - Un input « nom » par place sélectionnée (ordre legacy)
//   - Un input « téléphone » global
//
// La référence de paiement n'est volontairement pas présente :
// le backend actuel /public/reservations/batch ne la consomme pas.
// ============================================================

import type { CSSProperties } from 'react';

interface PassengerFormProps {
  selectedPlaces: string[];
  passengers: Record<string, string>;
  onPassengerChange: (place: string, nom: string) => void;
  telephone: string;
  onTelephoneChange: (tel: string) => void;
}

// ------------------------------------------------------------
// Styles partagés
// ------------------------------------------------------------

const labelStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--text-secondary)',
  display: 'block',
  marginBottom: 4,
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: 12,
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg-page)',
  color: 'var(--text-primary)',
  fontSize: 14,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

// ------------------------------------------------------------
// Composant
// ------------------------------------------------------------

export function PassengerForm({
  selectedPlaces,
  passengers,
  onPassengerChange,
  telephone,
  onTelephoneChange,
}: PassengerFormProps) {
  return (
    <div>
      {/* Titre section */}
      <h3
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: 'var(--accent)',
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        2. Informations passagers
      </h3>

      {/* Inputs nom par place */}
      {selectedPlaces.length === 0 ? (
        <p
          style={{
            textAlign: 'center',
            color: 'var(--text-secondary)',
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          Sélectionnez des places ci-dessus
        </p>
      ) : (
        <div style={{ marginBottom: 12 }}>
          {selectedPlaces.map((place) => (
            <div key={place} style={{ marginBottom: 8 }}>
              <label
                htmlFor={`passager_${place}`}
                style={labelStyle}
              >
                Place {place} — Nom du passager
              </label>

              <input
                id={`passager_${place}`}
                data-place={place}
                type="text"
                placeholder={`Nom du passager place ${place}`}
                value={passengers[place] ?? ''}
                onChange={(event) =>
                  onPassengerChange(place, event.target.value)
                }
                style={inputStyle}
              />
            </div>
          ))}
        </div>
      )}

      {/* Téléphone */}
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="resTel" style={labelStyle}>
          Votre téléphone
        </label>

        <input
          id="resTel"
          type="tel"
          placeholder="Téléphone"
          value={telephone}
          onChange={(event) => onTelephoneChange(event.target.value)}
          style={inputStyle}
        />
      </div>
    </div>
  );
}