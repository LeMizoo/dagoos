'use client';
import { useState, useEffect } from 'react';
import { Settings, DollarSign, Save, RotateCcw, AlertCircle } from 'lucide-react';

export default function FleetSettingsPage() {
  const [tarifs, setTarifs] = useState({
    prixBase: 2000, prixKm: 500, locationJournalier: 13500, commissionChauffeur: 20,
    adyVarotraActif: true, courseNormalActif: true, locationActif: true,
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadTarifs(); }, []);

  async function loadTarifs() {
    try {
      const r = await fetch('/api/proxy/organizations');
      const orgs = await r.json();
      const fleetOrg = Array.isArray(orgs) ? orgs.find((o: any) => o.type === 'FLEET_MANAGER') : null;
      if (fleetOrg) {
        const tRes = await fetch(`/api/proxy/tarifs/${fleetOrg.id}`);
        if (tRes.ok) {
          const data = await tRes.json();
          if (data && data.prixBase) setTarifs(data);
        }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  async function handleSave() {
    setError('');
    try {
      const r = await fetch('/api/proxy/organizations');
      const orgs = await r.json();
      const fleetOrg = Array.isArray(orgs) ? orgs.find((o: any) => o.type === 'FLEET_MANAGER') : null;
      if (!fleetOrg) { setError('Organisation non trouvée'); return; }

      const res = await fetch(`/api/proxy/tarifs/${fleetOrg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tarifs),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const err = await res.json();
        setError(err.error || 'Erreur');
      }
    } catch (e: any) { setError(e.message); }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Chargement...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">⚙️ Paramètres</h1>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Types de courses */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">💰 Types de courses</h2>
              <p className="text-xs text-gray-500">Configurez les tarifs appliqués aux chauffeurs</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 dark:text-white">🚖 Course normale</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={tarifs.courseNormalActif} onChange={e => setTarifs({...tarifs, courseNormalActif: e.target.checked})} className="w-4 h-4" />
                  <span className="text-xs text-gray-500">Actif</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Prix de base (Ar)</label>
                  <input type="number" value={tarifs.prixBase} onChange={e => setTarifs({ ...tarifs, prixBase: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-sm dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Prix au km (Ar)</label>
                  <input type="number" value={tarifs.prixKm} onChange={e => setTarifs({ ...tarifs, prixKm: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-sm dark:text-white" />
                </div>
              </div>
              <div className="mt-3 p-3 bg-emerald-50 dark:bg-blue-900/20 rounded-lg text-xs text-emerald-700 dark:text-blue-300">
                💡 <strong>Formule :</strong> Prix base + (Distance km × Prix/km)<br/>
                📊 <strong>Exemple 5 km :</strong> {tarifs.prixBase.toLocaleString()} + (5 × {tarifs.prixKm}) = {(tarifs.prixBase + 5 * tarifs.prixKm).toLocaleString()} Ar
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 dark:text-white">🛺 Ady Varotra</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={tarifs.adyVarotraActif} onChange={e => setTarifs({...tarifs, adyVarotraActif: e.target.checked})} className="w-4 h-4" />
                  <span className="text-xs text-gray-500">Actif</span>
                </label>
              </div>
              <p className="text-xs text-gray-500">Prix libre négocié. La commission s'applique sur le montant déclaré.</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 dark:text-white">📅 Location journalière</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={tarifs.locationActif} onChange={e => setTarifs({...tarifs, locationActif: e.target.checked})} className="w-4 h-4" />
                  <span className="text-xs text-gray-500">Actif</span>
                </label>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tarif/jour (Ar)</label>
                <input type="number" value={tarifs.locationJournalier} onChange={e => setTarifs({ ...tarifs, locationJournalier: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-sm dark:text-white" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Le chauffeur reverse 100% du montant.</p>
            </div>
          </div>
        </div>

        {/* Commission */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Settings size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">📊 Commission</h2>
              <p className="text-xs text-gray-500">Partage des revenus avec les chauffeurs</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <label className="block text-xs text-gray-500 mb-1">Part chauffeur (%)</label>
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="50" value={tarifs.commissionChauffeur}
                onChange={e => setTarifs({ ...tarifs, commissionChauffeur: Number(e.target.value) })} className="flex-1" />
              <span className="text-sm font-bold text-gray-800 dark:text-white w-12 text-right">{tarifs.commissionChauffeur}%</span>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">📋 Récapitulatif</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">🚖 Course normale</span><span className="text-gray-800 dark:text-white font-medium">Base {tarifs.prixBase.toLocaleString()} Ar + {tarifs.prixKm} Ar/km</span></div>
              <div className="flex justify-between"><span className="text-gray-500">🛺 Ady Varotra</span><span className="text-gray-800 dark:text-white font-medium">Prix libre</span></div>
              <div className="flex justify-between"><span className="text-gray-500">📅 Location/jour</span><span className="text-gray-800 dark:text-white font-medium">{tarifs.locationJournalier.toLocaleString()} Ar</span></div>
              <hr className="border-gray-200 dark:border-gray-600 my-2" />
              <div className="flex justify-between"><span className="text-gray-500">💰 Part chauffeur</span><span className="text-green-600 font-bold">{tarifs.commissionChauffeur}%</span></div>
              <div className="flex justify-between"><span className="text-gray-500">🏢 Part organisation</span><span className="text-emerald-600 font-bold">{100 - tarifs.commissionChauffeur}%</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button onClick={handleSave} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition text-sm">
          <Save size={16} /> {saved ? '✓ Sauvegardé !' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}
