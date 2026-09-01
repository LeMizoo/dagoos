'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { ArrowLeft, Save, User, FileText, Clock, MapPin, Key, Calendar } from 'lucide-react';

export default function ChauffeurDossierPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dossier, setDossier] = useState<any>(null);
  const [driver, setDriver] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, dosRes] = await Promise.all([
        apiFetch(`/drivers/${id}`).then(r => r.json()),
        apiFetch(`/drivers/${id}/dossier`).then(r => r.json()).catch(() => null),
      ]);

      setDriver(dRes);
      setDossier(dosRes || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await apiFetch(`/drivers/${id}/dossier`, {
        method: 'PUT',
        body: JSON.stringify(dossier),
      });

      if (res.ok) {
        alert('✅ Dossier enregistré avec succès !');
        load();
      } else {
        const err = await res.json();
        alert('❌ ' + (err.error || 'Erreur lors de l\'enregistrement'));
      }
    } catch (e) {
      console.error(e);
      alert('❌ Erreur réseau');
    } finally {
      setSaving(false);
    }
  }

  function updateField(field: string, value: string) {
    setDossier((prev: any) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400">Chargement...</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* En-tête */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/flotte/chauffeurs')}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold">📋 Dossier Chauffeur</h1>
          <p className="text-sm text-gray-500">
            {driver?.user?.name || 'Sans nom'} — {driver?.driverCode}
          </p>
        </div>
      </div>

      {/* Formulaire dossier */}
      <div className="space-y-6">
        {/* Identité */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <User size={18} className="text-emerald-600" /> Identité
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CIN</label>
              <input
                type="text"
                placeholder="Ex: 117 072 001 609"
                value={dossier?.cin || ''}
                onChange={e => updateField('cin', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date de délivrance CIN</label>
              <input
                type="date"
                value={dossier?.cinDateDelivrance || ''}
                onChange={e => updateField('cinDateDelivrance', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Lieu de délivrance CIN</label>
              <input
                type="text"
                placeholder="Ex: Antananarivo"
                value={dossier?.cinLieuDelivrance || ''}
                onChange={e => updateField('cinLieuDelivrance', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        </section>

        {/* Permis */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <FileText size={18} className="text-emerald-600" /> Permis de conduire
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Numéro</label>
              <input
                type="text"
                placeholder="Ex: 123456789"
                value={dossier?.permisNumero || ''}
                onChange={e => updateField('permisNumero', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Catégorie</label>
              <select
                value={dossier?.permisCategorie || 'A'}
                onChange={e => updateField('permisCategorie', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="A">A - Moto</option>
                <option value="B">B - Voiture</option>
                <option value="A/B">A/B - Moto + Voiture</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Délivré le</label>
              <input
                type="date"
                value={dossier?.permisDateDelivrance || ''}
                onChange={e => updateField('permisDateDelivrance', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Expire le</label>
              <input
                type="date"
                value={dossier?.permisDateExpiration || ''}
                onChange={e => updateField('permisDateExpiration', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Lieu de délivrance</label>
              <input
                type="text"
                placeholder="Ex: Antananarivo"
                value={dossier?.permisLieuDelivrance || ''}
                onChange={e => updateField('permisLieuDelivrance', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
              <select
                value={dossier?.permisStatut || 'en_attente'}
                onChange={e => updateField('permisStatut', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="valide">✅ Valide</option>
                <option value="expire">❌ Expiré</option>
                <option value="en_attente">⏳ En attente</option>
              </select>
            </div>
          </div>
        </section>

        {/* Adresse et résidence */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-emerald-600" /> Adresse et résidence
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Adresse exacte</label>
              <input
                type="text"
                placeholder="Ex: 1PA 165 Ambatolampy"
                value={dossier?.adresse || ''}
                onChange={e => updateField('adresse', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Certificat de résidence n°</label>
              <input
                type="text"
                value={dossier?.certificatResidenceNum || ''}
                onChange={e => updateField('certificatResidenceNum', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date certificat</label>
              <input
                type="date"
                value={dossier?.certificatResidenceDate || ''}
                onChange={e => updateField('certificatResidenceDate', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        </section>

        {/* Informations professionnelles */}
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-emerald-600" /> Informations professionnelles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date d'embauche</label>
              <input
                type="date"
                value={dossier?.dateEmbauche || ''}
                onChange={e => updateField('dateEmbauche', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Heure de prise de poste</label>
              <input
                type="time"
                value={dossier?.heurePrisePoste || '07:00'}
                onChange={e => updateField('heurePrisePoste', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Heure de fin de service</label>
              <input
                type="time"
                value={dossier?.heureFinService || '19:00'}
                onChange={e => updateField('heureFinService', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        </section>

        {/* Bouton enregistrer */}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.push('/flotte/chauffeurs')}
            className="px-4 py-2 border rounded-lg text-sm"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? 'Enregistrement...' : 'Enregistrer le dossier'}
          </button>
        </div>
      </div>
    </div>
  );
}
