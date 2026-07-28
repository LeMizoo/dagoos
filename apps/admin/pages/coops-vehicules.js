function init_coops_vehicules() {
    document.getElementById('mainInner').innerHTML = '<div class="topbar"><h1>🏢 Véhicules des Coopératives</h1></div>' +
        '<div class="card"><table><thead><tr><th>Immatriculation</th><th>Modèle</th><th>Coopérative</th><th>Km</th><th>Statut</th></tr></thead><tbody id="cvTable"><tr><td colspan="5">Chargement...</td></tr></tbody></table></div>';
    setTimeout(loadCV, 100);
}

async function loadCV() {
    var vehicles = await apiGet('/vehicles');
    var orgs = await apiGet('/organizations');
    var coops = orgs.filter(function(o) { return o.type === 'COOPERATIVE'; });
    var coopVehicles = vehicles.filter(function(v) { return coops.find(function(c) { return c.id === v.organizationId; }); });
    
    document.getElementById('cvTable').innerHTML = coopVehicles.length ? coopVehicles.map(function(v) {
        var org = orgs.find(function(o) { return o.id === v.organizationId; });
        return '<tr><td><strong>' + (v.plate || 'N/A') + '</strong></td><td>' + (v.model || 'N/A') + '</td><td>' + (org ? org.name : 'N/A') + '</td><td>' + (v.currentKm || 0).toLocaleString() + ' km</td><td>' + (v.status || 'active') + '</td></tr>';
    }).join('') : '<tr><td colspan="5">Aucun véhicule</td></tr>';
}
