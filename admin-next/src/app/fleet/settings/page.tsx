'use client';
import { useState } from 'react';
import { Settings, DollarSign, Save, RotateCcw } from 'lucide-react';

export default function FleetSettingsPage() {
  const [tarifs, setTarifs] = useState({
    prixBase: 2000,
    prixKm: 500,
    locationJournalier: 13500,
    commissionChauffeur: 20,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('fleet_tarifs', JSON.stringify(tarifs));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">⚙️ Paramètres</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Types de courses */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">💰 Types de courses</h2>
              <p className="text-xs text-gray-500">Configurez les tarifs appliqués aux chauffeurs</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Course normale */}
            <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                🚖 Course normale
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Prix de base (Ar)</label>
                  <input
                    type="number"
                    value={tarifs.prixBase}
                    onChange={e => setTarifs({ ...tarifs, prixBase: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-sm dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Prix au km (Ar)</label>
                  <input
                    type="number"
                    value={tarifs.prixKm}
                    onChange={e => setTarifs({ ...tarifs, prixKm: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-sm dark:text-white"
                  />
                </div>
              </div>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                💡 <strong>Formule :</strong> Prix base + (Distance km × Prix/km)<br/>
                📊 <strong>Exemple 5 km :</strong> {tarifs.prixBase.toLocaleString()} + (5 × {tarifs.prixKm}) = {(tarifs.prixBase + 5 * tarifs.prixKm).toLocaleString()} Ar
              </div>
            </div>

            {/* Ady Varotra */}
            <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                🛺 Ady Varotra
              </h3>
              <p className="text-xs text-gray-500">
                Prix libre négocié entre le chauffeur et le client. La commission s'applique sur le montant déclaré.
              </p>
            </div>

            {/* Location journalière */}
            <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                📅 Location journalière
              </h3>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tarif/jour (Ar)</label>
                <input
                  type="number"
                  value={tarifs.locationJournalier}
                  onChange={e => setTarifs({ ...tarifs, locationJournalier: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg text-sm dark:text-white"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Le chauffeur reverse 100% du montant de la location.
              </p>
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
              <input
                type="range"
                min="0"
                max="50"
                value={tarifs.commissionChauffeur}
                onChange={e => setTarifs({ ...tarifs, commissionChauffeur: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="text-sm font-bold text-gray-800 dark:text-white w-12 text-right">{tarifs.commissionChauffeur}%</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0%</span>
              <span>50%</span>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">📋 Récapitulatif</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">🚖 Course normale</span>
                <span className="text-gray-800 dark:text-white font-medium">
                  Base {tarifs.prixBase.toLocaleString()} Ar + {tarifs.prixKm} Ar/km
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">🛺 Ady Varotra</span>
                <span className="text-gray-800 dark:text-white font-medium">Prix libre</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">📅 Location/jour</span>
                <span className="text-gray-800 dark:text-white font-medium">{tarifs.locationJournalier.toLocaleString()} Ar</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-600 my-2" />
              <div className="flex justify-between">
                <span className="text-gray-500">💰 Part chauffeur</span>
                <span className="text-green-600 font-bold">{tarifs.commissionChauffeur}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">🏢 Part organisation</span>
                <span className="text-blue-600 font-bold">{100 - tarifs.commissionChauffeur}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition text-sm"
        >
          <Save size={16} /> {saved ? '✓ Sauvegardé !' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}
