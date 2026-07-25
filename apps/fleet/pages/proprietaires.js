function init_proprietaires() {
    var main = document.getElementById('mainContent');
    main.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
        '<h1><i class="fas fa-building"></i> Propriétaires</h1></div>' +
        '<div class="card"><table><thead><tr><th>Nom</th><th>Email</th><th>Téléphone</th><th>Plan</th><th>Statut</th></tr></thead><tbody id="propTable"></tbody></table></div>';
    loadProprietaires();
}

async function loadProprietaires() {
    var orgs = await apiGet('/organizations');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var org = orgs.find(function(o) { return o.email === user.email; });
    document.getElementById('propTable').innerHTML = org ? '<tr><td><strong>' + org.name + '</strong></td><td>' + (org.email || 'N/A') + '</td><td>' + (org.phone || 'N/A') + '</td><td>' + (org.plan || 'Freemium') + '</td><td>' + org.status + '</td></tr>' : '<tr><td colspan="5">Aucun</td></tr>';
}
