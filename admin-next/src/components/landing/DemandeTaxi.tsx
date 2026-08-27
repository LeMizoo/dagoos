'use client';

import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';

export default function DemandeTaxi() {
  const [flottes, setFlottes] = useState<any[]>([]);
  const [mode, setMode] = useState<'choisir' | 'toutes' | 'proche'>('choisir');
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [adresse, setAdresse] = useState('');
  const [loading, setLoading] = useState(false);
  const [estimation, setEstimation] = useState<{ distanceKm: number; prixEstime: number } | null>(null);
  const [estimating, setEstimating] = useState(false);

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

  async function estimerPrix() {
    const form = document.querySelector('form') as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);
    const depart = formData.get('depart') as string;
    const arrivee = formData.get('arrivee') as string;
    const typeVehicule = formData.get('type') as string;
    const flotte = formData.get('flotte') as string;

    if (!depart || !arrivee || !flotte) {
      setEstimation(null);
      return;
    }

    setEstimating(true);

    try {
      const res = await apiFetch('/public/estimate', {
        method: 'POST',
        body: JSON.stringify({
          organizationSlug: flotte,
          depart,
          arrivee,
          typeVehicule: typeVehicule || 'moto'
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setEstimation(data);
      } else {
        setEstimation(null);
      }
    } catch(e) {
      setEstimation(null);
    } finally {
      setEstimating(false);
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
        <h2 className="font-display text-2xl font-bold text-center mb-4">Demander un taxi</h2>
        <p className="text-center text-gray-500 text-sm mb-6">Choisissez comment vous voulez être mis en relation</p>

        {/* Mode de mise en relation */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode('choisir')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${mode === 'choisir' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Choisir une flotte
          </button>
          <button
            type="button"
            onClick={() => setMode('toutes')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${mode === 'toutes' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Toutes les flottes
          </button>
          <button
            type="button"
            onClick={getLocation}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${mode === 'proche' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            La plus proche
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 bg-gray-50 p-6 rounded-xl border">
          <input name="nom" placeholder="Votre nom" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <input name="tel" type="tel" placeholder="Votre téléphone" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <input name="depart" placeholder="Adresse de départ" className="w-full px-4 py-3 border rounded-lg text-sm" required onBlur={estimerPrix} />
          <input name="arrivee" placeholder="Adresse d'arrivée" className="w-full px-4 py-3 border rounded-lg text-sm" required onBlur={estimerPrix} />
          <select name="type" className="w-full px-4 py-3 border rounded-lg text-sm" onChange={estimerPrix}>
            <option value="moto">Taxi moto</option>
            <option value="voiture">Taxi voiture</option>
          </select>

          {estimating && (
            <p className="text-sm text-gray-500 text-center">Calcul en cours...</p>
          )}

          {estimation && !estimating && (
            <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-200">
              <p className="text-sm font-semibold text-emerald-700">Estimation</p>
              <p className="text-xs text-emerald-600">
                Distance approximative : <strong>{estimation.distanceKm} km</strong>
              </p>
              <p className="text-xs text-emerald-600">
                Prix de la course : <strong>{estimation.prixEstime.toLocaleString('fr-FR')} Ar</strong>
              </p>
              <input
                name="offreClient"
                type="number"
                placeholder="Votre offre (Ar)"
                min="0"
                className="mt-2 w-full px-3 py-2 border rounded-lg text-sm text-center"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                💡 Proposez votre prix — le chauffeur accepte ou refuse
              </p>
            </div>
          )}

          {mode === 'choisir' && (
            <select name="flotte" className="w-full px-4 py-3 border rounded-lg text-sm" required onChange={estimerPrix}>
              <option value="">-- Choisir une flotte --</option>
              {flottes.map((f: any) => (
                <option key={f.id} value={f.slug}>{f.name}</option>
              ))}
            </select>
          )}

          {mode === 'choisir' && !estimation && !estimating && (
            <p className="text-xs text-gray-400 text-center">
              💡 Choisissez une flotte puis saisissez départ et arrivée pour voir l'estimation
            </p>
          )}

          {mode === 'proche' && position && (
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <p className="text-sm font-semibold text-emerald-700">Position détectée</p>
              <p className="text-xs text-emerald-600">
                {adresse || 'Antananarivo, Madagascar'}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Coordonnées : {position.lat.toFixed(4)}°S, {position.lng.toFixed(4)}°E
              </p>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-[#154360] transition disabled:opacity-50">
            {loading ? 'Envoi...' : mode === 'toutes' ? 'Envoyer à toutes les flottes' : mode === 'proche' ? 'Trouver la flotte la plus proche' : 'Demander un taxi'}
          </button>
        </form>
      </div>
    </section>
  );
}
