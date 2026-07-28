// DAGOO'S - Flottes
async function init_flotte() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="topbar"><h1>🚛 Flottes</h1>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary btn-sm" onclick="addOrg('FLEET_MANAGER')">➕ Ajouter</button>
        <button class="btn btn-sm" onclick="exportCSV('fleets')">📥 CSV</button>
      </div>
    </div>
    <div class="card"><table><thead><tr>
      <th>Nom</th><th>Code</th><th>Email</th><th>Plan</th><th>Véhicules</th><th>Chauffeurs</th><th>Statut</th><th>Actions</th>
    </tr></thead><tbody id="fleetsTable"></tbody></table></div>`;
  
  await loadFleets();
}

async function loadFleets() {
  try {
    const [orgs, drivers, vehicles] = await Promise.all([
      apiGet('/organizations'),
      apiGet('/drivers'),
      apiGet('/vehicles')
    ]);
    
    const fleets = orgs.filter(o => o.type === 'FLEET_MANAGER');
    const statusLabels = { active: 'Actif', pending: 'En attente', suspended: 'Suspendu', rejected: 'Rejeté' };
    const statuses = ['active', 'pending', 'suspended', 'rejected'];
    
    document.getElementById('fleetsTable').innerHTML = fleets.length ? fleets.map(o => {
      const nbDrivers = drivers.filter(d => d.organizationId === o.id).length;
      const nbVehicles = vehicles.filter(v => v.organizationId === o.id).length;
      
      const statusSelect = `<select onchange="changeStatus('${o.id}', this.value)" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);font-size:11px;">${statuses.map(s => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${statusLabels[s]}</option>`).join('')}</select>`;
      
      return `<tr>
        <td><strong>${o.name}</strong></td>
        <td><code>FL-${o.code}</code></td>
        <td>${o.email || 'N/A'}</td>
        <td><span class="badge badge-info">${o.plan || 'Freemium'}</span></td>
        <td><span class="badge badge-info">${nbVehicles}</span></td>
        <td><span class="badge badge-info">${nbDrivers}</span></td>
        <td>${statusSelect}</td>
        <td class="action-btns">
          <button class="btn-sm btn-view" onclick="viewOrg('${o.id}')">👁</button>
          <button class="btn-sm btn-edit" onclick="editOrg('${o.id}')">✏️</button>
        </td></tr>`;
    }).join('') : '<tr><td colspan="8">Aucune flotte</td></tr>';
  } catch(e) {
    document.getElementById('fleetsTable').innerHTML = '<tr><td colspan="8">❌ Erreur</td></tr>';
  }
}

async function changeStatus(id, status) {
  if (!confirm('Changer le statut ?')) return;
  try { await apiPatch('/organizations/' + id + '/status', { status }); loadFleets(); } catch(e) {}
}

async function viewOrg(id) {
  const orgs = await apiGet('/organizations');
  const o = orgs.find(x => x.id === id);
  if (!o) return;
  showModal(o.name, `<p><strong>Code:</strong> ${o.code}</p><p><strong>Email:</strong> ${o.email || 'N/A'}</p><p><strong>Plan:</strong> ${o.plan || 'Freemium'}</p><p><strong>Statut:</strong> ${o.status}</p>`);
}

function exportCSV() { alert('Export CSV à venir'); }
