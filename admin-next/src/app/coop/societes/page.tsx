'use client';
import { useEffect, useState } from 'react';
import { Plus, Building2 } from 'lucide-react';

export default function CoopSocietesPage() {
  const [societes, setSocietes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const [meRes, orgsRes] = await Promise.all([
        fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
        fetch('/api/proxy/organizations').then(r => r.json())
      ]);
      const authUser = meRes?.user || meRes;
      const resolvedOrgId = authUser?.organizationId || authUser?.organization?.id || authUser?.id;
      setOrgId(resolvedOrgId || null);
      const allOrgs = Array.isArray(orgsRes) ? orgsRes : [];
      const filtered = resolvedOrgId
        ? allOrgs.filter((org: any) => org.id === resolvedOrgId || org.organizationId === resolvedOrgId || org.organization?.id === resolvedOrgId)
        : allOrgs;
      setSocietes(filtered);
    } catch {} finally { setLoading(false); }
  }

  const filteredSocietes = societes.filter((org: any) =>
    (org.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🏢 Sociétés</h1>
          <p className="text-sm text-gray-500">{societes.length} société{societes.length > 1 ? 's' : ''}</p>
        </div>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition text-sm">
          <Plus size={16} /> Nouvelle société
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Rechercher une société..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-8">Chargement...</div>
        ) : filteredSocietes.length === 0 ? (
          <div className="text-center text-gray-400 py-8">Aucune société</div>
        ) : (
          <div className="grid gap-3">
            {filteredSocietes.map((org: any) => (
              <div key={org.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-semibold text-gray-800">{org.name || 'Société'}</div>
                  <div className="text-sm text-gray-500">{org.email || '-'}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">{org.type || 'COOPERATIVE'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
