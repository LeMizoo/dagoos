function init_fleets() {
    document.getElementById('mainInner').innerHTML = '<div class="topbar"><h1><i class="fas fa-truck"></i> Flottes</h1><div style="display:flex;gap:8px;"><button class="btn btn-primary btn-sm" onclick="addOrg(\'FLEET_MANAGER\')"><i class="fas fa-plus"></i> Ajouter</button><button class="btn btn-sm" style="background:var(--border);" onclick="exportCSV(\'fleets\')"><i class="fas fa-download"></i> CSV</button></div></div><div class="card"><table><thead><tr><th>Nom</th><th>Code</th><th>Email</th><th>Plan</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="fleetsTable"></tbody></table></div>';
    loadFleets();
}

async function loadFleets() {
    var orgs = await apiGet('/organizations');
    var drivers = await apiGet('/drivers');
    var fleets = orgs.filter(function(o) { return o.type === 'FLEET_MANAGER'; });
    var statuses = ['active', 'pending', 'suspended', 'rejected'];
    var statusLabels = { active: 'Actif', pending: 'En attente', suspended: 'Suspendu', rejected: 'Rejete' };
    
    document.getElementById('fleetsTable').innerHTML = fleets.map(function(o) {
        var count = drivers.filter(function(d) { return d.organization && d.organization.code === o.code; }).length;
        var statusBadge = o.status === 'active' ? 'badge-success' : o.status === 'pending' ? 'badge-warning' : o.status === 'suspended' ? 'badge-danger' : 'badge-danger';
        
        var statusSelect = '<select onchange="changeStatus(\'' + o.id + '\', this.value)" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);font-size:11px;cursor:pointer;">';
        statuses.forEach(function(s) {
            statusSelect += '<option value="' + s + '" ' + (o.status === s ? 'selected' : '') + '>' + (statusLabels[s] || s) + '</option>';
        });
        statusSelect += '</select>';
        
        var actions = '<button class="btn-sm btn-view" onclick="viewOrg(\'' + o.id + '\')"><i class="fas fa-eye"></i></button>';
        actions += '<button class="btn-sm btn-edit" onclick="editOrg(\'' + o.id + '\')"><i class="fas fa-edit"></i></button>';
        
        return '<tr><td><strong>' + o.name + '</strong></td><td><code>FL-' + o.code + '</code></td><td>' + (o.email || 'N/A') + '</td><td>' + (o.plan || 'Freemium') + '</td><td>' + statusSelect + '</td><td class="action-btns">' + actions + '</td></tr>';
    }).join('') || '<tr><td colspan="6">Aucune flotte</td></tr>';
}

function changeStatus(id, newStatus) {
    if (confirm('Changer le statut en ' + newStatus + ' ?')) {
        apiPatch('/organizations/' + id + '/status', { status: newStatus }).then(function() {
            loadFleets();
        });
    } else {
        loadFleets();
    }
}
