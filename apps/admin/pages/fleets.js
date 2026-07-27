function init_fleets() {
    document.getElementById('mainInner').innerHTML = '<div class="topbar"><h1>🚛 Flottes</h1><div style="display:flex;gap:8px;"><button class="btn btn-primary btn-sm" onclick="addOrg(\'FLEET_MANAGER\')">➕ Ajouter</button><button class="btn btn-sm" style="background:var(--border);" onclick="exportCSV(\'fleets\')"><i class="fas fa-download"></i> CSV</button></div></div><div class="card"><table><thead><tr><th>Nom</th><th>Code</th><th>Email</th><th>Plan</th><th>Véhicules</th><th>Chauffeurs</th><th>Propriétaires</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="fleetsTable"></tbody></table></div>';
    loadFleets();
}

async function loadFleets() {
    var orgs = await apiGet('/organizations');
    var drivers = await apiGet('/drivers');
    var vehicles = await apiGet('/vehicles');
    var proprietaires = await apiGet('/proprietaires');
    var fleets = orgs.filter(function(o) { return o.type === 'FLEET_MANAGER'; });
    var statuses = ['active', 'pending', 'suspended', 'rejected'];
    var statusLabels = { active: 'Actif', pending: 'En attente', suspended: 'Suspendu', rejected: 'Rejete' };
    
    document.getElementById('fleetsTable').innerHTML = fleets.map(function(o) {
        var nbDrivers = drivers.filter(function(d) { return d.organization && d.organization.code === o.code; }).length;
        var nbVehicles = vehicles.filter(function(v) { return v.organizationId === o.id; }).length;
        var nbProps = proprietaires.filter(function(p) { return p.organizationId === o.id; }).length;
        var ca = 0; // À calculer depuis les courses
        
        var statusSelect = '<select onchange="changeStatus(\'' + o.id + '\', this.value)" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);font-size:11px;cursor:pointer;">';
        statuses.forEach(function(s) {
            statusSelect += '<option value="' + s + '" ' + (o.status === s ? 'selected' : '') + '>' + (statusLabels[s] || s) + '</option>';
        });
        statusSelect += '</select>';
        
        var actions = '<button class="btn-sm btn-view" onclick="viewOrgDetail(\'' + o.id + '\')">👁 Détail</button>';
        actions += '<button class="btn-sm btn-edit" onclick="editOrg(\'' + o.id + '\')">✏️</button>';
        
        return '<tr><td><strong>' + o.name + '</strong></td><td><code>FL-' + o.code + '</code></td><td>' + (o.email || 'N/A') + '</td><td>' + (o.plan || 'Freemium') + '</td><td><span class="badge badge-info">' + nbVehicles + '</span></td><td><span class="badge badge-info">' + nbDrivers + '</span></td><td><span class="badge badge-info">' + nbProps + '</span></td><td>' + statusSelect + '</td><td class="action-btns">' + actions + '</td></tr>';
    }).join('') || '<tr><td colspan="9">Aucune flotte</td></tr>';
}

function viewOrgDetail(id) {
    apiGet('/organizations').then(function(orgs) {
        var o = orgs.find(function(x) { return x.id === id; });
        if (!o) return;
        apiGet('/drivers').then(function(drivers) {
            apiGet('/vehicles').then(function(vehicles) {
                apiGet('/proprietaires').then(function(props) {
                    var myDrivers = drivers.filter(function(d) { return d.organization && d.organization.code === o.code; });
                    var info = '<h4>' + o.name + ' (' + (o.plan || 'Freemium') + ')</h4>';
                    info += '<p><strong>Email:</strong> ' + (o.email || 'N/A') + '</p>';
                    info += '<p><strong>Statut:</strong> ' + o.status + '</p>';
                    info += '<p><strong>Chauffeurs:</strong> ' + myDrivers.length + '</p>';
                    info += '<p><strong>Véhicules:</strong> ' + vehicles.length + '</p>';
                    info += '<p><strong>Propriétaires:</strong> ' + props.length + '</p>';
                    if (myDrivers.length) {
                        info += '<hr><h5>Chauffeurs</h5>';
                        myDrivers.forEach(function(d) {
                            info += '<p>🛵 ' + d.driverCode + ' - ' + (d.user ? d.user.name : 'N/A') + ' (' + d.status + ')</p>';
                        });
                    }
                    showModal('Détail ' + o.name, info);
                });
            });
        });
    });
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
