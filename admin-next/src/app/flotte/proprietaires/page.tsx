'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useOrganization } from '@/lib/organization-context';
import Link from 'next/link';
import { Plus, Search, Phone, Mail, User, Car, X } from 'lucide-react';

export default function ProprietairesPage() {
  const { organization } = useOrganization();
  const [proprietaires, setProprietaires] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    cin: '',
    phone: '',
    email: '',
    address: '',
    nif: '',
    stat: '',
  });

  const load = useCallback(async () => {
    if (!organization?.id) return;

    try {
      const r = await apiFetch('/proprietaires');

      if (r.ok) {
        const data = await r.json();
        const allProprietaires = Array.isArray(data) ? data : [];

        setProprietaires(
          allProprietaires.filter(
            (p: any) => p.organizationId === organization.id
          )
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    load();
  }, [load]);

  const openModal = () => {
    setError('');
    setForm({
      name: '',
      cin: '',
      phone: '',
      email: '',
      address: '',
      nif: '',
      stat: '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!organization?.id) {
      setError('Organisation introuvable');
      return;
    }

    if (!form.name.trim()) {
      setError('Le nom du propriétaire est requis');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await apiFetch('/proprietaires', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          cin: form.cin.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          address: form.address.trim() || null,
          nif: form.nif.trim() || null,
          stat: form.stat.trim() || null,
          organizationId: organization.id,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || 'Erreur lors de la création du propriétaire'
        );
      }

      setModalOpen(false);
      setForm({
        name: '',
        cin: '',
        phone: '',
        email: '',
        address: '',
        nif: '',
        stat: '',
      });

      await load();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Erreur lors de la création du propriétaire');
    } finally {
      setSaving(false);
    }
  };

  const filtered = proprietaires.filter(
    (p) =>
      (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.cin || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            🏢 Propriétaires
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} propriétaire{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition text-sm"
        >
          <Plus size={16} /> Nouveau propriétaire
        </button>
      </div>

      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Rechercher par nom, CIN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-gray-400">
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-400">
            Aucun propriétaire
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border hover:shadow-md transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User size={22} className="text-emerald-600" />
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">
                    {p.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {p.cin || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                {p.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} /> {p.phone}
                  </div>
                )}

                {p.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} /> {p.email}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1 text-xs">
                    <Car size={14} />{' '}
                    {p._count?.vehicles || p.vehicles?.length || 0} véhicules
                  </span>
                </div>
              </div>

              <Link
                href={`/flotte/proprietaires/${p.id}`}
                className="block w-full text-center py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition"
              >
                Voir les véhicules →
              </Link>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Nouveau propriétaire
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Ajouter un propriétaire à {organization?.name || 'votre organisation'}.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5">
              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="Nom du propriétaire"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CIN
                  </label>
                  <input
                    type="text"
                    value={form.cin}
                    onChange={(e) =>
                      setForm({ ...form, cin: e.target.value })
                    }
                    placeholder="Numéro CIN"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    placeholder="03x xx xxx xx"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="email@exemple.mg"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    placeholder="Adresse"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    NIF
                  </label>
                  <input
                    type="text"
                    value={form.nif}
                    onChange={(e) =>
                      setForm({ ...form, nif: e.target.value })
                    }
                    placeholder="Numéro fiscal"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    STAT
                  </label>
                  <input
                    type="text"
                    value={form.stat}
                    onChange={(e) =>
                      setForm({ ...form, stat: e.target.value })
                    }
                    placeholder="Numéro STAT"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-gray-200 dark:border-gray-600 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? 'Enregistrement...' : 'Créer le propriétaire'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}