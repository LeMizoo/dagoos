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
  const rangees = Math.ceil(placesTotal / 4);
  
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

  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4">
      {/* Chauffeur */}
      <div className="text-center mb-3">
        <span className="text-xs bg-gray-800 text-white px-3 py-1 rounded-full">🚌 Conducteur</span>
      </div>
      
      {/* Places */}
      <div className="flex flex-col items-center gap-2">
        {Array.from({ length: rangees }, (_, i) => {
          const rowPlaces = [];
          for (let j = 0; j < 4; j++) {
            const idx = i * 4 + j + 1;
            if (idx <= placesTotal) {
              const col = j < 2 ? 'A' : 'B';
              const placeNumber = j < 2 ? (i * 2 + 1) : (i * 2 + 2);
              const place = `${placeNumber}${col}`;
              rowPlaces.push(place);
            }
          }
          if (rowPlaces.length === 0) return null;
          
          return (
            <div key={i} className="flex items-center gap-6">
              {rowPlaces.slice(0, 2).map(place => (
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
              <div className="w-6" />
              {rowPlaces.slice(2, 4).map(place => (
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
