function init_drivers() {
    var main = document.getElementById('mainContent');
    main.innerHTML = '<div class="topbar"><h1>🛵 Chauffeurs</h1></div><div class="card"><table><thead><tr><th>Code</th><th>Nom</th><th>Statut</th></tr></thead><tbody id="driversTable"></tbody></table></div>';
    loadDrivers();
}

async function loadDrivers() {
    var drivers = await apiGet('/drivers');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var myDrivers = drivers.filter(function(d) { return d.organization && d.organization.email === user.email; });
    document.getElementById('driversTable').innerHTML = myDrivers.map(function(d) {
        return '<tr><td><code>' + d.driverCode + '</code></td><td>' + (d.user ? d.user.name : 'N/A') + '</td><td>' + d.status + '</td></tr>';
    }).join('') || '<tr><td colspan="3">Aucun chauffeur</td></tr>';
}
