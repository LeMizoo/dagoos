'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';

export default function SuiviPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function chercher() {
    if (!code.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await apiFetch(`/public/suivi/${code.trim()}`);

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        setError('Demande introuvable avec ce code');
      }
    } catch(e) {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }

  const statutLabels: Record<string, string> = {
    'NEW': 'En attente',
    'ACCEPTED': '✅ Acceptée',
    'REJECTED': '❌ Refusée',
    'IN_PROGRESS': 'En cours',
    'COMPLETED': 'Terminée',
    'CANCELLED': 'Annulée',
  };

  const statutMessages: Record<string, string> = {
    'NEW': '⏳ Votre demande est en attente. Les chauffeurs sont notifiés. Patientez quelques instants.',
    'ACCEPTED': '✅ Un chauffeur a accepté votre demande ! 📞 Restez joignable sur votre téléphone — il va vous appeler pour confirmer le rendez-vous.',
    'REJECTED': '❌ Votre demande a été refusée. Vous pouvez réessayer avec une autre flotte.',
    'IN_PROGRESS': '🕐 Votre course est en cours de traitement.',
    'COMPLETED': '✅ Votre course est terminée. Merci de votre confiance !',
    'CANCELLED': '❌ Votre course a été annulée.',
  };

  const statutNegociationLabels: Record<string, string> = {
    'PRIX_SUGGERE': 'Prix suggéré',
    'OFFRE_CLIENT': 'Offre client en attente',
    'CONTRE_OFFRE_CHAUFFEUR': 'Contre-offre du chauffeur',
    'ACCEPTED': 'Acceptée',
    'REJECTED': 'Refusée',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto px-4">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Retour</Link>
        <h1 className="text-2xl font-bold text-center mb-6 mt-2">📋 Suivre ma demande</h1>

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-4">
          <label className="text-sm text-gray-600 mb-2 block">Code de suivi</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="Ex: DG-PZEY"
            className="w-full px-4 py-3 border rounded-lg text-sm text-center font-mono tracking-wider"
          />
          <button
            onClick={chercher}
            disabled={loading || !code.trim()}
            className="w-full mt-3 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-[#154360] transition disabled:opacity-50"
          >
            {loading ? 'Recherche...' : 'Vérifier le statut'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="font-bold text-gray-800 mb-4">📋 Détails de la demande</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Statut</span>
                <span className="font-semibold">{statutLabels[result.statut] || result.statut}</span>
              </div>

              {statutMessages[result.statut] && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 text-center">
                  {statutMessages[result.statut]}
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-500">Client</span>
                <span className="font-semibold">{result.clientNom}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Trajet</span>
                <span className="font-semibold text-right">{result.depart} → {result.arrivee}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Prix estimé</span>
                <span className="font-semibold">{Number(result.prixEstime).toLocaleString('fr-FR')} Ar</span>
              </div>

              {result.offreClient && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Votre offre</span>
                  <span className="font-semibold text-emerald-600">{Number(result.offreClient).toLocaleString('fr-FR')} Ar</span>
                </div>
              )}

              {result.contreOffreChauffeur && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Contre-offre chauffeur</span>
                  <span className="font-semibold text-blue-600">{Number(result.contreOffreChauffeur).toLocaleString('fr-FR')} Ar</span>
                </div>
              )}

              {result.statutNegociation && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Négociation</span>
                  <span className="font-semibold">{statutNegociationLabels[result.statutNegociation] || result.statutNegociation}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
