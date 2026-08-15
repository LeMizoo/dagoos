'use client';
import { useState, useEffect } from 'react';
import { Save, Globe, Upload, Eye } from 'lucide-react';

interface LandingData {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  aboutText: string;
  services: { icon: string; title: string; desc: string }[];
  contactEmail: string;
  contactPhone: string;
  primaryColor: string;
}

const defaultServices = [
  { icon: '🛵', title: 'Transport rapide', desc: 'Courses urbaines et interurbaines' },
  { icon: '🔧', title: 'Véhicules entretenus', desc: 'Parc régulièrement vérifié' },
  { icon: '👨‍✈️', title: 'Chauffeurs qualifiés', desc: 'Professionnels expérimentés' },
  { icon: '📍', title: 'Suivi en temps réel', desc: 'Localisation GPS' },
  { icon: '💳', title: 'Paiement sécurisé', desc: 'Multiples options' },
  { icon: '📞', title: 'Support 24/7', desc: 'Assistance à tout moment' },
];

export default function LandingPageSettings({ app }: { app: 'fleet' | 'coop' }) {
  const [data, setData] = useState<LandingData>({
    heroTitle: '',
    heroSubtitle: '',
    heroImage: '',
    aboutText: '',
    services: defaultServices,
    contactEmail: '',
    contactPhone: '',
    primaryColor: app === 'fleet' ? '#2563EB' : '#059669',
  });
  const [saved, setSaved] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  async function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Globe size={20} /> Landing Page
          </h2>
          <p className="text-sm text-gray-500 mt-1">Personnalisez votre page publique</p>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-gray-800 mb-4">🎯 Section Hero</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre principal</label>
            <input type="text" value={data.heroTitle} onChange={e => setData({ ...data, heroTitle: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Nom de votre organisation" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sous-titre</label>
            <input type="text" value={data.heroSubtitle} onChange={e => setData({ ...data, heroSubtitle: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Gestionnaire de flotte Dagoo" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image de fond (URL)</label>
            <div className="flex gap-2">
              <input type="text" value={data.heroImage} onChange={e => setData({ ...data, heroImage: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-lg text-sm" placeholder="https://exemple.com/image.jpg" />
              <button className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-1">
                <Upload size={14} /> Upload
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Couleur principale</label>
            <input type="color" value={data.primaryColor} onChange={e => setData({ ...data, primaryColor: e.target.value })}
              className="w-16 h-10 border rounded cursor-pointer" />
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-gray-800 mb-4">🔧 Services</h3>
        <div className="grid grid-cols-2 gap-4">
          {data.services.map((service, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <input type="text" value={service.icon}
                  onChange={e => { const s = [...data.services]; s[index].icon = e.target.value; setData({ ...data, services: s }); }}
                  className="w-10 px-2 py-1 border rounded text-center text-lg" />
                <input type="text" value={service.title}
                  onChange={e => { const s = [...data.services]; s[index].title = e.target.value; setData({ ...data, services: s }); }}
                  className="flex-1 px-2 py-1 border rounded text-sm font-medium" />
              </div>
              <input type="text" value={service.desc}
                onChange={e => { const s = [...data.services]; s[index].desc = e.target.value; setData({ ...data, services: s }); }}
                className="w-full px-2 py-1 border rounded text-xs text-gray-500" />
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-gray-800 mb-4">📞 Contact</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={data.contactEmail} onChange={e => setData({ ...data, contactEmail: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input type="text" value={data.contactPhone} onChange={e => setData({ ...data, contactPhone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-gray-800 mb-4">📝 À propos</h3>
        <textarea value={data.aboutText} onChange={e => setData({ ...data, aboutText: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg text-sm h-24" placeholder="Décrivez votre organisation..." />
      </div>

      <button onClick={handleSave}
        className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition flex items-center justify-center gap-2">
        {saved ? '✅ Sauvegardé !' : <><Save size={18} /> Enregistrer les modifications</>}
      </button>
    </div>
  );
}
