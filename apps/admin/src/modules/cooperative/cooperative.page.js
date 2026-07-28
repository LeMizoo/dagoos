// DAGOO'S - Coopératives
async function init_cooperative() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="topbar"><h1>🏢 Coopératives</h1>
      <button class="btn btn-primary btn-sm" onclick="addOrg('COOPERATIVE')">➕ Ajouter</button>
    </div>
    <div class="card"><table><thead><tr>
      <th>Nom</th><th>Code</th><th>Email</th><th>Plan</th><th>Véhicules</th><th>Chauffeurs</th><th>Statut</th><th>Actions</th>
    </tr></thead><tbody id="coopsTable"></tbody></table></div>`;
  loadCoops();
}

async function loadCoops() {
  try {
    const [orgs, drivers, vehicles] = await Promise.all([apiGet('/organizations'), apiGet('/drivers'), apiGet('/vehicles')]);
    const coops = orgs.filter(o => o.type === 'COOPERATIVE');
    
    document.getElementById('coopsTable').innerHTML = coops.length ? coops.map(o => {
      const nbDrivers = drivers.filter(d => d.organizationId === o.id).length;
      const nbVehicles = vehicles.filter(v => v.organizationId === o.id).length;
      return `<tr>
        <td><strong>${o.name}</strong></td><td><code>CO-${o.code}</code></td><td>${o.email || 'N/A'}</td>
        <td>${o.plan || 'Freemium'}</td><td>${nbVehicles}</td><td>${nbDrivers}</td>
        <td>${o.status}</td><td class="action-btns"><button class="btn-sm btn-view" onclick="viewOrg('${o.id}')">👁</button></td></tr>`;
    }).join('') : '<tr><td colspan="8">Aucune coopérative</td></tr>';
  } catch(e) {}
}
