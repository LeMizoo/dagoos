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
  const [captchaQuestion, setCaptchaQuestion] = useState({ a: 0, b: 0 });
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [now, setNow] = useState(new Date());
  const [paiementRef, setPaiementRef] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [manageTel, setManageTel] = useState('');
  const [manageNom, setManageNom] = useState('');
  const [manageResult, setManageResult] = useState<any | null>(null);
  const [manageError, setManageError] = useState('');
  const [contactNom, setContactNom] = useState('');
  const [contactTel, setContactTel] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [changingPlace, setChangingPlace] = useState<string | null>(null);
  const [newPlace, setNewPlace] = useState('');

  useEffect(() => {
    loadPage();
    setCaptchaQuestion({ a: Math.floor(Math.random() * 10) + 1, b: Math.floor(Math.random() * 10) + 1 });
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
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

  function getCountdown(dateStr: string, heure: string): string {
    const [h, m] = heure.split(':').map(Number);
    const departTime = new Date(dateStr);
    departTime.setHours(h, m, 0, 0);
    
    const diff = departTime.getTime() - now.getTime();
    if (diff <= 0) return 'Parti';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `dans ${days}j ${hours % 24}h ${minutes}min`;
    }
    return `dans ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}min`;
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

  async function handleContact(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    if (!contactNom.trim() || !contactTel.trim() || !contactMessage.trim()) {
      setError('Tous les champs sont requis');
      return;
    }
    
    try {
      const res = await apiFetch('/public/actions', {
        method: 'POST',
        body: JSON.stringify({
          organizationSlug: params.slug,
          type: 'CONTACT',
          clientNom: contactNom.trim(),
          clientTel: contactTel.trim(),
          details: { message: contactMessage.trim() },
        }),
      });
      
      if (res.ok) {
        setContactSent(true);
        setContactNom('');
        setContactTel('');
        setContactMessage('');
        setTimeout(() => setContactSent(false), 3000);
      } else {
        const err = await res.json();
        setError(err.error || 'Erreur envoi');
      }
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleManage() {
    setManageError('');
    setManageResult(null);
    
    if (!manageTel.trim() || !manageNom.trim()) {
      setManageError('Téléphone et nom requis');
      return;
    }
    
    try {
      const res = await apiFetch('/public/reservations/manage', {
        method: 'POST',
        body: JSON.stringify({
          telephone: manageTel.trim(),
          passagerNom: manageNom.trim(),
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setManageResult(data);
      } else {
        const err = await res.json();
        setManageError(err.error || 'Erreur');
      }
    } catch (e: any) {
      setManageError(e.message);
    }
  }

  async function handleChangePlace(reservationId: string) {
    if (!newPlace.trim()) {
      setManageError('Veuillez saisir la nouvelle place');
      return;
    }
    
    try {
      const res = await apiFetch('/public/reservations/manage', {
        method: 'POST',
        body: JSON.stringify({
          telephone: manageTel.trim(),
          passagerNom: manageNom.trim(),
          action: 'modify',
          reservationId,
          nouvellePlace: newPlace.trim(),
        }),
      });
      
      if (res.ok) {
        setChangingPlace(null);
        setNewPlace('');
        // Recharger les réservations du client
        const manageRes = await apiFetch('/public/reservations/manage', {
          method: 'POST',
          body: JSON.stringify({
            telephone: manageTel.trim(),
            passagerNom: manageNom.trim(),
          }),
        });
        if (manageRes.ok) {
          const data = await manageRes.json();
          setManageResult(data);
        }
        loadPage();
      } else {
        const err = await res.json();
        setManageError(err.error || 'Erreur');
      }
    } catch (e: any) {
      setManageError(e.message);
    }
  }

  async function handleCancelReservation(reservationId: string) {
    try {
      const res = await apiFetch('/public/reservations/manage', {
        method: 'POST',
        body: JSON.stringify({
          telephone: manageTel.trim(),
          passagerNom: manageNom.trim(),
          action: 'cancel',
          reservationId,
        }),
      });
      
      if (res.ok) {
        // Recharger les réservations du client
        const manageRes = await apiFetch('/public/reservations/manage', {
          method: 'POST',
          body: JSON.stringify({
            telephone: manageTel.trim(),
            passagerNom: manageNom.trim(),
          }),
        });
        if (manageRes.ok) {
          const data = await manageRes.json();
          setManageResult(data);
        }
        loadPage();
      }
    } catch (e: any) {
      setManageError(e.message);
    }
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

    if (Number(captchaAnswer) !== captchaQuestion.a + captchaQuestion.b) {
      setError('Captcha incorrect. Veuillez résoudre le calcul.');
      setCaptchaQuestion({ a: Math.floor(Math.random() * 10) + 1, b: Math.floor(Math.random() * 10) + 1 });
      setCaptchaAnswer('');
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
          paiementRef: paiementRef.trim() || null,
          passagers: passagersList,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.otpCode) {
          setOtpCode(data.otpCode);
        }
        setSuccess(`✅ Réservation en attente ! Code OTP : ${data.otpCode || ''}`);
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
                disabled={(() => {
                  const [h, m] = d.heure.split(':').map(Number);
                  const dt = new Date(d.date);
                  dt.setHours(h, m, 0, 0);
                  return dt.getTime() <= Date.now();
                })()}
                className={`text-left bg-white rounded-xl p-5 border-2 transition ${
                  isSelected ? 'border-emerald-500 shadow-lg' : 'border-gray-200 hover:border-emerald-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <h3 className="font-bold text-gray-800 text-lg">
                  {d.destination}
                </h3>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <Calendar size={14} /> {new Date(d.date).toLocaleDateString('fr-FR')}
                  <Clock size={14} /> {d.heure}
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 rounded-full px-2 py-0.5 ml-auto">
                    {getCountdown(d.date, d.heure)}
                  </span>
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

      {/* Gérer ma réservation */}
      <section className="py-8 bg-gray-50 border-t">
        <div className="max-w-md mx-auto px-4">
          <h2 className="text-xl font-bold text-center mb-4">🔍 Gérer ma réservation</h2>
          <div className="space-y-3">
            <input
              type="tel"
              placeholder="Votre téléphone"
              value={manageTel}
              onChange={e => setManageTel(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg text-sm"
            />
            <input
              type="text"
              placeholder="Nom du passager"
              value={manageNom}
              onChange={e => setManageNom(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg text-sm"
            />
            <button
              onClick={handleManage}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Rechercher mes réservations
            </button>
            {manageError && <p className="text-red-500 text-sm text-center">{manageError}</p>}
            {manageResult?.reservations && (
              <div className="space-y-2 mt-4">
                {manageResult.reservations.map((r: any) => (
                  <div key={r.id} className="bg-white rounded-lg p-3 border">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <p className="text-sm font-semibold">{r.depart?.pointDepart} → {r.depart?.destination}</p>
                        <p className="text-xs text-gray-500">Place actuelle : <span className="font-bold text-emerald-600">{r.place}</span></p>
                        <p className="text-xs text-gray-400">{new Date(r.depart?.date).toLocaleDateString('fr-FR')} à {r.depart?.heure}</p>
                      </div>
                      <button
                        onClick={() => handleCancelReservation(r.id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Annuler
                      </button>
                    </div>
                    
                    {changingPlace === r.id ? (
                      <div className="flex gap-2 items-center mt-2">
                        <input
                          type="text"
                          placeholder="Nouvelle place (ex: 2B)"
                          value={newPlace}
                          onChange={e => setNewPlace(e.target.value.toUpperCase())}
                          className="flex-1 px-3 py-2 border rounded text-sm"
                        />
                        <button
                          onClick={() => handleChangePlace(r.id)}
                          className="bg-blue-600 text-white px-3 py-2 rounded text-xs font-semibold hover:bg-blue-700"
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => { setChangingPlace(null); setNewPlace(''); }}
                          className="text-gray-400 hover:underline text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setChangingPlace(r.id); setNewPlace(''); }}
                        className="text-blue-600 hover:underline text-xs mt-2"
                      >
                        🔄 Changer de place
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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
                <div className="mt-4 text-center space-y-1 bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-semibold text-gray-700">
                    Places : <span className="text-emerald-600 font-bold">{selectedDepart.placesTotal}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Disponible(s) : <span className="font-bold text-green-600">{selectedDepart.placesTotal - (selectedDepart.reservations || []).length}</span>
                    {' · '}
                    Réservée(s) : <span className="font-bold text-red-600">{(selectedDepart.reservations || []).length}</span>
                  </p>
                </div>
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
                  <input
                    type="text"
                    placeholder="Réf du transfert Mobile Money (optionnel)"
                    value={paiementRef}
                    onChange={e => setPaiementRef(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg text-sm"
                  />
                  
                  {/* Numéros Mobile Money */}
                  <div className="space-y-2 mt-2">
                    <p className="text-xs font-semibold text-gray-500">💰 Payez par Mobile Money :</p>
                    <div className="flex items-center gap-2 bg-yellow-400 rounded-lg px-3 py-2">
                      <span className="font-bold text-black text-sm">MVola</span>
                      <span className="text-black font-extrabold text-sm tracking-wider">{cooperative?.mvolaNumber || '034 00 000 00'}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-black rounded-lg px-3 py-2">
                      <span className="font-bold text-orange-500 text-sm">Orange Money</span>
                      <span className="text-orange-400 font-extrabold text-sm tracking-wider">{cooperative?.orangeNumber || '032 00 000 00'}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-red-600 rounded-lg px-3 py-2">
                      <span className="font-bold text-white text-sm">Airtel Money</span>
                      <span className="text-white font-extrabold text-sm tracking-wider">{cooperative?.airtelNumber || '033 00 000 00'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold whitespace-nowrap">{captchaQuestion.a} + {captchaQuestion.b} = ?</span>
                    <input
                      type="number"
                      placeholder="?"
                      value={captchaAnswer}
                      onChange={e => setCaptchaAnswer(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
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
                      ✅ Valider ma sélection
                    </button>
                  ) : (
                    <button
                      onClick={handleReservation}
                      className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition text-lg"
                    >
                      💾 Enregistrer la réservation ({selectedPlaces.length} place{selectedPlaces.length > 1 ? 's' : ''})
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

      {/* Demande de livraison */}
      <section className="py-8 bg-gray-50 border-t">
        <div className="max-w-md mx-auto px-4">
          <h2 className="text-xl font-bold text-center mb-4">📦 Demande de livraison</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const res = await apiFetch('/public/actions', {
              method: 'POST',
              body: JSON.stringify({
                organizationSlug: params.slug,
                type: 'DELIVERY_REQUEST',
                clientNom: (e.target as any).nom.value,
                clientTel: (e.target as any).tel.value,
                details: {
                  depart: (e.target as any).depart.value,
                  arrivee: (e.target as any).arrivee.value,
                  description: (e.target as any).desc.value,
                },
              }),
            });
            if (res.ok) {
              setError('');
              (e.target as any).reset();
              alert('✅ Demande envoyée !');
            }
          }} className="space-y-3">
            <input name="nom" placeholder="Votre nom" className="w-full px-4 py-3 border rounded-lg text-sm" required />
            <input name="tel" type="tel" placeholder="Votre téléphone" className="w-full px-4 py-3 border rounded-lg text-sm" required />
            <input name="depart" placeholder="Adresse de ramassage" className="w-full px-4 py-3 border rounded-lg text-sm" required />
            <input name="arrivee" placeholder="Adresse de livraison" className="w-full px-4 py-3 border rounded-lg text-sm" required />
            <textarea name="desc" placeholder="Description du colis" rows={2} className="w-full px-4 py-3 border rounded-lg text-sm" />
            <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition">
              Envoyer la demande
            </button>
          </form>
        </div>
      </section>

      {/* Contact */}
      <section className="py-8 bg-white border-t">
        <div className="max-w-md mx-auto px-4">
          <h2 className="text-xl font-bold text-center mb-4">💬 Contactez-nous</h2>
          {contactSent && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-3 text-center">✅ Message envoyé !</div>}
          <form onSubmit={handleContact} className="space-y-3">
            <input type="text" placeholder="Votre nom" value={contactNom} onChange={e => setContactNom(e.target.value)} className="w-full px-4 py-3 border rounded-lg text-sm" />
            <input type="tel" placeholder="Votre téléphone" value={contactTel} onChange={e => setContactTel(e.target.value)} className="w-full px-4 py-3 border rounded-lg text-sm" />
            <textarea placeholder="Votre message" value={contactMessage} onChange={e => setContactMessage(e.target.value)} rows={3} className="w-full px-4 py-3 border rounded-lg text-sm" />
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
              Envoyer le message
            </button>
          </form>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>Propulsé par <Link href="/" className="text-secondary hover:underline">Dagoo Mobility</Link></p>
        <Link href="/" className="inline-block mt-2 text-white hover:underline text-sm">
          ← Retour à l'accueil
        </Link>
      </footer>
    </div>
  );
}
