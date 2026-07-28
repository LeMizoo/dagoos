// DAGOO'S - Tous les chauffeurs
async function init_chauffeurs() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="topbar"><h1>🛵 Tous les chauffeurs</h1></div>
    <div class="card"><table><thead><tr>
      <th>Code</th><th>Nom</th><th>Organisation</th><th>Véhicule</th><th>Status</th><th>Actions</th>
    </tr></thead><tbody id="driversTable"></tbody></table></div>`;
  loadDrivers();
}

async function loadDrivers() {
  try {
    const drivers = await apiGet('/drivers');
    document.getElementById('driversTable').innerHTML = drivers.length ? drivers.map(d => `
      <tr>
        <td><code>${d.driverCode}</code></td>
        <td>${d.user?.name || 'N/A'}</td>
        <td>${d.organization?.name || 'N/A'}</td>
        <td>${d.vehicle?.plate || 'Non assigné'}</td>
        <td>${d.status}</td>
        <td class="action-btns"><button class="btn-sm btn-view" onclick="viewDriver('${d.id}')">👁</button></td></tr>`).join('') : '<tr><td colspan="6">Aucun chauffeur</td></tr>';
  } catch(e) {}
}
