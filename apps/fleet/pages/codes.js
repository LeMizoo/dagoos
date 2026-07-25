function init_codes() {
    setTimeout(function() { loadCodes(); }, 100);
    var main = document.getElementById('mainContent');
    main.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
        '<h1><i class="fas fa-key"></i> Codes d\'accès chauffeurs</h1>' +
        '<button class="btn btn-primary" onclick="renouvelerCodes()"><i class="fas fa-sync-alt"></i> Renouveler tous les codes</button></div>' +
        '<div class="card"><table><thead><tr><th>Nom</th><th>Téléphone</th><th>Code</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="codesTable"></tbody></table></div>';
    loadCodes();
}

async function loadCodes() {
    var drivers = await apiGet('/drivers');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var myDrivers = drivers.filter(function(d) { return d.organization && d.organization.email === user.email; });
    document.getElementById('codesTable').innerHTML = myDrivers.map(function(d) {
        return '<tr><td><strong>' + (d.user ? d.user.name : 'N/A') + '</strong></td><td>' + (d.user ? d.user.phone : 'N/A') + '</td><td><code style="font-size:16px;letter-spacing:2px;">' + d.driverCode + '</code></td><td><span class="badge badge-success">Actif</span></td><td><button class="btn-sm btn-edit">Nouveau code</button></td></tr>';
    }).join('') || '<tr><td colspan="5">Aucun chauffeur</td></tr>';
}

function renouvelerCodes() {
    if (confirm('Renouveler tous les codes ?')) {
        alert('Codes renouvelés ! (simulation)');
        loadCodes();
    }
}
