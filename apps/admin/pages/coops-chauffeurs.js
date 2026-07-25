function init_coops_chauffeurs() {
    document.getElementById('mainInner').innerHTML = '<div class="topbar"><h1><i class="fas fa-users"></i> Chauffeurs des Coopératives</h1></div>' +
        '<div class="card"><table><thead><tr><th>Code</th><th>Nom</th><th>Coopérative</th><th>Statut</th></tr></thead><tbody id="ccTable"><tr><td colspan="4">Chargement...</td></tr></tbody></table></div>';
    loadCC();
}

async function loadCC() {
    var drivers = await apiGet('/drivers');
    var orgs = await apiGet('/organizations');
    var coops = orgs.filter(function(o) { return o.type === 'COOPERATIVE'; });
    var coopDrivers = drivers.filter(function(d) { return d.organization && coops.find(function(c) { return c.id === d.organization.id; }); });
    
    document.getElementById('ccTable').innerHTML = coopDrivers.length ? coopDrivers.map(function(d) {
        return '<tr><td><code>' + d.driverCode + '</code></td><td><strong>' + (d.user ? d.user.name : 'N/A') + '</strong></td><td>' + (d.organization ? d.organization.name : 'N/A') + '</td><td>' + d.status + '</td></tr>';
    }).join('') : '<tr><td colspan="4">Aucun chauffeur</td></tr>';
}
