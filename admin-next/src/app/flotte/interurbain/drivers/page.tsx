'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import { Users, Plus, Search, Car, Link2, Phone, Key, Copy, Check, Pencil, Trash2 } from 'lucide-react';

export default function InterurbainDriversPage() {
  const { organization } = useOrganization();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [assigning, setAssigning] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', license: '', pin: '' });
  const [editingDriver, setEditingDriver] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [pointages, setPointages] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const [dRes, vRes] = await Promise.all([
        apiFetch('/drivers').then(r => r.json()),
        apiFetch('/vehicles').then(r => r.json())
      ]);

      const resolvedOrgId = organization?.id || null;
      setOrgId(resolvedOrgId);

      const allDrivers = Array.isArray(dRes) ? dRes : [];
      const allVehicles = Array.isArray(vRes) ? vRes : [];

      setDrivers(resolvedOrgId ? allDrivers.filter((d: any) => d.organizationId === resolvedOrgId) : allDrivers);
      setVehicles(resolvedOrgId ? allVehicles.filter((v: any) => v.organizationId === resolvedOrgId) : allVehicles);

      const today = new Date().toISOString().split('T')[0];
      try {
        const pRes = await apiFetch(`/drivers/pointages?organizationId=${resolvedOrgId || ''}&date=${today}`);
        const allPointages = pRes.ok ? await pRes.json() : [];
        const pMap: Record<string, string> = {};
        (Array.isArray(allPointages) ? allPointages : []).forEach((p: any) => {
          if (p.driverId) {
            pMap[p.driverId] = p.statut || 'PRESENT';
          }
        });
        setPointages(pMap);
      } catch {
        // Silencieux
      }
    } catch {
      // Silencieux
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    if (organization?.id) {
      load();
    }
  }, [organization, load]);

  function generatePin(): string {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  async function handleAdd() {
    if (!form.firstName || !form.lastName || !orgId) return;
    setSaving(true);
    try {
      const pin = form.pin || generatePin();
      const res = await apiFetch('/drivers', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          pin,
          organizationId: orgId,
          status: 'active'
        })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`✅ Chauffeur créé avec succès !\n\nCode : ${data.driverCode || 'Généré automatiquement'}\nPIN : ${pin}`);
        setModalOpen(false);
        setForm({ firstName: '', lastName: '', phone: '', license: '', pin: '' });
        load();
      } else {
        const err = await res.json();
        alert('❌ ' + (err.error || 'Erreur lors de la création'));
      }
    } catch (e) {
      console.error(e);
      alert('❌ Erreur réseau');
    } finally {
      setSaving(false);
    }
  }

  async function assignVehicle(driverId: string, vehicleId: string) {
    await apiFetch(`/drivers/${driverId}`, {
      method: 'PUT',
      body: JSON.stringify({ vehicleId: vehicleId || null }),
    });
    setAssigning(null);
    load();
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function openEdit(driver: any) {
    const nameParts = (driver.user?.name || '').split(' ');
    setEditingDriver(driver);
    setForm({
      firstName: driver.user?.name ? nameParts[0] || '' : (driver.firstName || ''),
      lastName: driver.user?.name ? nameParts.slice(1).join(' ') : (driver.lastName || ''),
      phone: driver.user?.phone || driver.phone || '',
      license: driver.license || '',
      pin: ''
    });
    setModalOpen(true);
  }

  async function handleEdit() {
    if (!editingDriver || !form.firstName || !form.lastName) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/drivers/${editingDriver.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          license: form.license,
          ...(form.pin ? { pin: form.pin } : {})
        })
      });
      if (res.ok) {
        alert('✅ Chauffeur modifié avec succès !');
        setModalOpen(false);
        setEditingDriver(null);
        setForm({ firstName: '', lastName: '', phone: '', license: '', pin: '' });
        load();
      } else {
        const err = await res.json();
        alert('❌ ' + (err.error || 'Erreur lors de la modification'));
      }
    } catch (e) {
      console.error(e);
      alert('❌ Erreur réseau');
    } finally {
      setSaving(false);
    }
  }

  async function resetPin(driverId: string) {
    const confirmed = window.confirm(
      'Réinitialiser le PIN de ce chauffeur ?\n\nUn nouveau PIN sera généré.'
    );

    if (!confirmed) return;

    try {
      const res = await apiFetch(`/drivers/${driverId}/reset-pin`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        alert('❌ ' + (data.error || 'Erreur lors de la réinitialisation'));
        return;
      }

      alert(
        `✅ PIN réinitialisé !\n\nCode chauffeur : ${data.driverCode}\nNouveau PIN : ${data.pin}\n\n⚠️ Conservez ce PIN : il ne sera plus affiché.`
      );
    } catch (e) {
      console.error(e);
      alert('❌ Erreur réseau');
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      const res = await apiFetch(`/drivers/${deleteConfirm.id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('✅ Chauffeur supprimé !');
        setDeleteConfirm(null);
        load();
      } else {
        const err = await res.json();
        alert('❌ ' + (err.error || 'Erreur lors de la suppression'));
      }
    } catch (e) {
      console.error(e);
      alert('❌ Erreur réseau');
    }
  }

  const filtered = drivers.filter(d => {
    const matchesSearch = ((d.user?.name || '') + ' ' + (d.driverCode || '')).toLowerCase().includes(search.toLowerCase());
    const effectiveStatus = pointages[d.id] || d.status;
    const matchesStatus = statusFilter === 'all' || effectiveStatus === statusFilter;
    const matchesVehicle = vehicleFilter === 'all' ||
      (vehicleFilter === 'assigned' && d.vehicleId) ||
      (vehicleFilter === 'unassigned' && !d.vehicleId) ||
      (vehicleFilter === d.vehicleId);
    return matchesSearch && matchesStatus && matchesVehicle;
  });

  const stats = {
    total: drivers.length,
    active: drivers.filter(d => pointages[d.id] === 'PRESENT' || (!pointages[d.id] && d.status === 'active')).length,
    assigned: drivers.filter(d => d.vehicleId).length,
    unassigned: drivers.filter(d => !d.vehicleId).length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🚌 Chauffeurs Inter-urbain</h1>
          <p className="text-sm text-gray-500">
            {stats.total} chauffeurs · {stats.active} en service · {stats.assigned} assignés
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 hover:bg-emerald-700"
        >
          <Plus size={18} /> Ajouter un chauffeur
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-center">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-center">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-xs text-gray-500">En service</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
          <div className="text-xs text-gray-500">Assignés</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.unassigned}</div>
          <div className="text-xs text-gray-500">Non assignés</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Tous statuts</option>
          <option value="PRESENT">En service</option>
          <option value="PAUSE">En pause</option>
          <option value="NON_DEBUTE">Absent</option>
        </select>
        <select
          value={vehicleFilter}
          onChange={e => setVehicleFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Tous véhicules</option>
          <option value="assigned">Assignés</option>
          <option value="unassigned">Non assignés</option>
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>{v.plate}</option>
          ))}
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3">Chauffeur</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Téléphone</th>
                <th className="px-4 py-3">Véhicule</th>
                <th className="px-4 py-3">PIN</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">Aucun chauffeur</td></tr>
              ) : (
                filtered.map(d => {
                  const cv = vehicles.find(v => v.id === d.vehicleId);
                  return (
                    <tr key={d.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {d.user?.name || 'Sans nom'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{d.driverCode || '-'}</code>
                          {d.driverCode && (
                            <button onClick={() => copyCode(d.driverCode)} className="text-gray-400 hover:text-emerald-600">
                              {copiedCode === d.driverCode ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 flex items-center gap-2">
                        <Phone size={14} className="text-gray-400" />
                        {d.user?.phone || d.phone || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {assigning === d.id ? (
                          <select
                            className="text-xs border rounded px-2 py-1"
                            defaultValue={d.vehicleId || ''}
                            onChange={e => assignVehicle(d.id, e.target.value)}
                            onBlur={() => setAssigning(null)}
                            autoFocus
                          >
                            <option value="">Aucun</option>
                            {vehicles.filter(v => v.status === 'active').map(v => (
                              <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                            ))}
                          </select>
                        ) : (
                          <button onClick={() => setAssigning(d.id)} className="flex items-center gap-1 text-xs text-emerald-600 hover:underline">
                            {cv ? (
                              <span className="flex items-center gap-1"><Car size={12} /> {cv.plate}</span>
                            ) : (
                              <span className="flex items-center gap-1 text-gray-400"><Link2 size={12} /> Assigner</span>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-400">••••</span>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const pt = pointages[d.id] || d.status;
                          const label = pt === 'PRESENT' ? 'En service' : pt === 'PAUSE' ? 'En pause' : pt === 'PARTI' ? 'Absent' : pt === 'NON_DEBUTE' ? 'Non débuté' : d.status;
                          const color = pt === 'PRESENT' ? 'bg-green-100 text-green-700' : pt === 'PAUSE' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';
                          return <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
                        })()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openEdit(d)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><Pencil size={16} /></button>
                        <button onClick={() => resetPin(d.id)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Réinitialiser le PIN" aria-label="Réinitialiser le PIN"><Key size={16} /></button>
                        <button onClick={() => setDeleteConfirm(d)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale ajout/édition */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">{editingDriver ? '✏️ Modifier le chauffeur' : '🚌 Ajouter un chauffeur'}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Prénom"
                  value={form.firstName}
                  onChange={e => setForm({...form, firstName: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Nom"
                  value={form.lastName}
                  onChange={e => setForm({...form, lastName: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <input
                type="text"
                placeholder="Téléphone"
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="Permis"
                value={form.license}
                onChange={e => setForm({...form, license: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <div className="flex items-center gap-2">
                <Key size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="PIN (4 chiffres - laisser vide pour générer)"
                  value={form.pin}
                  onChange={e => setForm({...form, pin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  maxLength={4}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => { setModalOpen(false); setEditingDriver(null); setForm({ firstName: '', lastName: '', phone: '', license: '', pin: '' }); }}
                className="flex-1 px-4 py-2 border rounded-lg text-sm"
              >
                Annuler
              </button>
              <button
                onClick={editingDriver ? handleEdit : handleAdd}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : editingDriver ? 'Enregistrer' : 'Créer le chauffeur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale suppression */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold mb-3">⚠️ Confirmer la suppression</h2>
            <p className="text-sm text-gray-600 mb-4">
              Supprimer le chauffeur <strong>{deleteConfirm.user?.name || deleteConfirm.driverCode}</strong> ?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border rounded-lg text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
