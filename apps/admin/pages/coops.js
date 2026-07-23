function init_coops() {
    var main = document.getElementById('mainInner');
    main.innerHTML = '<div class="topbar"><h1><i class="fas fa-building"></i> Coopératives</h1><button class="btn btn-primary btn-sm" onclick="addOrg(\'COOPERATIVE\')"><i class="fas fa-plus"></i> Ajouter</button></div><div class="card"><table><thead><tr><th>Nom</th><th>Code</th><th>Email</th><th>Plan</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="coopsTable"></tbody></table></div>';
    loadCoops();
}

async function loadCoops() {
    var orgs = await apiGet('/organizations');
    var drivers = await apiGet('/drivers');
    var coops = orgs.filter(function(o) { return o.type === 'COOPERATIVE'; });
    document.getElementById('coopsTable').innerHTML = coops.map(function(o) {
        var count = drivers.filter(function(d) { return d.organization && d.organization.code === o.code; }).length;
        var statusBadge = o.status === 'active' ? 'badge-success' : 'badge-warning';
        return '<tr><td><strong>' + o.name + '</strong></td><td><code>CO-' + o.code + '</code></td><td>' + (o.email || 'N/A') + '</td><td>' + (o.plan || 'Freemium') + '</td><td><span class="badge ' + statusBadge + '">' + o.status + '</span></td><td class="action-btns"><button class="btn-sm btn-view" onclick="viewOrg(\'' + o.id + '\')"><i class="fas fa-eye"></i></button><button class="btn-sm btn-edit" onclick="editOrg(\'' + o.id + '\')"><i class="fas fa-edit"></i></button></td></tr>';
    }).join('');
}
