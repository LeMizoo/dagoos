// DAGOO'S - Chauffeurs Flotte
async function init_flotte_chauffeurs() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="topbar"><h1>👤 Chauffeurs Flotte</h1></div>
    <div class="card"><table><thead><tr>
      <th>Code</th><th>Nom</th><th>Email</th><th>Véhicule</th><th>Organisation</th><th>Statut</th><th>Actions</th>
    </tr></thead><tbody id="fcTable"></tbody></table></div>`;
  loadFC();
}

async function loadFC() {
  try {
    const [drivers, orgs, vehicles] = await Promise.all([apiGet('/drivers'), apiGet('/organizations'), apiGet('/vehicles')]);
    const fleetDrivers = drivers.filter(d => {
      const org = orgs.find(o => o.id === d.organizationId);
      return org && org.type === 'FLEET_MANAGER';
    });
    
    document.getElementById('fcTable').innerHTML = fleetDrivers.length ? fleetDrivers.map(d => {
      const org = orgs.find(o => o.id === d.organizationId);
      const vehicle = vehicles.find(v => v.id === d.vehicleId);
      return `<tr>
        <td><code>${d.driverCode}</code></td>
        <td>${d.user?.name || 'N/A'}</td>
        <td>${d.user?.email || 'N/A'}</td>
        <td>${vehicle?.plate || 'Non assigné'}</td>
        <td>${org?.name || 'N/A'}</td>
        <td><span class="badge ${d.status === 'active' ? 'badge-success' : 'badge-warning'}">${d.status}</span></td>
        <td class="action-btns"><button class="btn-sm btn-view" onclick="viewDriver('${d.id}')">👁</button></td></tr>`;
    }).join('') : '<tr><td colspan="7">Aucun chauffeur</td></tr>';
  } catch(e) {}
}
