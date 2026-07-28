// DAGOO'S - Maintenance Flotte
async function init_flotte_maintenance() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="topbar"><h1>🔧 Maintenance</h1>
      <button class="btn btn-primary btn-sm" onclick="addMaintenance()">➕ Nouvel entretien</button>
    </div>
    <div class="card"><table><thead><tr>
      <th>Date</th><th>Véhicule</th><th>Type</th><th>Km</th><th>Coût</th><th>Prestataire</th><th>Actions</th>
    </tr></thead><tbody id="maintenanceTable"></tbody></table></div>`;
  loadMaintenance();
}

async function loadMaintenance() {
  try {
    const maintenances = await apiGet('/maintenance');
    document.getElementById('maintenanceTable').innerHTML = maintenances.length ? maintenances.map(m => `
      <tr>
        <td>${new Date(m.date).toLocaleDateString('fr-FR')}</td>
        <td>${m.vehicle?.plate || 'N/A'}</td>
        <td>${m.type || 'N/A'}</td>
        <td>${m.km?.toLocaleString() || 0} km</td>
        <td>${m.cost?.toLocaleString() || 0} Ar</td>
        <td>${m.prestataire || '-'}</td>
        <td class="action-btns">
          <button class="btn-sm btn-view" onclick="viewMaintenance('${m.id}')">👁</button>
        </td></tr>`).join('') : '<tr><td colspan="7">Aucun entretien</td></tr>';
  } catch(e) {}
}
