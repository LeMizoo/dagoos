'use client';

import { apiFetch } from '@/lib/api';

export default function DemandeTaxi() {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      const res = await apiFetch('/public/actions', {
        method: 'POST',
        body: JSON.stringify({
          organizationSlug: 'flotte-alasora',
          type: 'COURSE_REQUEST',
          clientNom: formData.get('nom') as string,
          clientTel: formData.get('tel') as string,
          details: {
            depart: formData.get('depart') as string,
            arrivee: formData.get('arrivee') as string,
            typeVehicule: formData.get('type') as string,
          },
        }),
      });
      
      if (res.ok) {
        form.reset();
        alert('✅ Demande envoyée ! Une flotte vous contactera.');
      } else {
        alert('❌ Erreur lors de l\'envoi');
      }
    } catch (error) {
      alert('❌ Erreur réseau');
    }
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-md mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-4">🚕 Demander un taxi</h2>
        <p className="text-center text-gray-500 text-sm mb-6">Remplissez le formulaire, une flotte vous contactera</p>
        <form onSubmit={handleSubmit} className="space-y-3 bg-gray-50 p-6 rounded-xl border">
          <input name="nom" placeholder="Votre nom" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <input name="tel" type="tel" placeholder="Votre téléphone" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <input name="depart" placeholder="Adresse de départ" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <input name="arrivee" placeholder="Adresse d'arrivée" className="w-full px-4 py-3 border rounded-lg text-sm" required />
          <select name="type" className="w-full px-4 py-3 border rounded-lg text-sm">
            <option value="moto">🏍️ Taxi Moto</option>
            <option value="voiture">🚗 Taxi</option>
          </select>
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            Demander un taxi
          </button>
        </form>
      </div>
    </section>
  );
}
