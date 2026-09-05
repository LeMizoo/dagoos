'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function DemandeLocation({ 
  typeOrganisation = 'FLEET_MANAGER',
  mode = 'urbain'
}: { 
  typeOrganisation?: string;
  mode?: 'urbain' | 'interurbain' | 'long_haul';
}) {
  const [flottes, setFlottes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [codeSuivi, setCodeSuivi] = useState<string | null>(null);
  const [estimation, setEstimation] = useState<any | null>(null);
  const [estimating, setEstimating] = useState(false);

  useEffect(() => {
    apiFetch('/public/organizations')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const fleets = Array.isArray(data) ? data.filter((o: any) => o.type === typeOrganisation) : [];
        setFlottes(fleets);
      })
      .catch(() => {});

    // Initialiser les options de véhicules selon le mode
    if (mode === 'long_haul') {
      updateVehiculeOptions();
    }
  }, []);

  async function estimerLocation() {
    const form = document.querySelector('form') as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);
    const flotte = formData.get('flotte') as string;
    const typeVehicule = formData.get('typeVehicule') as string;
    const typeTrajet = formData.get('typeTrajet') as string;
    const depart = formData.get('depart') as string;
    const arrivee = formData.get('arrivee') as string;
    const dateAller = formData.get('dateAller') as string;
    const dateRetour = formData.get('dateRetour') as string;
    const carburant = formData.get('carburant') as string;

    if (!flotte || !depart || !arrivee || !dateAller) {
      setEstimation(null);
      return;
    }

    setEstimating(true);

    try {
      const res = await apiFetch('/public/estimate-location', {
        method: 'POST',
        body: JSON.stringify({
          organizationSlug: flotte,
          typeVehicule,
          typeTrajet,
          depart,
          arrivee,
          dateAller,
          dateRetour: dateRetour || null,
          carburant
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
      const details = Object.fromEntries(formData);

      const res = await apiFetch('/public/actions', {
        method: 'POST',
        body: JSON.stringify({
          organizationSlug: formData.get('flotte') as string,
          type: mode === 'long_haul' ? 'LONG_HAUL' : 'CAR_RENTAL',
          clientNom: formData.get('nom') as string,
          clientTel: formData.get('tel') as string,
          details,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCodeSuivi(data.codeSuivi || null);
        form.reset();
        setEstimation(null);
        if (data.codeSuivi) {
          alert('✅ Demande de location envoyée !\n\n📋 VOTRE CODE DE SUIVI : ' + data.codeSuivi + '\n\n⚠️ Retenez bien ce code avant de fermer cette fenêtre !');
        } else {
          alert('✅ Demande envoyée !');
        }
      }
    } catch(e) {
      alert('❌ Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  function updateVehiculeOptions() {
    const service = (document.getElementById('typeService') as HTMLSelectElement)?.value || 'passagers';
    const vehiculeSelect = document.getElementById('typeVehicule') as HTMLSelectElement;
    if (!vehiculeSelect) return;

    // Règles métier : véhicules compatibles par type de service
    const vehiclesByService: Record<string, Array<{value: string, label: string}>> = {
      'passagers': [
        { value: 'bus', label: '🚌 Bus' },
        { value: 'minivan', label: '🚐 Mini Van' }
      ],
      'marchandises': [
        { value: 'fourgon', label: '🚚 Fourgon' },
        { value: 'camion_frigo', label: '🧊 Camion frigorifique' }
      ],
      'demenagement': [
        { value: 'fourgon', label: '🚚 Fourgon' },
        { value: 'camion', label: '🚛 Camion' }
      ],
      'depannage': [
        { value: 'depanneuse', label: '🔧 Dépanneuse' }
      ],
      'fret': [
        { value: 'camion', label: '🚛 Camion' },
        { value: 'semi_remorque', label: '🚛 Semi-remorque' }
      ]
    };

    const vehicles = vehiclesByService[service] || vehiclesByService['passagers'];

    vehiculeSelect.innerHTML = vehicles.map(v => 
      `<option value="${v.value}">${v.label}</option>`
    ).join('');
  }

  useEffect(() => {
    if (mode === 'long_haul') {
      updateVehiculeOptions();
    }
  }, [mode]);

  return (
    <section className="py-8 bg-white">
      <div className="max-w-md mx-auto px-4">
        <h2 className="font-display text-2xl font-bold text-center mb-4">🚐 Demander une location</h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          {mode === 'long_haul'
            ? 'Transport longue distance inter-urbain avec véhicule adapté'
            : 'Bus, minivan ou tricycle pour vos événements et déplacements'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 bg-gray-50 p-6 rounded-xl border">
          <input name="nom" placeholder="Votre nom" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <input name="tel" type="tel" placeholder="Votre téléphone" className="w-full px-4 py-3 border rounded-lg text-sm" required />

          <select name="flotte" className="w-full px-4 py-3 border rounded-lg text-sm" required>
            <option value="">-- Choisir une flotte --</option>
            {flottes.map((f: any) => (
              <option key={f.id} value={f.slug}>{f.name}</option>
            ))}
          </select>

          {mode === 'long_haul' ? (
            <>
              <select name="typeService" id="typeService" onChange={() => updateVehiculeOptions()} className="w-full px-4 py-3 border rounded-lg text-sm" required>
                <option value="passagers">👥 Transport passagers</option>
                <option value="marchandises">📦 Marchandises</option>
                <option value="demenagement">🏠 Déménagement</option>
                <option value="depannage">🔧 Dépannage</option>
                <option value="fret">🚛 Fret lourd</option>
              </select>

              <select name="typeVehicule" id="typeVehicule" className="w-full px-4 py-3 border rounded-lg text-sm" required>
                <option value="bus">🚌 Bus</option>
                <option value="minivan">🚐 Mini Van</option>
              </select>
            </>
          ) : (
            <select name="typeVehicule" className="w-full px-4 py-3 border rounded-lg text-sm" required>
              {typeOrganisation === 'COOPERATIVE' ? (
                <>
                  <option value="bus">🚌 Bus</option>
                  <option value="minivan">🚐 Mini Van</option>
                </>
              ) : (
                <>
                  <option value="moto">🏍️ Moto</option>
                  <option value="voiture">🚗 Voiture</option>
                  <option value="bus">🚌 Bus</option>
                  <option value="minivan">🚐 Mini Van</option>
                  <option value="tricycle">🛺 Tricycle</option>
                </>
              )}
            </select>
          )}

          <select name="typeTrajet" className="w-full px-4 py-3 border rounded-lg text-sm" required>
            <option value="A_B">A → B (aller simple)</option>
            <option value="A_B_A">A → B → A (aller-retour même jour)</option>
            <option value="A_B_A_MULTI">A → B → A (multi-jours)</option>
          </select>

          <input name="depart" placeholder="Adresse de départ" className="w-full px-4 py-3 border rounded-lg text-sm" required onBlur={estimerLocation} />
          <input name="arrivee" placeholder="Adresse d'arrivée" className="w-full px-4 py-3 border rounded-lg text-sm" required onBlur={estimerLocation} />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">Date aller</label>
              <input name="dateAller" type="date" className="w-full px-3 py-2 border rounded-lg text-sm" required onBlur={estimerLocation} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Heure départ</label>
              <input name="heureDepart" type="time" className="w-full px-3 py-2 border rounded-lg text-sm" required onBlur={estimerLocation} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">Date retour</label>
              <input name="dateRetour" type="date" className="w-full px-3 py-2 border rounded-lg text-sm" onBlur={estimerLocation} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Heure retour</label>
              <input name="heureRetour" type="time" className="w-full px-3 py-2 border rounded-lg text-sm" onBlur={estimerLocation} />
            </div>
          </div>

          <select name="carburant" className="w-full px-4 py-3 border rounded-lg text-sm" required>
            <option value="AVEC">Avec carburant</option>
            <option value="SANS">Sans carburant</option>
          </select>

          <input name="nbPassagers" type="number" placeholder="Nombre de passagers" min="1" className="w-full px-4 py-3 border rounded-lg text-sm" required />

          {estimating && (
            <p className="text-sm text-gray-500 text-center">Calcul en cours...</p>
          )}

          {estimation && !estimating && (
            <div className="bg-emerald-50 rounded-lg p-3 text-center border border-emerald-200">
              <p className="text-sm font-semibold text-emerald-700">Estimation</p>
              <p className="text-xs text-emerald-600">
                Distance : <strong>{estimation.distanceKm} km</strong>
              </p>
              <p className="text-xs text-emerald-600">
                Prix : <strong>{estimation.prixEstime.toLocaleString('fr-FR')} Ar</strong>
              </p>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-[#154360] transition disabled:opacity-50">
            {loading ? 'Envoi...' : 'Envoyer la demande'}
          </button>

          {codeSuivi && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-5 text-center mt-4">
              <p className="text-sm font-bold text-amber-800 mb-2">✅ Demande envoyée !</p>
              <p className="text-sm font-bold text-red-600 mb-2">⚠️ RETENEZ BIEN VOTRE CODE AVANT DE FERMER</p>
              <p className="text-4xl font-mono font-black tracking-widest text-amber-900 bg-white rounded-lg py-3 border-2 border-amber-300">{codeSuivi}</p>
              <p className="text-xs text-gray-600 mt-3">📋 Notez ce code ou faites une capture d'écran</p>
              <a href="/suivi" className="inline-block mt-3 bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#154360] transition">
                Suivre ma demande →
              </a>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
