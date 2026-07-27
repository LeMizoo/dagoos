function init_drivers() {
    var main = document.getElementById('mainInner');
    main.innerHTML = '<div class="topbar"><h1>🏍️ Chauffeurs</h1></div><div class="card"><table><thead><tr><th>Code</th><th>Nom</th><th>Organisation</th><th>Statut</th></tr></thead><tbody id="driversTable"></tbody></table></div>';
    loadDrivers();
}

async function loadDrivers() {
    var drivers = await apiGet('/drivers');
    document.getElementById('driversTable').innerHTML = drivers.map(function(d) {
        return '<tr><td><code>' + d.driverCode + '</code></td><td>' + (d.user ? d.user.name : 'N/A') + '</td><td>' + (d.organization ? d.organization.name : 'N/A') + '</td><td>' + d.status + '</td></tr>';
    }).join('') || '<tr><td colspan="4">Aucun chauffeur</td></tr>';
}
