'use client';

interface PlanVehiculeProps {
  placesTotal: number;
  placesReservees: string[];
  placesSelectionnees?: string[];
  onPlaceClick?: (place: string) => void;
}

export default function PlanVehicule({
  placesTotal,
  placesReservees,
  placesSelectionnees = [],
  onPlaceClick,
}: PlanVehiculeProps) {
  const getPlaceStyle = (place: string) => {
    if (placesReservees.includes(place)) {
      return 'bg-red-500 text-white cursor-not-allowed';
    }
    if (placesSelectionnees.includes(place)) {
      return 'bg-blue-500 text-white cursor-pointer';
    }
    return 'bg-green-500 text-white cursor-pointer hover:bg-green-600';
  };

  const handleClick = (place: string) => {
    if (placesReservees.includes(place)) return;
    if (onPlaceClick) onPlaceClick(place);
  };

  // Générer les places selon le modèle malgache :
  // Rangée 1 : 1A, 1B (à côté du conducteur)
  // Rangées suivantes : 2A, 2B, 2C, 2D, etc.
  const places: string[] = [];

  // Rangée 1 : 2 places
  if (placesTotal >= 1) places.push('1A');
  if (placesTotal >= 2) places.push('1B');

  // Rangées suivantes : 4 places par rangée
  let rowNumber = 2;
  let remaining = placesTotal - 2;

  while (remaining > 0 && rowNumber <= 20) {
    const letters = ['A', 'B', 'C', 'D'];
    for (const letter of letters) {
      if (remaining <= 0) break;
      places.push(`${rowNumber}${letter}`);
      remaining--;
    }
    rowNumber++;
  }

  const firstRowPlaces = places.filter(p => p.startsWith('1'));
  const otherPlaces = places.filter(p => !p.startsWith('1'));

  // Grouper les autres places par rangée
  const rows: string[][] = [];
  for (let i = 0; i < otherPlaces.length; i += 4) {
    rows.push(otherPlaces.slice(i, i + 4));
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
      {/* Rangée 1 : Conducteur + 1A + 1B */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="text-xs bg-gray-800 text-white px-3 py-1 rounded-full whitespace-nowrap">🧑‍✈️ Conducteur</span>
        <div className="w-2" />
        {firstRowPlaces.map(place => (
          <button
            key={place}
            type="button"
            onClick={() => handleClick(place)}
            disabled={placesReservees.includes(place)}
            className={`w-10 h-10 rounded-lg text-xs font-bold flex items-center justify-center transition ${getPlaceStyle(place)}`}
            title={`Place ${place}`}
          >
            {place}
          </button>
        ))}
      </div>

      {/* Rangées suivantes : 2 gauche, allée, 2 droite */}
      <div className="flex flex-col items-center gap-2">
        {rows.map((rowPlaces, idx) => {
          const leftPlaces = rowPlaces.filter(p => p.endsWith('A') || p.endsWith('B'));
          const rightPlaces = rowPlaces.filter(p => p.endsWith('C') || p.endsWith('D'));

          return (
            <div key={idx} className="flex items-center gap-4">
              <div className="flex gap-2">
                {leftPlaces.map(place => (
                  <button
                    key={place}
                    type="button"
                    onClick={() => handleClick(place)}
                    disabled={placesReservees.includes(place)}
                    className={`w-10 h-10 rounded-lg text-xs font-bold flex items-center justify-center transition ${getPlaceStyle(place)}`}
                    title={`Place ${place}`}
                  >
                    {place}
                  </button>
                ))}
              </div>
              <div className="w-6" />
              <div className="flex gap-2">
                {rightPlaces.map(place => (
                  <button
                    key={place}
                    type="button"
                    onClick={() => handleClick(place)}
                    disabled={placesReservees.includes(place)}
                    className={`w-10 h-10 rounded-lg text-xs font-bold flex items-center justify-center transition ${getPlaceStyle(place)}`}
                    title={`Place ${place}`}
                  >
                    {place}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex justify-center gap-4 mt-4 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded"></span> Disponible</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded"></span> Réservé</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded"></span> Sélectionné</span>
      </div>
    </div>
  );
}
