'use client';

import { useState, useEffect, useCallback } from 'react';
import { Building2, Phone, Mail, Users, Car, Calendar, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import PlanVehicule from '@/components/coop/PlanVehicule';

export default function CooperativeLandingPage({
  params,
}: {
  params: { slug: string };
}) {
  const [cooperative, setCooperative] = useState<any | null>(null);
  const [departs, setDeparts] = useState<any[]>([]);
  const [selectedDepart, setSelectedDepart] = useState<any | null>(null);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [passagers, setPassagers] = useState<Record<string, string>>({});
  const [telephone, setTelephone] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      if (departsRes.ok) setDeparts(await departsRes.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handlePlaceClick(place: string) {
    setSelectedPlaces(prev => {
      if (prev.includes(place)) {
        const newPlaces = prev.filter(p => p !== place);
        const newPassagers = { ...passagers };
        delete newPassagers[place];
        setPassagers(newPassagers);
        return newPlaces;
      } else {
        return [...prev, place];
      }
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

    // Vérifier que chaque place a un nom de passager
    const passagersList = selectedPlaces.map(place => ({
      passagerNom: passagers[place]?.trim() || '',
      place,
    }));

    const missing = passagersList.filter(p => !p.passagerNom);
    if (missing.length > 0) {
      setError(`Veuillez saisir le nom du passager pour la place ${missing[0].place}`);
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
        loadPage();
      } else {
        const err = await res.json();
        setError(err.error || 'Erreur de réservation');
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (!cooperative) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Coopérative introuvable</h1>
          <Link href="/" className="text-primary hover:underline">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-2">{cooperative.name}</h1>
          <p className="text-emerald-100">Réservez votre place en ligne</p>
          {cooperative.phone && (
            <p className="text-emerald-100/80 mt-2 flex items-center justify-center gap-2">
              <Phone size={16} /> {cooperative.phone}
            </p>
          )}
        </div>
      </header>

      {/* Départs disponibles */}
      <section className="py-12 max-w-5xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">🚌 Départs disponibles</h2>

        {departs.length === 0 ? (
          <p className="text-center text-gray-500">Aucun départ programmé pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {departs.map((d: any) => {
              const placesReservees = (d.reservations || []).map((r: any) => r.place);
              const placesDisponibles = d.placesTotal - placesReservees.length;
              const isSelected = selectedDepart?.id === d.id;

              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setSelectedDepart(d);
                    setSelectedPlaces([]);
                    setPassagers({});
                  }}
                  className={`text-left bg-white rounded-xl p-5 border-2 transition ${
                    isSelected ? 'border-emerald-500 shadow-lg' : 'border-gray-200 hover:border-emerald-300'
                  }`}
                >
                  <h3 className="font-bold text-gray-800">
                    <MapPin size={14} className="inline mr-1" />
                    {d.pointDepart} → {d.destination}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2">
                    <Calendar size={12} className="inline mr-1" />
                    {new Date(d.date).toLocaleDateString('fr-FR')}
                    <Clock size={12} className="inline ml-2 mr-1" />
                    {d.heure}
                  </p>
                  <p className="text-sm font-bold text-emerald-600 mt-2">
                    {Number(d.prix).toLocaleString()} Ar
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {placesDisponibles} places disponibles
                  </p>
                  {d.vehicle && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Car size={12} /> {d.vehicle.plate} - {d.vehicle.model}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Formulaire de réservation */}
        {selectedDepart && (
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Réserver : {selectedDepart.pointDepart} → {selectedDepart.destination}
            </h3>

            {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4">{success}</div>}
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Plan du véhicule */}
              <div>
                <h4 className="font-semibold mb-2">Choisissez vos places</h4>
                <PlanVehicule
                  placesTotal={selectedDepart.placesTotal}
                  placesReservees={(selectedDepart.reservations || []).map((r: any) => r.place)}
                  placesSelectionnees={selectedPlaces}
                  onPlaceClick={handlePlaceClick}
                />
              </div>

              {/* Formulaire passagers */}
              <div>
                <h4 className="font-semibold mb-2">Informations</h4>
                <div className="space-y-3">
                  <input
                    type="tel"
                    placeholder="Votre téléphone"
                    value={telephone}
                    onChange={e => setTelephone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  {selectedPlaces.map(place => (
                    <input
                      key={place}
                      type="text"
                      placeholder={`Nom du passager - Place ${place}`}
                      value={passagers[place] || ''}
                      onChange={e => setPassagers({ ...passagers, [place]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  ))}
                  <button
                    onClick={handleReservation}
                    className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
                  >
                    Confirmer la réservation ({selectedPlaces.length} place{selectedPlaces.length > 1 ? 's' : ''})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>Propulsé par <Link href="/" className="text-secondary hover:underline">Dagoo Mobility</Link></p>
        <p className="mt-1">Chez les potes, ça roule.</p>
      </footer>
    </div>
  );
}
