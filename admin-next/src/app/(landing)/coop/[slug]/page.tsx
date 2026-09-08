'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Phone, Users, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import PlanVehicule from '@/components/flotte/PlanVehicule';


interface LandingService {
  icon?: string;
  title?: string;
  desc?: string;
}

interface LandingConfig {
  hero?: {
    title?: string;
    subtitle?: string;
  };
  about?: {
    text?: string;
  };
  services?: LandingService[];
}

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


  const landingConfig: LandingConfig =
    cooperative?.landingConfig &&
    typeof cooperative.landingConfig === 'object' &&
    !Array.isArray(cooperative.landingConfig)
      ? cooperative.landingConfig
      : {};

  const primaryColor =
    cooperative?.primaryColor || '#059669';

  const secondaryColor =
    cooperative?.secondaryColor || '#047857';

  const heroTitle =
    landingConfig.hero?.title ||
    cooperative?.name ||
    'Votre voyage commence ici';

  const heroSubtitle =
    landingConfig.hero?.subtitle ||
    cooperative?.slogan ||
    cooperative?.description ||
    'Réservez votre place simplement et voyagez en toute sérénité.';

  const aboutText =
    landingConfig.about?.text ||
    cooperative?.description ||
    'Une solution de transport interurbain pensée pour simplifier vos déplacements.';

  const landingServices: LandingService[] =
    Array.isArray(landingConfig.services) &&
    landingConfig.services.length > 0
      ? landingConfig.services
      : [
          {
            icon: '🚌',
            title: 'Transport interurbain',
            desc: 'Voyagez entre les principales destinations.',
          },
          {
            icon: '💺',
            title: 'Réservation de places',
            desc: 'Choisissez votre place avant le départ.',
          },
          {
            icon: '📦',
            title: 'Transport de colis',
            desc: 'Envoyez vos marchandises simplement.',
          },
        ];

  const whatsappUrl = cooperative?.whatsapp
    ? `https://wa.me/${String(cooperative.whatsapp).replace(/\D/g, '')}`
    : null;

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
          otpCode: otpCode.trim(),
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
          otpCode: otpCode.trim(),
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
          otpCode: otpCode.trim(),
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
          otpCode: otpCode.trim(),
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
          otpCode: otpCode.trim(),
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
      <header className="relative isolate overflow-hidden bg-slate-950 text-white">
        {cooperative?.coverImage ? (
          <>
            <img
              src={cooperative.coverImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/70" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-slate-950/30" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            }}
          />
        )}

        <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium backdrop-blur-md transition hover:bg-white/20"
            >
              ← Dagoo Mobility
            </Link>

            {cooperative?.phone && (
              <a
                href={`tel:${cooperative.phone}`}
                className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold backdrop-blur-md sm:inline-flex"
              >
                <Phone size={14} />
                {cooperative.phone}
              </a>
            )}
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 sm:pb-28 lg:px-8 lg:pt-24">
          <div className="max-w-3xl">
            {cooperative?.logo ? (
              <div className="mb-7 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-2xl">
                <img
                  src={cooperative.logo}
                  alt={cooperative.name || 'Logo'}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div
                className="mb-7 flex h-20 w-20 items-center justify-center rounded-2xl text-3xl shadow-2xl"
                style={{ backgroundColor: primaryColor }}
              >
                🚌
              </div>
            )}

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] backdrop-blur-md">
              ✦ Coop Premium
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              {heroTitle}
            </h1>

            {cooperative?.slogan && cooperative.slogan !== heroTitle && (
              <p className="mt-4 text-lg font-medium text-white/90 sm:text-2xl">
                {cooperative.slogan}
              </p>
            )}

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
              {heroSubtitle}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#departs"
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold text-white shadow-xl transition hover:-translate-y-0.5"
                style={{ backgroundColor: primaryColor }}
              >
                Voir les départs
                <span>→</span>
              </a>

              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm font-bold backdrop-blur-md transition hover:bg-white/20"
              >
                Nous contacter
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-50 to-transparent" />
      </header>

      {/* SERVICES PREMIUM */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: primaryColor }}
          >
            Nos services
          </span>

          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
            Voyager simplement
          </h2>

          <p className="mt-4 text-slate-500">
            Découvrez les services proposés par {cooperative?.name || 'notre coopérative'}.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {landingServices.map((service, index) => (
            <article
              key={`${service.title || 'service'}-${index}`}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                {service.icon || '✓'}
              </div>

              <h3 className="mt-5 text-lg font-bold">
                {service.title || 'Service'}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {service.desc || ''}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ABOUT PREMIUM */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-20">
          <div>
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: primaryColor }}
            >
              À propos
            </span>

            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Une coopérative proche de ses voyageurs
            </h2>

            <p className="mt-5 whitespace-pre-line text-base leading-8 text-slate-600">
              {aboutText}
            </p>
          </div>

          <div
            className="relative overflow-hidden rounded-[2rem] p-8 text-white"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            }}
          >
            {cooperative?.coverImage && (
              <img
                src={cooperative.coverImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-20"
              />
            )}

            <div className="relative">
              <div className="text-5xl">🚌</div>

              <h3 className="mt-6 text-2xl font-black">
                {cooperative?.name || 'Votre coopérative'}
              </h3>

              <p className="mt-3 text-white/75">
                {cooperative?.slogan ||
                  'Votre partenaire pour vos déplacements interurbains.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filtres villes */}
      <section id="departs" className="py-8 max-w-5xl mx-auto px-4">
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

        {/* Liste des départs Premium */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {departsFiltres.map((d: any) => {
            const placesReservees = (d.reservations || []).map((r: any) => r.place);
            const placesDisponibles = d.placesTotal - placesReservees.length;
            const isSelected = selectedDepart?.id === d.id;
            const departTime = (() => {
              const [h, m] = (d.heure || '00:00').split(':').map(Number);
              const dt = new Date(d.date);
              dt.setHours(h, m, 0, 0);
              return dt;
            })();
            const estParti = departTime.getTime() <= Date.now();

            return (
              <button
                key={d.id}
                onClick={() => handleSelectDepart(d)}
                disabled={estParti}
                className={`group relative text-left rounded-[1.5rem] border p-6 transition-all duration-300 ${
                  isSelected
                    ? 'border-emerald-500 shadow-2xl sm:scale-[1.02] bg-white'
                    : 'border-slate-200 bg-white hover:border-emerald-400 hover:shadow-xl hover:-translate-y-1'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSelected && (
                  <span className="absolute top-4 right-4 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                    Sélectionné
                  </span>
                )}

                {/* Destination et point de départ */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">
                      {d.destination}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin size={14} className="text-emerald-600" />
                      {d.pointDepart}
                    </p>
                  </div>

                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    🚌
                  </div>
                </div>

                {/* Véhicule */}
                {d.vehicle && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                    <span className="text-sm font-semibold text-slate-700">
                      {d.vehicle.model || 'Véhicule'}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-xs text-slate-500">
                      {d.vehicle.plate}
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      ✓ Récent
                    </span>
                  </div>
                )}

                {/* Date + heure */}
                <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-4">
                  <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                    <Calendar size={15} className="text-emerald-600" />
                    {new Date(d.date).toLocaleDateString('fr-FR')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                    <Clock size={15} className="text-emerald-600" />
                    {d.heure}
                  </span>
                  <span
                    className={`ml-auto rounded-full px-3 py-1 text-[11px] font-bold ${
                      estParti
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {estParti ? 'Parti' : getCountdown(d.date, d.heure)}
                  </span>
                </div>

                {/* Prix + places */}
                <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Tarif
                    </p>
                    <p
                      className="text-2xl font-black"
                      style={{ color: primaryColor }}
                    >
                      {Number(d.prix).toLocaleString()} Ar
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-sm font-bold ${
                        placesDisponibles > 5
                          ? 'text-emerald-600'
                          : 'text-red-600'
                      }`}
                    >
                      {placesDisponibles} places
                    </p>
                    <p className="text-[10px] text-slate-400">
                      sur {d.placesTotal}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div
                  className="mt-4 rounded-xl px-4 py-3 text-center text-sm font-bold text-white transition"
                  style={{ backgroundColor: isSelected ? '#059669' : primaryColor }}
                >
                  {isSelected ? '✓ Sélectionné' : 'Choisir ce départ →'}
                </div>
              </button>
            );
          })}

          {departsFiltres.length === 0 && (
            <div className="col-span-full rounded-[1.5rem] border border-dashed border-slate-300 bg-white py-16 text-center">
              <div className="text-5xl">🗓️</div>
              <h3 className="mt-4 text-lg font-bold text-slate-700">
                Aucun départ pour cette ville
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Revenez bientôt ou contactez-nous pour plus d'informations.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Gérer ma réservation Premium */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
          <div className="p-6 sm:p-8">
            <div className="text-center">
              <span
                className="text-xs font-bold uppercase tracking-[0.2em]"
                style={{ color: primaryColor }}
              >
                Déjà réservé ?
              </span>

              <h2 className="mt-3 text-3xl font-black text-slate-900">
                Gérer ma réservation
              </h2>

              <p className="mt-3 text-sm text-slate-500">
                Retrouvez votre réservation avec votre téléphone et votre code OTP.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <input
                type="tel"
                placeholder="Téléphone"
                value={manageTel}
                onChange={e => setManageTel(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-[var(--primary)] focus:bg-white"
              />

              <input
                type="text"
                placeholder="Nom du passager"
                value={manageNom}
                onChange={e => setManageNom(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-[var(--primary)] focus:bg-white"
              />

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Code OTP"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-mono tracking-widest outline-none transition focus:border-[var(--primary)] focus:bg-white"
              />
            </div>

            <button
              onClick={handleManage}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-bold text-white transition hover:opacity-95"
              style={{ backgroundColor: primaryColor }}
            >
              🔍 Rechercher mes réservations
            </button>

            {manageError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {manageError}
              </div>
            )}

            {manageResult?.reservations && (
              <div className="mt-6 space-y-4">
                {manageResult.reservations.map((r: any) => (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:shadow-lg"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-bold text-slate-900">
                          {r.depart?.pointDepart} → {r.depart?.destination}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          📅 {new Date(r.depart?.date).toLocaleDateString('fr-FR')} à {r.depart?.heure}
                        </p>
                        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                          💺 Place : {r.place}
                        </p>
                      </div>

                      <button
                        onClick={() => handleCancelReservation(r.id)}
                        className="rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
                      >
                        Annuler
                      </button>
                    </div>

                    {changingPlace === r.id ? (
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <input
                          type="text"
                          placeholder="Nouvelle place (ex: 2B)"
                          value={newPlace}
                          onChange={e => setNewPlace(e.target.value.toUpperCase())}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                        />
                        <button
                          onClick={() => handleChangePlace(r.id)}
                          className="rounded-xl px-5 py-3 text-xs font-bold text-white"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Valider
                        </button>
                        <button
                          onClick={() => { setChangingPlace(null); setNewPlace(''); }}
                          className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-500"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setChangingPlace(r.id); setNewPlace(''); }}
                        className="mt-3 text-xs font-bold"
                        style={{ color: primaryColor }}
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

      {/* Formulaire de réservation Premium */}
      {showReservation && selectedDepart && (
        <section id="reservation-form" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
            <div className="p-6 sm:p-10">
              <div className="text-center">
                <span
                  className="text-xs font-bold uppercase tracking-[0.2em]"
                  style={{ color: primaryColor }}
                >
                  Réservation
                </span>

                <h2 className="mt-3 text-3xl font-black text-slate-900">
                  {selectedDepart.destination} • {selectedDepart.heure}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {selectedDepart.pointDepart} → {selectedDepart.destination} • {new Date(selectedDepart.date).toLocaleDateString('fr-FR')}
                </p>
              </div>

              {success && (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-semibold text-emerald-700">
                  {success}
                </div>
              )}
              {error && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-8 grid gap-8 lg:grid-cols-2">
                {/* Plan véhicule */}
                <div>
                  <h3 className="mb-4 text-center text-lg font-bold text-slate-900">
                    1. Choisissez vos places
                  </h3>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <PlanVehicule
                      placesTotal={selectedDepart.placesTotal}
                      placesReservees={(selectedDepart.reservations || []).map((r: any) => r.place)}
                      placesSelectionnees={selectedPlaces}
                      onPlaceClick={handlePlaceClick}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-semibold sm:gap-6">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded bg-green-500"></span>
                      Disponible
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded bg-red-500"></span>
                      Réservé
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded bg-blue-500"></span>
                      Sélectionné
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center">
                    <p className="text-sm font-bold text-slate-700">
                      {selectedDepart.placesTotal} places au total
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      <span className="font-bold text-green-600">{selectedDepart.placesTotal - (selectedDepart.reservations || []).length} disponible(s)</span>
                      {' · '}
                      <span className="font-bold text-red-600">{(selectedDepart.reservations || []).length} réservée(s)</span>
                      {' · '}
                      <span className="font-bold text-blue-600">{selectedPlaces.length} sélectionnée(s)</span>
                    </p>
                  </div>
                </div>

                {/* Formulaire passagers */}
                <div>
                  <h3 className="mb-4 text-center text-lg font-bold text-slate-900">
                    2. Informations passagers
                  </h3>

                  <div className="space-y-4">
                    {selectedPlaces.length > 0 && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-sm font-bold text-emerald-700">
                          Places sélectionnées :
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedPlaces.map(place => (
                            <span
                              key={place}
                              className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white"
                            >
                              {place}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedPlaces.map(place => (
                      <input
                        key={place}
                        type="text"
                        placeholder={`Nom du passager - Place ${place}`}
                        value={passagers[place] || ''}
                        onChange={e => setPassagers({ ...passagers, [place]: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-[var(--primary)] focus:bg-white"
                      />
                    ))}

                    <input
                      type="tel"
                      placeholder="Votre téléphone"
                      value={telephone}
                      onChange={e => setTelephone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-[var(--primary)] focus:bg-white"
                    />

                    <input
                      type="text"
                      placeholder="Réf du transfert Mobile Money (optionnel)"
                      value={paiementRef}
                      onChange={e => setPaiementRef(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-[var(--primary)] focus:bg-white"
                    />

                    {/* Mobile Money Premium */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        💰 Payez par Mobile Money
                      </p>

                      <div className="mt-3 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-yellow-400 px-4 py-3">
                          <span className="text-sm font-bold text-black">MVola</span>
                          <span className="font-mono text-sm font-extrabold text-black">
                            {cooperative?.mvolaNumber || '034 00 000 00'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black px-4 py-3">
                          <span className="text-sm font-bold text-orange-500">Orange Money</span>
                          <span className="font-mono text-sm font-extrabold text-orange-400">
                            {cooperative?.orangeNumber || '032 00 000 00'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-red-600 px-4 py-3">
                          <span className="text-sm font-bold text-white">Airtel Money</span>
                          <span className="font-mono text-sm font-extrabold text-white">
                            {cooperative?.airtelNumber || '033 00 000 00'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Captcha */}
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <span className="text-sm font-bold whitespace-nowrap text-slate-700">
                        {captchaQuestion.a} + {captchaQuestion.b} = ?
                      </span>
                      <input
                        type="number"
                        placeholder="?"
                        value={captchaAnswer}
                        onChange={e => setCaptchaAnswer(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-sm outline-none"
                      />
                    </div>

                    {!editingReservation ? (
                      <button
                        onClick={() => setEditingReservation(true)}
                        className="w-full rounded-xl px-5 py-4 text-sm font-bold text-white transition"
                        style={{ backgroundColor: primaryColor }}
                      >
                        ✅ Valider ma sélection
                      </button>
                    ) : (
                      <button
                        onClick={handleReservation}
                        className="w-full rounded-xl bg-emerald-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-emerald-700"
                      >
                        💾 Enregistrer la réservation ({selectedPlaces.length} place{selectedPlaces.length > 1 ? 's' : ''})
                      </button>
                    )}

                    <button
                      onClick={() => setShowReservation(false)}
                      className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
                    >
                      Annuler et retourner aux départs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================
          LIVRAISON + CONTACT — PREMIUM
          ====================================================== */}
      <section className="border-t border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">

          <div className="mb-10 text-center">
            <span
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: primaryColor }}
            >
              Services complémentaires
            </span>

            <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
              Plus qu&apos;un voyage
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Besoin d&apos;envoyer un colis ou de nous contacter ?
              Notre équipe est à votre écoute.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">

            {/* ==================================================
                LIVRAISON PREMIUM
                ================================================== */}
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">

              <div
                className="p-6 text-white sm:p-8"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                  <div className="min-w-0">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur">
                      📦
                    </span>

                    <h3 className="mt-5 text-2xl font-black">
                      Envoyer un colis
                    </h3>

                    <p className="mt-2 max-w-md text-sm leading-6 text-white/75">
                      Confiez-nous vos colis et marchandises pour un transport
                      simple et pratique.
                    </p>
                  </div>

                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold backdrop-blur transition hover:bg-white/20"
                    >
                      WhatsApp
                    </a>
                  )}

                </div>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();

                  const form = e.currentTarget;
                  const data = new FormData(form);

                  try {
                    const res = await apiFetch('/public/actions', {
                      method: 'POST',
                      body: JSON.stringify({
                        organizationSlug: params.slug,
                        type: 'DELIVERY_REQUEST',
                        clientNom: String(data.get('nom') || ''),
                        clientTel: String(data.get('tel') || ''),
                        details: {
                          depart: String(data.get('depart') || ''),
                          arrivee: String(data.get('arrivee') || ''),
                          description: String(data.get('desc') || ''),
                        },
                      }),
                    });

                    if (res.ok) {
                      setError('');
                      form.reset();
                      setSuccess('Votre demande de livraison a bien été envoyée.');
                      setTimeout(() => setSuccess(''), 4000);
                    } else {
                      const err = await res.json().catch(() => ({}));
                      setError(
                        err.error || 'Impossible d’envoyer la demande.'
                      );
                    }
                  } catch (e: any) {
                    setError(e.message || 'Une erreur est survenue.');
                  }
                }}
                className="space-y-4 p-6 sm:p-8"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    name="nom"
                    placeholder="Votre nom"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                    required
                  />

                  <input
                    name="tel"
                    type="tel"
                    placeholder="Votre téléphone"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                    required
                  />
                </div>

                <input
                  name="depart"
                  placeholder="Adresse de ramassage"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  required
                />

                <input
                  name="arrivee"
                  placeholder="Adresse de livraison"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                  required
                />

                <textarea
                  name="desc"
                  placeholder="Description du colis"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />

                <button
                  type="submit"
                  className="w-full rounded-xl px-5 py-4 text-sm font-bold text-white transition hover:opacity-95"
                  style={{ backgroundColor: primaryColor }}
                >
                  📦 Envoyer ma demande
                </button>

              </form>
            </div>

            {/* ==================================================
                CONTACT PREMIUM
                ================================================== */}
            <div
              id="contact"
              className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl"
            >
              <div className="p-6 sm:p-8">

                <span
                  className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  💬
                </span>

                <h3 className="mt-5 text-2xl font-black text-slate-900">
                  Contactez-nous
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Une question sur un départ, une réservation ou un service ?
                  Notre équipe vous répond.
                </p>

                <div className="mt-7 space-y-3">

                  {cooperative?.phone && (
                    <a
                      href={`tel:${cooperative.phone}`}
                      className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 p-3 transition hover:bg-slate-100"
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        <Phone size={17} style={{ color: primaryColor }} />
                      </span>

                      <span className="min-w-0 break-words text-sm font-semibold text-slate-700">
                        {cooperative.phone}
                      </span>
                    </a>
                  )}

                  {cooperative?.email && (
                    <a
                      href={`mailto:${cooperative.email}`}
                      className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 p-3 transition hover:bg-slate-100"
                    >
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        ✉️
                      </span>

                      <span className="min-w-0 break-words text-sm font-semibold text-slate-700">
                        {cooperative.email}
                      </span>
                    </a>
                  )}

                  {cooperative?.address && (
                    <div className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 p-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${primaryColor}15` }}
                      >
                        <MapPin size={17} style={{ color: primaryColor }} />
                      </span>

                      <span className="min-w-0 break-words text-sm font-semibold text-slate-700">
                        {cooperative.address}
                      </span>
                    </div>
                  )}

                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-white transition hover:opacity-95"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <span className="text-lg">💬</span>
                      <span>Nous écrire sur WhatsApp</span>
                    </a>
                  )}

                </div>

                <div className="my-7 border-t border-slate-100" />

                <form
                  onSubmit={handleContact}
                  className="space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">

                    <input
                      type="text"
                      placeholder="Votre nom"
                      value={contactNom}
                      onChange={e => setContactNom(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                      required
                    />

                    <input
                      type="tel"
                      placeholder="Votre téléphone"
                      value={contactTel}
                      onChange={e => setContactTel(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                      required
                    />

                  </div>

                  <textarea
                    placeholder="Votre message"
                    value={contactMessage}
                    onChange={e => setContactMessage(e.target.value)}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                    required
                  />

                  {contactSent && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-700">
                      ✅ Message envoyé avec succès.
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full rounded-xl px-5 py-4 text-sm font-bold text-white transition hover:opacity-95"
                    style={{ backgroundColor: primaryColor }}
                  >
                    💬 Envoyer le message
                  </button>

                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ======================================================
          FOOTER PREMIUM
          ====================================================== */}
      <footer className="bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">

          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">

            {/* Branding */}
            <div>
              <div className="flex items-center gap-3">

                {cooperative?.logo ? (
                  <img
                    src={cooperative.logo}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-2xl bg-white object-contain p-1"
                  />
                ) : (
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl"
                    style={{ backgroundColor: primaryColor }}
                  >
                    🚌
                  </div>
                )}

                <div className="min-w-0">
                  <p className="break-words text-lg font-black">
                    {cooperative?.name || 'Coopérative'}
                  </p>

                  <p className="text-xs text-white/50">
                    Propulsé par Dagoo Mobility
                  </p>
                </div>

              </div>

              {(cooperative?.slogan || cooperative?.description) && (
                <p className="mt-5 max-w-md text-sm leading-6 text-white/55">
                  {cooperative?.slogan || cooperative?.description}
                </p>
              )}
            </div>

            {/* Contact */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                Contact
              </p>

              <div className="mt-5 space-y-3 text-sm">

                {cooperative?.phone && (
                  <a
                    href={`tel:${cooperative.phone}`}
                    className="block break-words text-white/70 transition hover:text-white"
                  >
                    ☎ {cooperative.phone}
                  </a>
                )}

                {cooperative?.email && (
                  <a
                    href={`mailto:${cooperative.email}`}
                    className="block break-words text-white/70 transition hover:text-white"
                  >
                    ✉ {cooperative.email}
                  </a>
                )}

                {cooperative?.address && (
                  <p className="break-words text-white/70">
                    📍 {cooperative.address}
                  </p>
                )}

              </div>
            </div>

            {/* Navigation */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                Navigation
              </p>

              <div className="mt-5 space-y-3 text-sm">

                <a
                  href="#departs"
                  className="block text-white/70 transition hover:text-white"
                >
                  Voir les départs
                </a>

                <a
                  href="#contact"
                  className="block text-white/70 transition hover:text-white"
                >
                  Nous contacter
                </a>

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block font-semibold transition hover:opacity-80"
                    style={{ color: primaryColor }}
                  >
                    WhatsApp
                  </a>
                )}

              </div>
            </div>

          </div>

          <div className="mt-10 border-t border-white/10 pt-6">

            <div className="flex flex-col gap-4 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">

              <p>
                © {new Date().getFullYear()} {cooperative?.name || 'Coopérative'}.
                Tous droits réservés.
              </p>

              <Link
                href="/"
                className="transition hover:text-white"
              >
                ← Retour à Dagoo Mobility
              </Link>

            </div>

          </div>

        </div>
      </footer>

    </div>
  );
}
