function init_coops() {
    document.getElementById('mainInner').innerHTML = '<div class="topbar"><h1>🏢 Cooperatives</h1><div style="display:flex;gap:8px;"><button class="btn btn-primary btn-sm" onclick="addOrg(\'COOPERATIVE\')">➕ Ajouter</button><button class="btn btn-sm" style="background:var(--border);" onclick="exportCSV(\'coops\')"><i class="fas fa-download"></i> CSV</button></div></div><div class="card"><table><thead><tr><th>Nom</th><th>Code</th><th>Email</th><th>Plan</th><th>Véhicules</th><th>Chauffeurs</th><th>Propriétaires</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="coopsTable"></tbody></table></div>';
    loadCoops();
}

async function loadCoops() {
    var orgs = await apiGet('/organizations');
    var drivers = await apiGet('/drivers');
    var vehicles = await apiGet('/vehicles');
    var coops = orgs.filter(function(o) { return o.type === 'COOPERATIVE'; });
    var statuses = ['active', 'pending', 'suspended', 'rejected'];
    var statusLabels = { active: 'Actif', pending: 'En attente', suspended: 'Suspendu', rejected: 'Rejete' };
    
    document.getElementById('coopsTable').innerHTML = coops.map(function(o) {
        var myDrivers = drivers.filter(function(d) { return d.organization && d.organization.code === o.code; });
        var myVehicles = vehicles.filter(function(v) { return v.organization && v.organization.code === o.code; });
        var nbDrivers = myDrivers.length;
        var nbVehicles = myVehicles.length;
        var nbProps = [...new Set(myVehicles.map(function(v) { return v.ownerName; }).filter(Boolean))].length;
        
        var statusSelect = '<select onchange="changeCoopStatus(\'' + o.id + '\', this.value)" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);font-size:11px;cursor:pointer;">';
        statuses.forEach(function(s) {
            statusSelect += '<option value="' + s + '" ' + (o.status === s ? 'selected' : '') + '>' + (statusLabels[s] || s) + '</option>';
        });
        statusSelect += '</select>';
        
        var actions = '<button class="btn-sm btn-view" onclick="viewCoop(\'' + o.id + '\')">👁</button>';
        actions += '<button class="btn-sm btn-edit" onclick="editOrg(\'' + o.id + '\')">✏️</button>';
        
        return '<tr><td><strong>' + o.name + '</strong></td><td><code>CO-' + o.code + '</code></td><td>' + (o.email || 'N/A') + '</td><td>' + (o.plan || 'Freemium') + '</td><td><span class="badge badge-info">' + nbVehicles + '</span></td><td><span class="badge badge-info">' + nbDrivers + '</span></td><td><span class="badge badge-info">' + nbProps + '</span></td><td>' + statusSelect + '</td><td class="action-btns">' + actions + '</td></tr>';
    }).join('') || '<tr><td colspan="9">Aucune cooperative</td></tr>';
}

function changeCoopStatus(id, newStatus) {
    if (confirm('Changer le statut en ' + newStatus + ' ?')) {
        apiPatch('/organizations/' + id + '/status', { status: newStatus })
            .then(function() { loadCoops(); });
    }
}

async function viewCoop(id) {
    var orgs = await apiGet('/organizations');
    var o = orgs.find(function(x) { return x.id === id; });
    if (!o) return;
    
    var drivers = await apiGet('/drivers');
    var vehicles = await apiGet('/vehicles');
    var myDrivers = drivers.filter(function(d) { return d.organization && d.organization.code === o.code; });
    var myVehicles = vehicles.filter(function(v) { return v.organization && v.organization.code === o.code; });
    var props = [...new Set(myVehicles.map(function(v) { return v.ownerName; }).filter(Boolean))];
    
    var info = '<h4>' + o.name + ' (' + (o.plan || 'Freemium') + ')</h4>';
    info += '<p><strong>Code:</strong> CO-' + o.code + '</p>';
    info += '<p><strong>Email:</strong> ' + (o.email || 'N/A') + '</p>';
    info += '<p><strong>Statut:</strong> ' + o.status + '</p>';
    info += '<p><strong>Chauffeurs:</strong> ' + myDrivers.length + '</p>';
    info += '<p><strong>Véhicules:</strong> ' + myVehicles.length + '</p>';
    info += '<p><strong>Propriétaires:</strong> ' + props.length + '</p>';
    
    if (myDrivers.length > 0) {
        info += '<hr><h5>Chauffeurs</h5>';
        myDrivers.forEach(function(d) {
            info += '<p>🛵 ' + d.driverCode + ' - ' + (d.user ? d.user.name : 'N/A') + ' (' + d.status + ')</p>';
        });
    }
    
    showModal(o.name, info);
}
