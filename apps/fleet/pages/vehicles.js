function init_vehicles() {
    var main = document.getElementById('mainContent');
    main.innerHTML = '<div class="topbar"><h1><i class="fas fa-motorcycle"></i> Véhicules</h1>' +
        '<button class="btn btn-primary" onclick="showAddVehicle()"><i class="fas fa-plus"></i> Nouveau véhicule</button></div>' +
        '<div class="card"><div class="card-header"><h3><i class="fas fa-filter"></i> Filtres</h3></div>' +
        '<div style="padding:12px;display:flex;gap:10px;flex-wrap:wrap;">' +
            '<select id="filterStatus" style="padding:8px;border:1px solid var(--border);border-radius:6px;"><option value="">Tous statuts</option><option value="active">Actif</option><option value="maintenance">En maintenance</option><option value="inactive">Inactif</option></select>' +
            '<select id="filterVidange" style="padding:8px;border:1px solid var(--border);border-radius:6px;"><option value="">Toutes vidanges</option><option value="ok">OK</option><option value="bientot">À venir (<500km)</option><option value="urgent">Urgente</option></select>' +
            '<input type="text" id="searchVehicle" placeholder="Rechercher..." style="padding:8px;border:1px solid var(--border);border-radius:6px;">' +
            '<button class="btn btn-sm btn-primary" onclick="filterVehicles()"><i class="fas fa-search"></i> Filtrer</button>' +
        '</div></div>' +
        '<div class="card"><table><thead><tr><th>Immatriculation</th><th>Marque/Modèle</th><th>Km</th><th>Vidange</th><th>Assurance</th><th>Chauffeur</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="vehiclesTable"><tr><td colspan="8">Chargement...</td></tr></tbody></table></div>';
    loadVehicles();
}

var vehiclesData = [];

async function loadVehicles() {
    try {
        var res = await apiGet('/vehicles');
        vehiclesData = res || [];
        renderVehicles(vehiclesData);
    } catch(e) { document.getElementById('vehiclesTable').innerHTML = '<tr><td colspan="8">Erreur</td></tr>'; }
}

function renderVehicles(data) {
    var html = '';
    if (!data.length) { html = '<tr><td colspan="8" style="text-align:center;">Aucun véhicule</td></tr>'; }
    else {
        data.forEach(function(v) {
            var vidangeBadge = 'badge-success';
            var vidangeText = 'OK';
            if (v.nextMaintenanceKm && v.currentKm) {
                var restant = v.nextMaintenanceKm - v.currentKm;
                if (restant <= 0) { vidangeBadge = 'badge-danger'; vidangeText = '⚠️ Dépassée'; }
                else if (restant <= 500) { vidangeBadge = 'badge-warning'; vidangeText = '⚠️ ' + restant + ' km'; }
                else { vidangeText = restant + ' km'; }
            }
            var assuranceBadge = v.insuranceValid ? 'badge-success' : 'badge-danger';
            var assuranceText = v.insuranceValid ? '✅ Valide' : '❌ Expirée';
            var statusBadge = v.status === 'active' ? 'badge-success' : v.status === 'maintenance' ? 'badge-warning' : 'badge-danger';
            
            html += '<tr><td><strong>' + (v.plate || 'N/A') + '</strong></td><td>' + (v.model || 'N/A') + '</td><td>' + (v.currentKm || 0) + '</td><td><span class="badge ' + vidangeBadge + '">' + vidangeText + '</span></td><td><span class="badge ' + assuranceBadge + '">' + assuranceText + '</span></td><td>' + (v.driverName || 'Non assigné') + '</td><td><span class="badge ' + statusBadge + '">' + (v.status || 'active') + '</span></td><td><button class="btn-sm btn-view" onclick="viewVehicle(\'' + v.id + '\')"><i class="fas fa-eye"></i></button><button class="btn-sm btn-edit" onclick="editVehicle(\'' + v.id + '\')"><i class="fas fa-edit"></i></button></td></tr>';
        });
    }
    document.getElementById('vehiclesTable').innerHTML = html;
}

function filterVehicles() {
    var statusFilter = document.getElementById('filterStatus').value;
    var vidangeFilter = document.getElementById('filterVidange').value;
    var search = document.getElementById('searchVehicle').value.toLowerCase();
    var filtered = vehiclesData.filter(function(v) {
        if (statusFilter && v.status !== statusFilter) return false;
        if (search && !(v.plate || '').toLowerCase().includes(search) && !(v.model || '').toLowerCase().includes(search)) return false;
        return true;
    });
    renderVehicles(filtered);
}

function showAddVehicle() {
    var h = '<div class="form-group"><label>Immatriculation</label><input id="addPlate"></div>';
    h += '<div class="form-group"><label>Marque/Modèle</label><input id="addModel"></div>';
    h += '<div class="form-group"><label>Année</label><input type="number" id="addYear" value="2024"></div>';
    h += '<div class="form-group"><label>Km actuels</label><input type="number" id="addKm" value="0"></div>';
    h += '<div class="form-group"><label>Prochaine vidange (km)</label><input type="number" id="addVidange" value="3000"></div>';
    h += '<div class="form-group"><label>Date fin assurance</label><input type="date" id="addAssurance"></div>';
    showModal('Nouveau véhicule', h, function() {
        apiPost('/vehicles', {
            plate: document.getElementById('addPlate').value,
            model: document.getElementById('addModel').value,
            year: document.getElementById('addYear').value,
            currentKm: document.getElementById('addKm').value,
            nextMaintenanceKm: document.getElementById('addVidange').value
        }).then(function() { closeModal(); loadVehicles(); });
    });
}

function viewVehicle(id) {
    var v = vehiclesData.find(function(x) { return x.id === id; });
    if (!v) return;
    showModal(v.plate, '<p><strong>Modèle:</strong> ' + (v.model || 'N/A') + '</p><p><strong>Km:</strong> ' + (v.currentKm || 0) + '</p><p><strong>Statut:</strong> ' + (v.status || 'active') + '</p>');
}

function editVehicle(id) {
    var v = vehiclesData.find(function(x) { return x.id === id; });
    if (!v) return;
    var h = '<div class="form-group"><label>Km actuels</label><input type="number" id="editKm" value="' + (v.currentKm || 0) + '"></div>';
    h += '<div class="form-group"><label>Statut</label><select id="editStatus"><option ' + (v.status === 'active' ? 'selected' : '') + '>active</option><option ' + (v.status === 'maintenance' ? 'selected' : '') + '>maintenance</option><option ' + (v.status === 'inactive' ? 'selected' : '') + '>inactive</option></select></div>';
    showModal('Modifier ' + v.plate, h, function() {
        apiPut('/vehicles/' + id, {
            currentKm: document.getElementById('editKm').value,
            status: document.getElementById('editStatus').value
        }).then(function() { closeModal(); loadVehicles(); });
    });
}
