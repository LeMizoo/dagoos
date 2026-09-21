'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Coffee,
  Crown,
  FileText,
  Search,
  Star,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Organization {
  id: string;
  name: string;
  email: string;
  type?: string;
  plan: string;
  status: string;
  createdAt: string;
  paymentStatus?: string | null;
  paymentAmount?: number | null;
  paymentRef?: string | null;
  subscriptionEnd?: string | null;
}

interface Plan {
  id: string;
  type: string;
  name: string;
  price: number;
  vehiclesMax: number;
  driversMax: number;
  active: boolean;
}

type PaymentStatus = 'unpaid' | 'paid' | 'overdue' | 'pending';

interface PaymentForm {
  paymentStatus: PaymentStatus;
  paymentAmount: string;
  paymentRef: string;
  subscriptionEnd: string;
}

const PAYMENT_STATUSES: Array<{
  value: PaymentStatus;
  label: string;
}> = [
  { value: 'unpaid', label: 'Non payé' },
  { value: 'paid', label: 'Payé' },
  { value: 'overdue', label: 'En retard' },
  { value: 'pending', label: 'En attente' },
];

const planConfig: Record<
  string,
  { icon: any; color: string; bg: string; label: string }
> = {
  premium: {
    icon: Crown,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 border-yellow-200',
    label: 'Premium',
  },
  standard: {
    icon: Zap,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    label: 'Standard',
  },
  basic: {
    icon: Star,
    color: 'text-teal-600',
    bg: 'bg-teal-50 border-teal-200',
    label: 'Basic',
  },
  freemium: {
    icon: Coffee,
    color: 'text-gray-600',
    bg: 'bg-gray-50 border-gray-200',
    label: 'Freemium',
  },
  surdevis: {
    icon: FileText,
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
    label: 'Sur devis',
  },
};

const paymentStatusConfig: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  unpaid: {
    label: 'Non payé',
    className: 'bg-gray-100 text-gray-700',
  },
  paid: {
    label: 'Payé',
    className: 'bg-green-100 text-green-700',
  },
  overdue: {
    label: 'En retard',
    className: 'bg-red-100 text-red-700',
  },
  pending: {
    label: 'En attente',
    className: 'bg-yellow-100 text-yellow-700',
  },
};

const emptyPaymentForm: PaymentForm = {
  paymentStatus: 'unpaid',
  paymentAmount: '',
  paymentRef: '',
  subscriptionEnd: '',
};

export default function AbonnementsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const [paymentOrg, setPaymentOrg] = useState<Organization | null>(null);
  const [paymentForm, setPaymentForm] =
    useState<PaymentForm>(emptyPaymentForm);
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    fetchOrgs();
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await apiFetch('/plans');

      if (!res.ok) {
        throw new Error('Erreur ' + res.status);
      }

      const data = await res.json();
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement plans:', err);
    }
  };

  const fetchOrgs = async () => {
    setLoading(true);

    try {
      const res = await apiFetch('/organizations?page=1&limit=100');

      if (!res.ok) {
        throw new Error('Erreur ' + res.status);
      }

      const data = await res.json();

      setOrgs(
        Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
            ? data
            : []
      );

      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (orgId: string, newPlan: string) => {
    setUpgrading(orgId);

    try {
      const res = await apiFetch(`/organizations/${orgId}`, {
        method: 'PUT',
        body: JSON.stringify({ plan: newPlan }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erreur ' + res.status);
      }

      await fetchOrgs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpgrading(null);
    }
  };

  const openPaymentModal = (org: Organization) => {
    const paymentStatus = PAYMENT_STATUSES.some(
      item => item.value === org.paymentStatus
    )
      ? (org.paymentStatus as PaymentStatus)
      : 'unpaid';

    let subscriptionEnd = '';

    if (org.subscriptionEnd) {
      const date = new Date(org.subscriptionEnd);

      if (!Number.isNaN(date.getTime())) {
        subscriptionEnd = date.toISOString().slice(0, 10);
      }
    }

    setPaymentOrg(org);
    setPaymentForm({
      paymentStatus,
      paymentAmount:
        typeof org.paymentAmount === 'number'
          ? String(org.paymentAmount)
          : '',
      paymentRef: org.paymentRef ?? '',
      subscriptionEnd,
    });
    setPaymentError('');
  };

  const closePaymentModal = () => {
    if (savingPayment) return;

    setPaymentOrg(null);
    setPaymentForm(emptyPaymentForm);
    setPaymentError('');
  };

  const handlePaymentSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!paymentOrg) return;

    setPaymentError('');

    const amountText = paymentForm.paymentAmount.trim();

    if (amountText !== '') {
      if (!/^\d+$/.test(amountText)) {
        setPaymentError(
          'Le montant doit être un nombre entier positif ou nul.'
        );
        return;
      }

      const amount = Number(amountText);

      if (!Number.isSafeInteger(amount) || amount < 0) {
        setPaymentError('Le montant saisi est invalide.');
        return;
      }
    }

    const paymentRef = paymentForm.paymentRef.trim();

    if (paymentRef.length > 100) {
      setPaymentError(
        'La référence de paiement ne doit pas dépasser 100 caractères.'
      );
      return;
    }

    let subscriptionEnd: string | null = null;

    if (paymentForm.subscriptionEnd) {
      const date = new Date(
        `${paymentForm.subscriptionEnd}T00:00:00.000Z`
      );

      if (Number.isNaN(date.getTime())) {
        setPaymentError('La date de fin d’abonnement est invalide.');
        return;
      }

      subscriptionEnd = date.toISOString();
    }

    const body: {
      paymentStatus: PaymentStatus;
      paymentAmount?: number | null;
      paymentRef?: string | null;
      subscriptionEnd?: string | null;
    } = {
      paymentStatus: paymentForm.paymentStatus,
      paymentAmount:
        amountText === '' ? null : Number(amountText),
      paymentRef: paymentRef || null,
      subscriptionEnd,
    };

    setSavingPayment(true);

    try {
      const res = await apiFetch(`/organizations/${paymentOrg.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));

        throw new Error(
          errData.error || 'Erreur lors de l’enregistrement du paiement.'
        );
      }

      await fetchOrgs();
      closePaymentModal();
    } catch (err: any) {
      setPaymentError(
        err?.message || 'Impossible d’enregistrer le paiement.'
      );
    } finally {
      setSavingPayment(false);
    }
  };

  const filtered = orgs.filter(org => {
    const query = search.toLowerCase();

    const match =
      org.name.toLowerCase().includes(query) ||
      org.email.toLowerCase().includes(query);

    const matchPlan =
      planFilter === 'all' ||
      (org.plan || 'freemium').toLowerCase() === planFilter;

    return match && matchPlan;
  });

  const norm = (p: string) => (p || 'freemium').toLowerCase();

  const tf = orgs.filter(o => norm(o.plan) === 'freemium').length;
  const tb = orgs.filter(o => norm(o.plan) === 'basic').length;
  const ts = orgs.filter(o => norm(o.plan) === 'standard').length;
  const tp = orgs.filter(o => norm(o.plan) === 'premium').length;
  const td = orgs.filter(o => norm(o.plan) === 'surdevis').length;

  const getPlanPrice = (org: Organization) => {
    const planName = org.plan || 'Freemium';

    const plan = plans.find(
      p =>
        p.type === org.type &&
        p.name.toLowerCase() === planName.toLowerCase()
    );

    return plan?.price ?? 0;
  };

  const totalCA = orgs.reduce((sum, org) => {
    const price = getPlanPrice(org);

    return sum + (price > 0 ? price : 0);
  }, 0);

  const payants = tb + ts + tp + td;

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link
          href="/dashboard/finances"
          className="hover:text-purple-600"
        >
          Finances
        </Link>

        <span>/</span>

        <span className="text-gray-800 font-medium">
          Abonnements
        </span>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Abonnements
          </h1>

          <p className="text-sm text-gray-500">
            Gestion des plans et facturation
          </p>
        </div>

        <Link
          href="/dashboard/finances"
          className="flex items-center gap-2 text-sm text-gray-600"
        >
          <ArrowLeft size={16} />
          Retour
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Stat label="Total" value={orgs.length} />

        <Stat
          label="Freemium"
          value={tf}
          icon={Coffee}
          color="text-gray-500"
        />

        <Stat
          label="Basic"
          value={tb}
          icon={Star}
          color="text-teal-500"
        />

        <Stat
          label="Standard"
          value={ts}
          icon={Zap}
          color="text-blue-500"
        />

        <Stat
          label="Premium"
          value={tp}
          icon={Crown}
          color="text-yellow-500"
        />

        <Stat
          label="Sur devis"
          value={td}
          icon={FileText}
          color="text-purple-500"
        />
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">
              CA mensuel estimé
            </p>

            <p className="text-3xl font-bold mt-1">
              {loading
                ? '...'
                : totalCA.toLocaleString() + ' Ar'}
            </p>
          </div>

          <div className="text-sm opacity-80">
            {payants} abonnement
            {payants > 1 ? 's' : ''} payant
            {payants > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg text-sm"
          />
        </div>

        <select
          value={planFilter}
          onChange={e => setPlanFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border rounded-lg text-sm"
        >
          <option value="all">Tous</option>
          <option value="freemium">Freemium</option>
          <option value="basic">Basic</option>
          <option value="standard">Standard</option>
          <option value="premium">Premium</option>
          <option value="surdevis">Sur devis</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            Aucune organisation.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">
                    Organisation
                  </th>

                  <th className="px-4 py-3 text-left">
                    Type
                  </th>

                  <th className="px-4 py-3 text-left">
                    Plan
                  </th>

                  <th className="px-4 py-3 text-left">
                    Prix
                  </th>

                  <th className="px-4 py-3 text-left">
                    Paiement
                  </th>

                  <th className="px-4 py-3 text-left">
                    Statut
                  </th>

                  <th className="px-4 py-3 text-left">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map(org => {
                  const p = norm(org.plan);
                  const cfg =
                    planConfig[p] || planConfig.freemium;

                  const Icon = cfg.icon;
                  const price = getPlanPrice(org);

                  const paymentStatus =
                    PAYMENT_STATUSES.some(
                      item =>
                        item.value === org.paymentStatus
                    )
                      ? (org.paymentStatus as PaymentStatus)
                      : 'unpaid';

                  const paymentCfg =
                    paymentStatusConfig[paymentStatus];

                  return (
                    <tr
                      key={org.id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {org.name}
                        </div>

                        <div className="text-xs text-gray-400 mt-0.5">
                          {org.email}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            org.type === 'FLEET_MANAGER'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {org.type === 'FLEET_MANAGER'
                            ? 'Flotte'
                            : 'Coop'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}
                        >
                          <Icon size={12} />
                          {cfg.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm font-medium">
                        {price === -1
                          ? 'Sur devis'
                          : price === 0
                            ? 'Gratuit'
                            : price.toLocaleString() + ' Ar'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${paymentCfg.className}`}
                          >
                            {paymentCfg.label}
                          </span>

                          {typeof org.paymentAmount ===
                            'number' &&
                            org.paymentAmount > 0 && (
                              <span className="text-xs text-gray-500">
                                {org.paymentAmount.toLocaleString()}{' '}
                                Ar
                              </span>
                            )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            org.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {org.status || 'inactif'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          <Btn
                            onClick={() =>
                              openPaymentModal(org)
                            }
                            loading={false}
                            label="Paiement"
                            color="bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                            icon={Wallet}
                          />

                          {p !== 'premium' && (
                            <Btn
                              onClick={() =>
                                handleUpgrade(
                                  org.id,
                                  'Premium'
                                )
                              }
                              loading={
                                upgrading === org.id
                              }
                              label="Premium"
                              color="bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            />
                          )}

                          {p !== 'standard' && (
                            <Btn
                              onClick={() =>
                                handleUpgrade(
                                  org.id,
                                  'Standard'
                                )
                              }
                              loading={
                                upgrading === org.id
                              }
                              label="Standard"
                              color="bg-blue-100 text-blue-700 hover:bg-blue-200"
                            />
                          )}

                          {p !== 'basic' && (
                            <Btn
                              onClick={() =>
                                handleUpgrade(
                                  org.id,
                                  'Basic'
                                )
                              }
                              loading={
                                upgrading === org.id
                              }
                              label="Basic"
                              color="bg-teal-100 text-teal-700 hover:bg-teal-200"
                            />
                          )}

                          {p !== 'freemium' && (
                            <Btn
                              onClick={() =>
                                handleUpgrade(
                                  org.id,
                                  'Freemium'
                                )
                              }
                              loading={
                                upgrading === org.id
                              }
                              label="Freemium"
                              color="bg-gray-100 text-gray-600 hover:bg-gray-200"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {paymentOrg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="payment-modal-title"
          onMouseDown={event => {
            if (event.target === event.currentTarget) {
              closePaymentModal();
            }
          }}
        >
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2
                  id="payment-modal-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  Paiement abonnement
                </h2>

                <p className="text-sm text-gray-500 mt-0.5">
                  {paymentOrg.name}
                </p>
              </div>

              <button
                type="button"
                onClick={closePaymentModal}
                disabled={savingPayment}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handlePaymentSubmit}
              className="p-5 space-y-4"
            >
              {paymentError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle
                    size={16}
                    className="mt-0.5 shrink-0"
                  />

                  <span>{paymentError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="payment-status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Statut du paiement
                </label>

                <select
                  id="payment-status"
                  value={paymentForm.paymentStatus}
                  onChange={event =>
                    setPaymentForm(current => ({
                      ...current,
                      paymentStatus:
                        event.target.value as PaymentStatus,
                    }))
                  }
                  disabled={savingPayment}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {PAYMENT_STATUSES.map(status => (
                    <option
                      key={status.value}
                      value={status.value}
                    >
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="payment-amount"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Montant
                </label>

                <div className="relative">
                  <input
                    id="payment-amount"
                    type="number"
                    min="0"
                    step="1"
                    value={paymentForm.paymentAmount}
                    onChange={event =>
                      setPaymentForm(current => ({
                        ...current,
                        paymentAmount: event.target.value,
                      }))
                    }
                    disabled={savingPayment}
                    placeholder="Ex. 75000"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    Ar
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="payment-ref"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Référence du paiement
                </label>

                <input
                  id="payment-ref"
                  type="text"
                  maxLength={100}
                  value={paymentForm.paymentRef}
                  onChange={event =>
                    setPaymentForm(current => ({
                      ...current,
                      paymentRef: event.target.value,
                    }))
                  }
                  disabled={savingPayment}
                  placeholder="Ex. MVOLA-2026-09-001"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <p className="mt-1 text-xs text-gray-400">
                  Facultatif · 100 caractères maximum
                </p>
              </div>

              <div>
                <label
                  htmlFor="subscription-end"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fin d'abonnement
                </label>

                <input
                  id="subscription-end"
                  type="date"
                  value={paymentForm.subscriptionEnd}
                  onChange={event =>
                    setPaymentForm(current => ({
                      ...current,
                      subscriptionEnd: event.target.value,
                    }))
                  }
                  disabled={savingPayment}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <p className="mt-1 text-xs text-gray-400">
                  Facultatif
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  disabled={savingPayment}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={savingPayment}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />

                  {savingPayment
                    ? 'Enregistrement...'
                    : 'Enregistrer le paiement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon?: any;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      {Icon && (
        <Icon
          size={14}
          className={`${color || ''} mb-1`}
        />
      )}

      <div className="text-xs text-gray-500">
        {label}
      </div>

      <div className="text-xl font-bold text-gray-800">
        {value}
      </div>
    </div>
  );
}

function Btn({
  onClick,
  loading,
  label,
  color,
  icon: Icon,
}: {
  onClick: () => void;
  loading: boolean;
  label: string;
  color: string;
  icon?: any;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded transition disabled:opacity-50 ${color}`}
    >
      {Icon && <Icon size={12} />}

      {loading ? '...' : label}
    </button>
  );
}

