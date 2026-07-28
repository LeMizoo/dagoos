// DAGOO'S - Véhicules Flotte
async function init_flotte_vehicules() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="topbar"><h1>🚛 Véhicules Flotte</h1>
      <button class="btn btn-primary btn-sm" onclick="addVehicle()">➕ Ajouter</button>
    </div>
    <div class="card"><table><thead><tr>
      <th>Plaque</th><th>Modèle</th><th>Année</th><th>Km</th><th>Prochaine maintenance</th><th>Organisation</th><th>Statut</th><th>Actions</th>
    </tr></thead><tbody id="vehiculesTable"></tbody></table></div>`;
  loadFlotteVehicules();
}

async function loadFlotteVehicules() {
  try {
    const [vehicles, orgs] = await Promise.all([apiGet('/vehicles'), apiGet('/organizations')]);
    const fleetVehicles = vehicles.filter(v => {
      const org = orgs.find(o => o.id === v.organizationId);
      return org && org.type === 'FLEET_MANAGER';
    });
    
    document.getElementById('vehiculesTable').innerHTML = fleetVehicles.length ? fleetVehicles.map(v => {
      const org = orgs.find(o => o.id === v.organizationId);
      return `<tr>
        <td><strong>${v.plate}</strong></td>
        <td>${v.model || 'N/A'}</td>
        <td>${v.year || '-'}</td>
        <td>${v.currentKm?.toLocaleString() || 0} km</td>
        <td>${v.nextMaintenanceKm?.toLocaleString() || 3000} km</td>
        <td>${org ? org.name : 'N/A'}</td>
        <td><span class="badge ${v.status === 'active' ? 'badge-success' : 'badge-warning'}">${v.status || 'active'}</span></td>
        <td class="action-btns">
          <button class="btn-sm btn-view" onclick="viewVehicle('${v.id}')">👁</button>
          <button class="btn-sm btn-edit" onclick="editVehicle('${v.id}')">✏️</button>
        </td></tr>`;
    }).join('') : '<tr><td colspan="8">Aucun véhicule</td></tr>';
  } catch(e) {}
}
