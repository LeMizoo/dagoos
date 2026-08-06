'use client';
import { useState, useEffect } from 'react';
import { DollarSign, Save, AlertCircle } from 'lucide-react';

const FLEET_VEHICLE_TYPES = {
  livraison: '📦 Livraison',
  transport_commun: '🚌 Transport en commun',
  marchandises: '🚛 Transport de marchandises',
  location: '🔑 Voiture de location',
};

const DEFAULT_TARIFS: Record<string, { prixBase: number; prixKm: number; locationJournalier: number }> = {
  livraison: { prixBase: 3000, prixKm: 600, locationJournalier: 25000 },
  transport_commun: { prixBase: 5000, prixKm: 1000, locationJournalier: 50000 },
  marchandises: { prixBase: 8000, prixKm: 1500, locationJournalier: 80000 },
  location: { prixBase: 0, prixKm: 0, locationJournalier: 45000 },
};

export default function FleetSettingsPage() {
  const [tarifs, setTarifs] = useState(DEFAULT_TARIFS);
  const [commission, setCommission] = useState(20);
  const [orgId, setOrgId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadOrgAndTarifs(); }, []);

  async function loadOrgAndTarifs() {
    try {
      const orgsRes = await fetch('/api/proxy/organizations');
      if (!orgsRes.ok) { setError('Erreur chargement'); setLoading(false); return; }
      const orgs = await orgsRes.json();
      const myOrg = Array.isArray(orgs) ? orgs.find((o: any) => o.type === 'COOPERATIVE') : null;
      if (!myOrg) { setError('Aucune coopérative trouvée'); setLoading(false); return; }
      setOrgId(myOrg.id);

      const tRes = await fetch(`/api/proxy/tarifs/${myOrg.id}`);
      if (tRes.ok) {
        const data = await tRes.json();
        if (data && data.vehiculeTarifs) {
          setTarifs(JSON.parse(data.vehiculeTarifs));
        }
        if (data && data.commissionChauffeur !== undefined) {
          setCommission(data.commissionChauffeur);
        }
      }
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  async function handleSave() {
    setError('');
    if (!orgId) { setError('Organisation non trouvée'); return; }
    try {
      const res = await fetch(`/api/proxy/tarifs/${orgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commissionChauffeur: commission,
          vehiculeTarifs: JSON.stringify(tarifs),
        }),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
      else { const err = await res.json(); setError(err.error || 'Erreur'); }
    } catch (e: any) { setError(e.message); }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">⚙️ Paramètres</h1>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Barèmes par type */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center"><DollarSign size={20} className="text-emerald-600" /></div>
            <div><h2 className="text-lg font-semibold">💰 Barèmes par type de véhicule</h2><p className="text-xs text-gray-500">Prix de base, prix/km et location/jour</p></div>
          </div>
          <div className="space-y-4">
            {Object.entries(FLEET_VEHICLE_TYPES).map(([key, label]) => (
              <div key={key} className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">{label}</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Base (Ar)</label>
                    <input type="number" value={tarifs[key]?.prixBase || 0}
                      onChange={e => setTarifs({...tarifs, [key]: {...tarifs[key], prixBase: Number(e.target.value)}})}
                      className="w-full px-2 py-1.5 border rounded text-xs dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Km (Ar)</label>
                    <input type="number" value={tarifs[key]?.prixKm || 0}
                      onChange={e => setTarifs({...tarifs, [key]: {...tarifs[key], prixKm: Number(e.target.value)}})}
                      className="w-full px-2 py-1.5 border rounded text-xs dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Location/j (Ar)</label>
                    <input type="number" value={tarifs[key]?.locationJournalier || 0}
                      onChange={e => setTarifs({...tarifs, [key]: {...tarifs[key], locationJournalier: Number(e.target.value)}})}
                      className="w-full px-2 py-1.5 border rounded text-xs dark:bg-gray-700 dark:text-white dark:border-gray-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Commission */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center"><DollarSign size={20} className="text-green-600" /></div><div><h2 className="text-lg font-semibold">📊 Commission</h2><p className="text-xs text-gray-500">Part chauffeur sur les courses</p></div></div>
          <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border mb-4">
            <label className="block text-xs text-gray-500 mb-1">Part chauffeur (%)</label>
            <div className="flex items-center gap-3"><input type="range" min="0" max="50" value={commission} onChange={e => setCommission(Number(e.target.value))} className="flex-1" /><span className="text-sm font-bold w-12 text-right">{commission}%</span></div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border">
            <h4 className="text-sm font-semibold mb-2">📋 Récapitulatif</h4>
            <div className="space-y-1 text-xs">
              {Object.entries(FLEET_VEHICLE_TYPES).map(([key, label]) => (
                <div key={key} className="flex justify-between"><span>{label}</span><span className="font-medium">{tarifs[key]?.prixBase?.toLocaleString()} Ar + {tarifs[key]?.prixKm} Ar/km</span></div>
              ))}
              <hr className="my-2" />
              <div className="flex justify-between"><span>💰 Chauffeur</span><span className="text-green-600 font-bold">{commission}%</span></div>
              <div className="flex justify-between"><span>🏢 Coopérative</span><span className="text-emerald-600 font-bold">{100 - commission}%</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6"><button onClick={handleSave} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 text-sm"><Save size={16} /> {saved ? '✓ Sauvegardé !' : 'Sauvegarder'}</button></div>
    </div>
  );
}
