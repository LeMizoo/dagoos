'use client';
import { useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface Depense { id: string; categorie: string; description: string; montant: number; date: string; }

export default function CoopDepensesPage() {
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ categorie: 'Carburant', description: '', montant: 0 });
  const categories = ['Carburant', 'Maintenance', 'Assurance', 'Salaire', 'Amende', 'Autre'];

  const totalAujourdhui = depenses.filter(d => d.date === new Date().toISOString().split('T')[0]).reduce((s, d) => s + d.montant, 0);
  const totalSemaine = depenses.filter(d => { const diff = (new Date().getTime() - new Date(d.date).getTime()) / (1000 * 3600 * 24); return diff <= 7; }).reduce((s, d) => s + d.montant, 0);
  const filtered = depenses.filter(d => d.description.toLowerCase().includes(search.toLowerCase()) || d.categorie.toLowerCase().includes(search.toLowerCase()));

  function handleAdd() { setDepenses([{ id: Date.now().toString(), ...form, date: new Date().toISOString().split('T')[0] }, ...depenses]); setForm({ categorie: 'Carburant', description: '', montant: 0 }); setModalOpen(false); }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🧾 Dépenses</h1>
        <button onClick={() => setModalOpen(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition text-sm"><Plus size={16} /> Nouvelle dépense</button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border text-center"><div className="text-2xl font-bold text-gray-800">{totalAujourdhui.toLocaleString()} Ar</div><div className="text-xs text-gray-500">Aujourd&apos;hui</div></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border text-center"><div className="text-2xl font-bold text-gray-800">{totalSemaine.toLocaleString()} Ar</div><div className="text-xs text-gray-500">Cette semaine</div></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border text-center"><div className="text-2xl font-bold text-gray-800">{depenses.reduce((s, d) => s + d.montant, 0).toLocaleString()} Ar</div><div className="text-xs text-gray-500">Total</div></div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">📋 Dépenses récentes</h2>
          <div className="relative max-w-xs"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500" /></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 text-left text-gray-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Catégorie</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Montant</th><th className="px-4 py-3">Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucune dépense</td></tr> :
               filtered.map(d => (
                <tr key={d.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs">{new Date(d.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">{d.categorie}</span></td>
                  <td className="px-4 py-3">{d.description}</td>
                  <td className="px-4 py-3 font-medium text-red-600">{d.montant.toLocaleString()} Ar</td>
                  <td className="px-4 py-3"><button onClick={() => setDepenses(depenses.filter(x => x.id !== d.id))} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle dépense">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label><select value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Montant (Ar)</label><input type="number" value={form.montant} onChange={e => setForm({ ...form, montant: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div className="flex gap-2 pt-2"><button onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm">Annuler</button><button onClick={handleAdd} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">Ajouter</button></div>
        </div>
      </Modal>
    </div>
  );
}
