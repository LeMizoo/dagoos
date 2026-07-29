'use client';
import { FileCheck, Plus, Building2, Calendar, DollarSign } from 'lucide-react';

const contrats = [
  { id: '1', societe: 'Express Mg', type: 'Standard', debut: '2026-01-15', fin: '2026-12-31', montant: 150000 },
  { id: '2', societe: 'Livraison Pro', type: 'Premium', debut: '2026-03-01', fin: '2027-02-28', montant: 300000 },
];

export default function CoopContratsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold text-gray-800">📝 Contrats</h1><button className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition text-sm"><Plus size={16} /> Nouveau contrat</button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contrats.map(c => (
          <div key={c.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex items-start justify-between mb-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center"><FileCheck size={20} className="text-emerald-600" /></div><div><h3 className="font-semibold">{c.societe}</h3><p className="text-xs text-gray-500">{c.type}</p></div></div><span className="text-emerald-600 font-bold">{c.montant.toLocaleString()} Ar</span></div>
            <div className="flex gap-4 text-xs text-gray-500"><span className="flex items-center gap-1"><Calendar size={12} /> {new Date(c.debut).toLocaleDateString('fr-FR')}</span><span>→</span><span>{new Date(c.fin).toLocaleDateString('fr-FR')}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
