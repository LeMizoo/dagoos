// ============================================================
// Components — BusSeatMap
// Phase 1 — Étape 1.7.b
//
// Grille des places d'un bus interurbain (26 places).
// Format fidèle au legacy :
//   🧑‍✈️ Conducteur 1A 1B
//   2A 2B | 2C 2D
//   3A 3B | 3C 3D
//   4A 4B | 4C 4D
//   5A 5B | 5C 5D
//   6A 6B | 6C 6D
//   7A 7B | 7C
//
// États d'une place :
//   - réservée     : rouge, non cliquable
//   - sélectionnée : bleu, cliquable (désélection)
//   - disponible   : neutre, cliquable (sélection)
// ============================================================

interface BusSeatMapProps {
  reservedPlaces: string[];
  selectedPlaces: string[];
  onToggle: (place: string) => void;
}

// ------------------------------------------------------------
// Disposition des rangées
// null = emplacement vide dans la rangée (alignement visuel)
// ------------------------------------------------------------

const SEAT_ROWS: (string | null)[][] = [
  ['1A', '1B'],
  ['2A', '2B', '2C', '2D'],
  ['3A', '3B', '3C', '3D'],
  ['4A', '4B', '4C', '4D'],
  ['5A', '5B', '5C', '5D'],
  ['6A', '6B', '6C', '6D'],
  ['7A', '7B', '7C', null],
];

// ------------------------------------------------------------
// Bouton place
// ------------------------------------------------------------

interface SeatButtonProps {
  label: string;
  isReserved: boolean;
  isSelected: boolean;
  onToggle: (place: string) => void;
}

function SeatButton({
  label,
  isReserved,
  isSelected,
  onToggle,
}: SeatButtonProps) {
  const background = isReserved
    ? 'var(--error-fg)'
    : isSelected
      ? 'var(--info-fg)'
      : 'var(--bg-page)';

  const cursor = isReserved ? 'not-allowed' : 'pointer';

  return (
    <button
      type="button"
      data-place={label}
      disabled={isReserved}
      onClick={() => onToggle(label)}
      style={{
        width: 44,
        height: 44,
        borderRadius: 8,
        border: '1px solid var(--border)',
        background,
        color: 'var(--text-on-accent)',
        fontSize: 11,
        fontWeight: 700,
        cursor,
        padding: 0,
        fontFamily: 'inherit',
      }}
      aria-label={`Place ${label}${
        isReserved ? ' (réservée)' : isSelected ? ' (sélectionnée)' : ''
      }`}
    >
      {label}
    </button>
  );
}

// ------------------------------------------------------------
// Carte
// ------------------------------------------------------------

export function BusSeatMap({
  reservedPlaces,
  selectedPlaces,
  onToggle,
}: BusSeatMapProps) {
  const isReserved = (label: string) => reservedPlaces.includes(label);
  const isSelected = (label: string) => selectedPlaces.includes(label);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {/* Rangée conducteur (indicatif) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 16 }} aria-hidden="true">
          🧑‍✈️
        </span>
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
          }}
        >
          Conducteur
        </span>
      </div>

      {/* Rangées de places */}
      {SEAT_ROWS.map((row, rowIndex) => {
        // Rangée 1 : conducteur + 2 places (pas de couloir central)
        // Rangées 2-6 : 2 places + couloir + 2 places
        // Rangée 7 : 3 places (dernière rangée)
        const isFirstRow = rowIndex === 0;
        const isLastRow = rowIndex === SEAT_ROWS.length - 1;

        if (isFirstRow) {
          return (
            <div
              key={rowIndex}
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {row.map((label) => (
                <SeatButton
                  key={label}
                  label={label!}
                  isReserved={isReserved(label!)}
                  isSelected={isSelected(label!)}
                  onToggle={onToggle}
                />
              ))}
            </div>
          );
        }

        if (isLastRow) {
          return (
            <div
              key={rowIndex}
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {row.map((label, index) =>
                label === null ? (
                  <div
                    key={`empty-${index}`}
                    style={{ width: 44, height: 44 }}
                    aria-hidden="true"
                  />
                ) : (
                  <SeatButton
                    key={label}
                    label={label}
                    isReserved={isReserved(label)}
                    isSelected={isSelected(label)}
                    onToggle={onToggle}
                  />
                )
              )}
            </div>
          );
        }

        // Rangées 2-6 : split gauche / couloir / droite
        const leftSeats = row.slice(0, 2);
        const rightSeats = row.slice(2);

        return (
          <div
            key={rowIndex}
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              {leftSeats.map((label) =>
                label === null ? (
                  <div
                    key={`empty-left-${label}`}
                    style={{ width: 44, height: 44 }}
                    aria-hidden="true"
                  />
                ) : (
                  <SeatButton
                    key={label}
                    label={label}
                    isReserved={isReserved(label)}
                    isSelected={isSelected(label)}
                    onToggle={onToggle}
                  />
                )
              )}
            </div>

            {/* Couloir central (visuel uniquement) */}
            <div
              style={{ width: 20 }}
              aria-hidden="true"
            />

            <div style={{ display: 'flex', gap: 8 }}>
              {rightSeats.map((label) =>
                label === null ? (
                  <div
                    key={`empty-right-${label}`}
                    style={{ width: 44, height: 44 }}
                    aria-hidden="true"
                  />
                ) : (
                  <SeatButton
                    key={label}
                    label={label}
                    isReserved={isReserved(label)}
                    isSelected={isSelected(label)}
                    onToggle={onToggle}
                  />
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}