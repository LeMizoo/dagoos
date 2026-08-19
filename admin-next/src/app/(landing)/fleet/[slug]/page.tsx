'use client';

import { useState, useEffect } from 'react';
import { Truck, Phone, Mail, MapPin, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function FleetLandingPage({ params }: { params: { slug: string } }) {
  const [fleet, setFleet] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFleet();
  }, [params.slug]);

  async function loadFleet() {
    try {
      const res = await apiFetch(`/public/organizations/${params.slug}`);
      if (res.ok) setFleet(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitAction(type: string, e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as any;
    const res = await apiFetch('/public/actions', {
      method: 'POST',
      body: JSON.stringify({
        organizationSlug: params.slug,
        type,
        clientNom: form.nom.value,
        clientTel: form.tel.value,
        details: Object.fromEntries(new FormData(form)),
      }),
    });
    if (res.ok) {
      form.reset();
      alert('✅ Demande envoyée !');
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Chargement...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <Link href="/" className="absolute top-4 left-4 text-white/80 hover:text-white text-sm">← Retour</Link>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-2">{fleet?.name || 'Flotte'}</h1>
          <p className="text-blue-100">Réservez votre course en ligne</p>
          {fleet?.phone && <p className="text-blue-100/80 mt-2 flex items-center justify-center gap-2"><Phone size={16} /> {fleet.phone}</p>}
        </div>
      </header>

      {/* Demande de course */}
      <section className="py-8 max-w-md mx-auto px-4">
        <h2 className="text-xl font-bold text-center mb-4">🚗 Demande de course</h2>
        <form onSubmit={(e) => submitAction('COURSE_REQUEST', e)} className="space-y-3 bg-white p-6 rounded-xl shadow-sm border">
          <input name="nom" placeholder="Votre nom" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <input name="tel" type="tel" placeholder="Votre téléphone" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <input name="depart" placeholder="Adresse de départ" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <input name="arrivee" placeholder="Adresse d'arrivée" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <select name="typeVehicule" className="w-full px-4 py-3 border rounded-lg text-sm">
            <option value="moto">Taxi Moto</option>
            <option value="voiture">Taxi</option>
          </select>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            Envoyer la demande
          </button>
        </form>
      </section>

      {/* Réservation taxi */}
      <section className="py-8 max-w-md mx-auto px-4">
        <h2 className="text-xl font-bold text-center mb-4">📅 Réservation taxi</h2>
        <form onSubmit={(e) => submitAction('TAXI_RESERVATION', e)} className="space-y-3 bg-white p-6 rounded-xl shadow-sm border">
          <input name="nom" placeholder="Votre nom" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <input name="tel" type="tel" placeholder="Votre téléphone" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <input name="date" type="date" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <input name="heure" type="time" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <input name="priseEnCharge" placeholder="Adresse de prise en charge" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <input name="destination" placeholder="Destination" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            Réserver
          </button>
        </form>
      </section>

      {/* Contact */}
      <section className="py-8 max-w-md mx-auto px-4">
        <h2 className="text-xl font-bold text-center mb-4">💬 Contact</h2>
        <form onSubmit={(e) => submitAction('CONTACT', e)} className="space-y-3 bg-white p-6 rounded-xl shadow-sm border">
          <input name="nom" placeholder="Votre nom" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <input name="tel" type="tel" placeholder="Votre téléphone" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <textarea name="message" placeholder="Votre message" rows={3} className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            Envoyer
          </button>
        </form>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <Link href="/" className="text-white hover:underline">← Retour à l'accueil</Link>
      </footer>
    </div>
  );
}
