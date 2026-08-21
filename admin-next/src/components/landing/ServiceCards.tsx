'use client';

import { useState } from 'react';
import { Car, Bus, X, MapPin, Calendar, Phone, ArrowRight } from 'lucide-react';
import DemandeTaxi from './DemandeTaxi';
import Link from 'next/link';

interface ServiceCardsProps {
  organizations: any[];
  coopsAvecDeparts: any[];
}

export default function ServiceCards({ organizations, coopsAvecDeparts }: ServiceCardsProps) {
  const [activeModal, setActiveModal] = useState<'taxi' | 'departs' | null>(null);

  const fleets = organizations.filter((o: any) => o.type === 'FLEET_MANAGER');

  function getCountdown(dateStr: string, heure: string): string {
    const [h, m] = heure.split(':').map(Number);
    const departTime = new Date(dateStr);
    departTime.setHours(h, m, 0, 0);
    
    const diff = departTime.getTime() - Date.now();
    if (diff <= 0) return 'Départ en cours';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `dans ${days}j ${hours % 24}h`;
    }
    return `dans ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}min`;
  }

  return (
    <>
      {/* SECTION DES DEUX CARTES */}
      <section id="services" className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Nos Services</h2>
          <p className="text-center text-gray-500 mb-12">Choisissez un service pour commencer</p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* CARTE TAXI */}
            <button
              onClick={() => setActiveModal('taxi')}
              className="group relative bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-8 text-left hover:scale-105 transition-transform duration-300 shadow-xl hover:shadow-2xl"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                <ArrowRight size={24} className="text-white" />
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <Car size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">🚕 Demander un Taxi</h3>
              <p className="text-white/90 mb-4">
                Besoin d'un véhicule rapidement ? Commandez un taxi ou une moto en quelques clics.
              </p>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <span className="bg-white/20 px-3 py-1 rounded-full">📍 Géolocalisation</span>
                <span className="bg-white/20 px-3 py-1 rounded-full">⏱️ Rapide</span>
              </div>
            </button>

            {/* CARTE DÉPARTS */}
            <button
              onClick={() => setActiveModal('departs')}
              className="group relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-8 text-left hover:scale-105 transition-transform duration-300 shadow-xl hover:shadow-2xl"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                <ArrowRight size={24} className="text-white" />
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <Bus size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">🚌 Départs Disponibles</h3>
              <p className="text-white/90 mb-4">
                Consultez les départs des coopératives partenaires et réservez votre place.
              </p>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                <span className="bg-white/20 px-3 py-1 rounded-full">🎫 Réservation</span>
                <span className="bg-white/20 px-3 py-1 rounded-full">🚌 Confort</span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* MODALE TAXI */}
      {activeModal === 'taxi' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-gray-800">🚕 Demander un Taxi</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <DemandeTaxi />
            </div>
          </div>
        </div>
      )}

      {/* MODALE DÉPARTS */}
      {activeModal === 'departs' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-gray-800">🚌 Départs Disponibles</h3>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              {coopsAvecDeparts.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Aucun départ disponible pour le moment.</p>
              ) : (
                <div className="space-y-4">
                  {coopsAvecDeparts.map((org: any) => (
                    <div key={org.id} className="border border-gray-200 rounded-xl p-4 hover:border-emerald-500 transition">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <Bus size={20} className="text-emerald-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">{org.name}</h4>
                          {org.phone && <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={12} /> {org.phone}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {org.departs?.slice(0, 5).map((d: any) => (
                          <div key={d.id} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm font-semibold text-gray-800">
                              <MapPin size={14} className="inline mr-1" />
                              {d.pointDepart} → {d.destination}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                              <Calendar size={12} className="inline mr-1" />
                              {new Date(d.date).toLocaleDateString('fr-FR')} à {d.heure}
                              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 rounded-full px-2 py-0.5 ml-auto">
                                {getCountdown(d.date, d.heure)}
                              </span>
                            </p>
                            <p className="text-sm font-bold text-emerald-600 mt-1">{Number(d.prix).toLocaleString()} Ar</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Places : {d.placesTotal || 26} · Disponible(s) : {(d.placesTotal || 26) - (d.reservations?.length || 0)}
                            </p>
                          </div>
                        ))}
                      </div>
                      <Link
                        href={`/coop/${org.slug}`}
                        className="w-full mt-3 bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition text-sm inline-block text-center"
                      >
                        Réserver maintenant →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
