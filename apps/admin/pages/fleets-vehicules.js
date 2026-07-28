function init_fleets_vehicules() {
    document.getElementById('mainInner').innerHTML = '<div class="topbar"><h1>🚛 Véhicules des Flottes</h1></div>' +
        '<div class="card"><table><thead><tr><th>Immatriculation</th><th>Modèle</th><th>Flotte</th><th>Km</th><th>Vidange</th><th>Assurance</th><th>Statut</th></tr></thead><tbody id="fvTable"><tr><td colspan="7">Chargement...</td></tr></tbody></table></div>';
    setTimeout(loadFV, 100);
}

async function loadFV() {
    var vehicles = await apiGet('/vehicles');
    var orgs = await apiGet('/organizations');
    var fleets = orgs.filter(function(o) { return o.type === 'FLEET_MANAGER'; });
    var fleetVehicles = vehicles.filter(function(v) { return fleets.find(function(f) { return f.id === v.organizationId; }); });
    
    document.getElementById('fvTable').innerHTML = fleetVehicles.length ? fleetVehicles.map(function(v) {
        var org = orgs.find(function(o) { return o.id === v.organizationId; });
        var restant = (v.nextMaintenanceKm || 0) - (v.currentKm || 0);
        var vidangeBadge = restant <= 0 ? 'badge-danger' : restant <= 500 ? 'badge-warning' : 'badge-success';
        return '<tr><td><strong>' + (v.plate || 'N/A') + '</strong></td><td>' + (v.model || 'N/A') + '</td><td>' + (org ? org.name : 'N/A') + '</td><td>' + (v.currentKm || 0).toLocaleString() + ' km</td><td><span class="badge ' + vidangeBadge + '">' + restant.toLocaleString() + ' km</span></td><td>' + (v.insuranceDate || 'N/A') + '</td><td>' + (v.status || 'active') + '</td></tr>';
    }).join('') : '<tr><td colspan="7">Aucun véhicule</td></tr>';
}
