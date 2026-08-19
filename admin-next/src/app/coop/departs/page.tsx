'use client';
import { apiFetch } from '@/lib/api';
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Calendar, Clock, MapPin, Users, Car } from 'lucide-react';
import PlanVehicule from '@/components/coop/PlanVehicule';

export default function CoopDepartsPage() {
  const [departs, setDeparts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ pointDepart: '', destination: '', date: '', heure: '', prix: '', placesTotal: '25', vehiculeId: '' });
  const [saving, setSaving] = useState(false);
  const [showArchives, setShowArchives] = useState(false);

  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [dRes, vRes] = await Promise.all([
        apiFetch('/departs'),
        apiFetch('/vehicles'),
      ]);
      if (dRes.ok) {
        const departsData = await dRes.json();
        const sorted = Array.isArray(departsData)
          ? [...departsData].sort((a: any, b: any) => {
              if (a.pointDepart !== b.pointDepart) return a.pointDepart.localeCompare(b.pointDepart);
              if (a.date !== b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
              return (a.heure || '').localeCompare(b.heure || '');
            })
          : [];
        setDeparts(sorted);
      }
      if (vRes.ok) setVehicles(await vRes.json());
      else setError('Erreur chargement');
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  function openCreate() {
    setEditing(null);
    setForm({ pointDepart: '', destination: '', date: '', heure: '', prix: '', placesTotal: '25', vehiculeId: '' });
    setModalOpen(true);
  }

  function openEdit(d: any) {
    setEditing(d);
    setForm({
      pointDepart: d.pointDepart || '',
      destination: d.destination || '',
      date: d.date ? d.date.split('T')[0] : '',
      heure: d.heure || '',
      prix: String(d.prix || ''),
      placesTotal: String(d.placesTotal || '25'),
      vehiculeId: d.vehiculeId || '',
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/departs/${editing.id}` : '/departs';
      const method = editing ? 'PUT' : 'POST';
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify({
          ...form,
          prix: Number(form.prix),
          placesTotal: Number(form.placesTotal),
        }),
      });
      if (res.ok) {
        setModalOpen(false);
        load();
      } else {
        const err = await res.json();
        setError(err.error || 'Erreur');
      }
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce départ ?')) return;
    await apiFetch(`/departs/${id}`, { method: 'DELETE' });
    load();
  }

  function getDepartStatus(d: any): 'imminent' | 'parti' | 'complet' | 'normal' {
    const [h, m] = (d.heure || '').split(':').map(Number);
    const departTime = new Date(d.date);
    departTime.setHours(h, m, 0, 0);
    const diff = departTime.getTime() - Date.now();
    
    const placesReservees = (d.reservations || []).length;
    if (placesReservees >= d.placesTotal) return 'complet';
    if (diff <= 0) return 'parti';
    if (diff <= 60 * 60 * 1000) return 'imminent';
    return 'normal';
  }

  function isDepartParti(d: any): boolean {
    const [h, m] = (d.heure || '').split(':').map(Number);
    const dt = new Date(d.date);
    dt.setHours(h, m, 0, 0);
    return dt.getTime() <= Date.now();
  }

  const departsActifs = departs.filter(d => !isDepartParti(d));
  const departsArchives = departs.filter(d => isDepartParti(d));
  const departsAffiches = showArchives ? departsArchives : departsActifs;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🚌 Départs</h1>
          <p className="text-sm text-gray-500">{departsAffiches.length} départ(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchives(!showArchives)}
            className={`px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition ${
              showArchives ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🗄️ {showArchives ? 'Départs actifs' : 'Archives'}
          </button>
          <button onClick={openCreate} className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 hover:bg-emerald-700">
            <Plus size={16} /> Nouveau départ
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Chargement...</div>
      ) : departs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">Aucun départ programmé</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departsAffiches.map((d: any) => (
            <div key={d.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    <MapPin size={14} className="inline mr-1" />{d.pointDepart} → {d.destination}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                    <Calendar size={12} /> {d.date ? new Date(d.date).toLocaleDateString('fr-FR') : '-'}
                    <Clock size={12} /> {d.heure}
                  </p>
                </div>
                {getDepartStatus(d) === 'complet' ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">✅ Complet</span>
                ) : getDepartStatus(d) === 'parti' ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">🚌 Parti</span>
                ) : getDepartStatus(d) === 'imminent' ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 animate-pulse">⏰ Imminent</span>
                ) : (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${d.statut === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {d.statut}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="font-bold text-emerald-600">{Number(d.prix || 0).toLocaleString()} Ar</span>
                <span className="text-xs text-gray-500 flex items-center gap-1"><Users size={12} /> {d.placesTotal} places</span>
              </div>
              <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                <Car size={12} /> {d.vehicle ? `${d.vehicle.plate} - ${d.vehicle.model || ''}` : 'Aucun véhicule assigné'}
              </div>
              {d.vehicle && (
                <div className="mb-3">
                  <PlanVehicule
                    placesTotal={d.placesTotal}
                    placesReservees={(d.reservations || []).map((r: any) => r.place)}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => openEdit(d)} className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1"><Pencil size={12} /> Modifier</button>
                <button onClick={() => handleDelete(d.id)} className="flex-1 px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-1"><Trash2 size={12} /> Supprimer</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Modifier le départ' : 'Nouveau départ'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" placeholder="Point de départ" value={form.pointDepart} onChange={e => setForm({...form, pointDepart: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              <input type="text" placeholder="Destination" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" required />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" required />
                <input type="time" value={form.heure} onChange={e => setForm({...form, heure: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Prix (Ar)" value={form.prix} onChange={e => setForm({...form, prix: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" required />
                <input type="number" placeholder="Places" value={form.placesTotal} onChange={e => setForm({...form, placesTotal: e.target.value})} className="px-3 py-2 border rounded-lg text-sm" required />
              </div>
              <select value={form.vehiculeId} onChange={e => setForm({...form, vehiculeId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">-- Sélectionner un véhicule --</option>
                {vehicles.filter((v: any) => v.status === 'active').map((v: any) => (
                  <option key={v.id} value={v.id}>{v.plate} - {v.model || v.type}</option>
                ))}
              </select>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50">{saving ? '...' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
