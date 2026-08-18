'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Phone, Users, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import PlanVehicule from '@/components/coop/PlanVehicule';

export default function CooperativeLandingPage({ params }: { params: { slug: string } }) {
  const [cooperative, setCooperative] = useState<any | null>(null);
  const [departs, setDeparts] = useState<any[]>([]);
  const [villesDepart, setVillesDepart] = useState<string[]>([]);
  const [villeFiltre, setVilleFiltre] = useState('');
  const [selectedDepart, setSelectedDepart] = useState<any | null>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [passagers, setPassagers] = useState<Record<string, string>>({});
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showReservation, setShowReservation] = useState(false);
  const [editingReservation, setEditingReservation] = useState(false);

  useEffect(() => {
    loadPage();
  }, [params.slug]);

  async function loadPage() {
    try {
      const [orgRes, departsRes] = await Promise.all([
        apiFetch(`/public/organizations/${params.slug}`),
        apiFetch(`/public/departs/${params.slug}`),
      ]);
      
      if (orgRes.ok) setCooperative(await orgRes.json());
      if (departsRes.ok) {
        const data = await departsRes.json();
        const departsArray = Array.isArray(data) ? data : [];
        setDeparts(departsArray);
        const villes = [...new Set(departsArray.map((d: any) => d.pointDepart))];
        setVillesDepart(villes);
        if (villes.length > 0) setVilleFiltre(villes[0]);
        
        // Mettre à jour le départ sélectionné avec les données fraîches
        if (selectedDepart) {
          const updated = departsArray.find((d: any) => d.id === selectedDepart.id);
          if (updated) setSelectedDepart(updated);
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const departsFiltres = villeFiltre ? departs.filter(d => d.pointDepart === villeFiltre) : departs;

  function handleSelectDepart(d: any) {
    setSelectedDepart(d);
    setSelectedPlaces([]);
    setPassagers({});
    setShowReservation(true);
    // Scroll vers le formulaire
    setTimeout(() => {
      document.getElementById('reservation-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  function handlePlaceClick(place: string) {
    setSelectedPlaces(prev => {
      if (prev.includes(place)) {
        const newPlaces = prev.filter(p => p !== place);
        const newPassagers = { ...passagers };
        delete newPassagers[place];
        setPassagers(newPassagers);
        return newPlaces;
      }
      return [...prev, place];
    });
  }

  async function handleReservation(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedDepart || selectedPlaces.length === 0) {
      setError('Veuillez sélectionner au moins une place');
      return;
    }
    if (!telephone.trim()) {
      setError('Veuillez saisir votre téléphone');
      return;
    }

    const passagersList = selectedPlaces.map(place => ({
      passagerNom: passagers[place]?.trim() || '',
      place,
    }));

    const missing = passagersList.filter(p => !p.passagerNom);
    if (missing.length > 0) {
      setError(`Nom du passager requis pour la place ${missing[0].place}`);
      return;
    }

    try {
      const res = await apiFetch('/public/reservations/batch', {
        method: 'POST',
        body: JSON.stringify({
          departId: selectedDepart.id,
          telephone: telephone.trim(),
          passagers: passagersList,
        }),
      });

      if (res.ok) {
        setSuccess('✅ Réservation confirmée !');
        setSelectedPlaces([]);
        setPassagers({});
        setTelephone('');
        setEditingReservation(false);
        // Recharger les départs pour mettre à jour les places réservées
        await loadPage();
        // Garder le départ sélectionné
        setShowReservation(true);
        setSelectedDepart((prev: any) => prev);
      } else {
        const err = await res.json();
        setError(err.error || 'Erreur de réservation');
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Chargement...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="relative bg-gradient-to-r from-emerald-600 to-emerald-800 text-white py-12">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <Link href="/" className="absolute top-4 left-4 text-white/80 hover:text-white transition text-sm flex items-center gap-2">
            ← Retour à l'accueil
          </Link>
          <h1 className="text-3xl font-bold mb-2">{cooperative?.name || 'Coopérative'}</h1>
          <p className="text-emerald-100">Réservez votre place en ligne</p>
          {cooperative?.phone && (
            <p className="text-emerald-100/80 mt-2 flex items-center justify-center gap-2">
              <Phone size={16} /> {cooperative.phone}
            </p>
          )}
        </div>
      </header>

      {/* Filtres villes */}
      <section className="py-8 max-w-5xl mx-auto px-4">
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          <span className="text-sm text-gray-500 flex items-center gap-1"><MapPin size={14} /> Départ :</span>
          <button
            onClick={() => setVilleFiltre('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              villeFiltre === '' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-emerald-50 border'
            }`}
          >
            Tous
          </button>
          {villesDepart.map(ville => (
            <button
              key={ville}
              onClick={() => setVilleFiltre(ville)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                villeFiltre === ville ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-emerald-50 border'
              }`}
            >
              {ville}
            </button>
          ))}
        </div>

        {/* Liste des départs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departsFiltres.map((d: any) => {
            const placesReservees = (d.reservations || []).map((r: any) => r.place);
            const placesDisponibles = d.placesTotal - placesReservees.length;
            const isSelected = selectedDepart?.id === d.id;

            return (
              <button
                key={d.id}
                onClick={() => handleSelectDepart(d)}
                className={`text-left bg-white rounded-xl p-5 border-2 transition ${
                  isSelected ? 'border-emerald-500 shadow-lg' : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                <h3 className="font-bold text-gray-800 text-lg">
                  {d.destination}
                </h3>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <Calendar size={14} /> {new Date(d.date).toLocaleDateString('fr-FR')}
                  <Clock size={14} /> {d.heure}
                </p>
                <p className="text-2xl font-bold text-emerald-600 mt-3">
                  {Number(d.prix).toLocaleString()} Ar
                </p>
                <p className={`text-xs mt-2 ${placesDisponibles > 5 ? 'text-green-600' : 'text-red-600'}`}>
                  {placesDisponibles} places disponibles
                </p>
              </button>
            );
          })}
          {departsFiltres.length === 0 && (
            <p className="col-span-full text-center text-gray-500 py-8">Aucun départ pour cette ville.</p>
          )}
        </div>
      </section>

      {/* Formulaire de réservation */}
      {showReservation && selectedDepart && (
        <section id="reservation-form" className="py-8 bg-white border-t">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-6">
              Réserver : {selectedDepart.destination} - {selectedDepart.heure}
            </h2>

            {success && <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-4 text-center">{success}</div>}
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 text-center">{error}</div>}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Plan */}
              <div>
                <h3 className="font-semibold mb-2 text-center">1. Choisissez vos places</h3>
                <PlanVehicule
                  placesTotal={selectedDepart.placesTotal}
                  placesReservees={(selectedDepart.reservations || []).map((r: any) => r.place)}
                  placesSelectionnees={selectedPlaces}
                  onPlaceClick={handlePlaceClick}
                />
              </div>

              {/* Formulaire */}
              <div>
                <h3 className="font-semibold mb-2 text-center">2. Informations passagers</h3>
                <div className="space-y-3">
                  {selectedPlaces.length > 0 && (
                    <div className="bg-emerald-50 rounded-lg p-3 text-sm">
                      <p className="font-semibold text-emerald-700 mb-2">Places sélectionnées :</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedPlaces.map(place => (
                          <span key={place} className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            {place}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <input
                    type="tel"
                    placeholder="Votre téléphone"
                    value={telephone}
                    onChange={e => setTelephone(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg text-sm"
                  />
                  {selectedPlaces.map(place => (
                    <input
                      key={place}
                      type="text"
                      placeholder={`Nom du passager - Place ${place}`}
                      value={passagers[place] || ''}
                      onChange={e => setPassagers({ ...passagers, [place]: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg text-sm"
                    />
                  ))}
                  {!editingReservation ? (
                    <button
                      onClick={() => setEditingReservation(true)}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-lg"
                    >
                      Modifier
                    </button>
                  ) : (
                    <button
                      onClick={handleReservation}
                      className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition text-lg"
                    >
                      💾 Enregistrer ({selectedPlaces.length} place{selectedPlaces.length > 1 ? 's' : ''})
                    </button>
                  )}
                  <button
                    onClick={() => setShowReservation(false)}
                    className="w-full text-gray-500 py-2 text-sm hover:underline"
                  >
                    Annuler et retourner aux départs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>Propulsé par <Link href="/" className="text-secondary hover:underline">Dagoo Mobility</Link></p>
        <Link href="/" className="inline-block mt-2 text-white hover:underline text-sm">
          ← Retour à l'accueil
        </Link>
      </footer>
    </div>
  );
}
