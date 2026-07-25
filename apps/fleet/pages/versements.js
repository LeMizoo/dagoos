function init_versements() {
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
            '<h1><i class="fas fa-hand-holding-usd"></i> Versements</h1>' +
            '<button class="btn btn-primary" onclick="alert(\'Fonction à venir\')"><i class="fas fa-check"></i> Valider les versements</button>' +
        '</div>' +
        '<div class="card"><table><thead><tr><th>Chauffeur</th><th>Véhicule</th><th>CA brut</th><th>Commission</th><th>Dépenses</th><th>Net à verser</th></tr></thead><tbody id="versementsTable"><tr><td colspan="6">Chargement...</td></tr></tbody></table></div>';
    loadVersements();
}

async function loadVersements() {
    var drivers = await apiGet('/drivers');
    var vehicles = await apiGet('/vehicles');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var myDrivers = drivers.filter(function(d) { return d.organization && d.organization.email === user.email; });
    
    document.getElementById('versementsTable').innerHTML = myDrivers.map(function(d) {
        var moto = vehicles.find(function(v) { return v.id === d.vehicleId; });
        return '<tr><td><strong>' + (d.user ? d.user.name : 'N/A') + '</strong></td>' +
            '<td>' + (moto ? moto.plate : 'Non assigné') + '</td>' +
            '<td>0 Ar</td><td>0 Ar</td><td>0 Ar</td><td><strong>0 Ar</strong></td></tr>';
    }).join('') || '<tr><td colspan="6">Aucun chauffeur</td></tr>';
}
