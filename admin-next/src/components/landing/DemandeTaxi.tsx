'use client';

import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';

export default function DemandeTaxi() {
  const [flottes, setFlottes] = useState<any[]>([]);
  const [mode, setMode] = useState<'choisir' | 'toutes' | 'proche'>('choisir');
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [adresse, setAdresse] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch('/public/organizations')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const fleets = Array.isArray(data) ? data.filter((o: any) => o.type === 'FLEET_MANAGER') : [];
        setFlottes(fleets);
      })
      .catch(() => {});
  }, []);

  function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPosition({ lat, lng });
          setMode('proche');
          
          // Reverse geocoding avec Nominatim (OpenStreetMap)
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            if (res.ok) {
              const data = await res.json();
              const addr = data.address;
              const quartier = addr.neighbourhood || addr.suburb || addr.quarter || '';
              const rue = addr.road || addr.pedestrian || '';
              const ville = addr.city || addr.town || addr.village || '';
              setAdresse(`${rue ? rue + ', ' : ''}${quartier ? quartier + ', ' : ''}${ville}`.trim() || 'Position détectée');
            }
          } catch {}
        },
        () => alert('❌ Géolocalisation refusée')
      );
    } else {
      alert('❌ Géolocalisation non supportée');
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    setLoading(true);

    try {
      const details = {
        depart: formData.get('depart') as string,
        arrivee: formData.get('arrivee') as string,
        typeVehicule: formData.get('type') as string,
        mode: mode,
        ...(position && { position: { lat: position.lat, lng: position.lng } }),
      };

      if (mode === 'toutes') {
        // Envoyer à toutes les flottes
        let sent = 0;
        for (const flotte of flottes) {
          const res = await apiFetch('/public/actions', {
            method: 'POST',
            body: JSON.stringify({
              organizationSlug: flotte.slug,
              type: 'COURSE_REQUEST',
              clientNom: formData.get('nom') as string,
              clientTel: formData.get('tel') as string,
              details,
            }),
          });
          if (res.ok) sent++;
        }
        form.reset();
        alert(`✅ Demande envoyée à ${sent} flotte(s) !`);
      } else {
        // Envoyer à une flotte spécifique
        const slug = formData.get('flotte') as string;
        if (!slug) {
          alert('Veuillez choisir une flotte');
          return;
        }
        const res = await apiFetch('/public/actions', {
          method: 'POST',
          body: JSON.stringify({
            organizationSlug: slug,
            type: 'COURSE_REQUEST',
            clientNom: formData.get('nom') as string,
            clientTel: formData.get('tel') as string,
            details,
          }),
        });
        if (res.ok) {
          form.reset();
          alert('✅ Demande envoyée !');
        }
      }
    } catch (error) {
      alert('❌ Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-md mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-4">🚕 Demander un taxi</h2>
        <p className="text-center text-gray-500 text-sm mb-6">Choisissez comment vous voulez être mis en relation</p>

        {/* Mode de mise en relation */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode('choisir')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${mode === 'choisir' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Choisir une flotte
          </button>
          <button
            type="button"
            onClick={() => setMode('toutes')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${mode === 'toutes' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Toutes les flottes
          </button>
          <button
            type="button"
            onClick={getLocation}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${mode === 'proche' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            📍 La plus proche
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 bg-gray-50 p-6 rounded-xl border">
          <input name="nom" placeholder="Votre nom" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <input name="tel" type="tel" placeholder="Votre téléphone" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <input name="depart" placeholder="Adresse de départ" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <input name="arrivee" placeholder="Adresse d'arrivée" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <select name="type" className="w-full px-4 py-3 border rounded-lg text-sm">
            <option value="moto">🏍️ Taxi Moto</option>
            <option value="voiture">🚗 Taxi</option>
          </select>

          {mode === 'choisir' && (
            <select name="flotte" className="w-full px-4 py-3 border rounded-lg text-sm" required>
              <option value="">-- Choisir une flotte --</option>
              {flottes.map((f: any) => (
                <option key={f.id} value={f.slug}>{f.name}</option>
              ))}
            </select>
          )}

          {mode === 'proche' && position && (
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-sm font-semibold text-green-700">📍 Position détectée</p>
              <p className="text-xs text-green-600">
                {adresse || 'Antananarivo, Madagascar'}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Coordonnées : {position.lat.toFixed(4)}°S, {position.lng.toFixed(4)}°E
              </p>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
            {loading ? 'Envoi...' : mode === 'toutes' ? 'Envoyer à toutes les flottes' : mode === 'proche' ? 'Trouver la flotte la plus proche' : 'Demander un taxi'}
          </button>
        </form>
      </div>
    </section>
  );
}
