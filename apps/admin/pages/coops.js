function init_coops() {
    document.getElementById('mainInner').innerHTML = '<div class="topbar"><h1><i class="fas fa-building"></i> Cooperatives</h1><div style="display:flex;gap:8px;"><button class="btn btn-primary btn-sm" onclick="addOrg(\'COOPERATIVE\')"><i class="fas fa-plus"></i> Ajouter</button><button class="btn btn-sm" style="background:var(--border);" onclick="exportCSV(\'coops\')"><i class="fas fa-download"></i> CSV</button></div></div><div class="card"><table><thead><tr><th>Nom</th><th>Code</th><th>Email</th><th>Plan</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="coopsTable"></tbody></table></div>';
    loadCoops();
}

async function loadCoops() {
    var orgs = await apiGet('/organizations');
    var drivers = await apiGet('/drivers');
    var coops = orgs.filter(function(o) { return o.type === 'COOPERATIVE'; });
    document.getElementById('coopsTable').innerHTML = coops.map(function(o) {
        var count = drivers.filter(function(d) { return d.organization && d.organization.code === o.code; }).length;
        var statusBadge = o.status === 'active' ? 'badge-success' : o.status === 'pending' ? 'badge-warning' : o.status === 'suspended' ? 'badge-danger' : 'badge-danger';
        var actions = '<button class="btn-sm btn-view" onclick="viewOrg(\'' + o.id + '\')"><i class="fas fa-eye"></i></button>';
        actions += '<button class="btn-sm btn-edit" onclick="editOrg(\'' + o.id + '\')"><i class="fas fa-edit"></i></button>';
        if (o.status === 'pending') {
            actions += '<button class="btn-sm btn-success" onclick="validateOrg(\'' + o.id + '\')" title="Valider"><i class="fas fa-check"></i></button>';
            actions += '<button class="btn-sm btn-suspend" onclick="rejectOrg(\'' + o.id + '\')" title="Refuser"><i class="fas fa-times"></i></button>';
        }
        if (o.status === 'active') {
            actions += '<button class="btn-sm btn-suspend" onclick="toggleOrgStatus(\'' + o.id + '\',\'active\')" title="Suspendre"><i class="fas fa-ban"></i></button>';
        }
        if (o.status === 'suspended') {
            actions += '<button class="btn-sm btn-success" onclick="toggleOrgStatus(\'' + o.id + '\',\'suspended\')" title="Reactive"><i class="fas fa-check"></i></button>';
        }
        if (o.status === 'rejected') {
            actions += '<button class="btn-sm btn-success" onclick="validateOrg(\'' + o.id + '\')" title="Revalider"><i class="fas fa-undo"></i></button>';
        }
        return '<tr><td><strong>' + o.name + '</strong></td><td><code>CO-' + o.code + '</code></td><td>' + (o.email || 'N/A') + '</td><td>' + (o.plan || 'Freemium') + '</td><td><span class="badge ' + statusBadge + '">' + o.status + '</span></td><td class="action-btns">' + actions + '</td></tr>';
    }).join('') || '<tr><td colspan="6">Aucune cooperative</td></tr>';
}
