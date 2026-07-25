function init_fleets_chauffeurs() {
    document.getElementById('mainInner').innerHTML = '<div class="topbar"><h1><i class="fas fa-users"></i> Chauffeurs des Flottes</h1></div>' +
        '<div class="card"><table><thead><tr><th>Code</th><th>Nom</th><th>Flotte</th><th>Véhicule</th><th>Propriétaire</th><th>Statut</th></tr></thead><tbody id="fcTable"><tr><td colspan="6">Chargement...</td></tr></tbody></table></div>';
    loadFC();
}

async function loadFC() {
    var drivers = await apiGet('/drivers');
    var orgs = await apiGet('/organizations');
    var vehicles = await apiGet('/vehicles');
    var props = await apiGet('/proprietaires');
    var fleets = orgs.filter(function(o) { return o.type === 'FLEET_MANAGER'; });
    var fleetDrivers = drivers.filter(function(d) { return d.organization && fleets.find(function(f) { return f.id === d.organization.id; }); });
    
    document.getElementById('fcTable').innerHTML = fleetDrivers.length ? fleetDrivers.map(function(d) {
        var org = d.organization;
        var moto = vehicles.find(function(v) { return v.id === d.vehicleId; });
        var prop = props.find(function(p) { return p.id === d.proprietaireId; });
        return '<tr><td><code>' + d.driverCode + '</code></td><td><strong>' + (d.user ? d.user.name : 'N/A') + '</strong></td><td>' + (org ? org.name : 'N/A') + '</td><td>' + (moto ? moto.plate : 'Non assigné') + '</td><td>' + (prop ? prop.name : '-') + '</td><td>' + d.status + '</td></tr>';
    }).join('') : '<tr><td colspan="6">Aucun chauffeur</td></tr>';
}
