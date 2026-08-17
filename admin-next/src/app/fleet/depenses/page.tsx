'use client';
import { apiFetch } from '@/lib/api';
import { useState } from 'react';
import { DollarSign, Save, AlertCircle } from 'lucide-react';

export default function FleetDepensesPage() {
  const [category, setCategory] = useState('carburant');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!amount || Number(amount) <= 0) {
      setError('Montant invalide');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/finances/expenses', {
        method: 'POST',
        body: JSON.stringify({ category, amount: Number(amount) }),
      });
      if (res.ok) {
        setMessage('✅ Dépense enregistrée (simulation - modèle Expense à venir)');
        setAmount('');
      } else {
        const err = await res.json();
        setError(err.error || 'Erreur');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">💸 Dépenses</h1>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}
      {message && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">{message}</div>}

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><DollarSign size={20} className="text-blue-600" /></div>
          <div>
            <h2 className="text-lg font-semibold">Nouvelle dépense</h2>
            <p className="text-xs text-gray-500">Carburant, maintenance, etc.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Catégorie</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="carburant">Carburant</option>
              <option value="maintenance">Maintenance</option>
              <option value="assurance">Assurance</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Montant (Ar)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="50000" className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm disabled:opacity-50">
            <Save size={16} /> {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  );
}
