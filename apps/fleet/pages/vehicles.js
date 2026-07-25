function init_vehicles() {
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">' +
            '<h1 style="font-size:20px;"><i class="fas fa-véhiculercycle"></i> Gestion des véhicules</h1>' +
            '<button class="btn btn-primary" onclick="showAddVehicle()"><i class="fas fa-plus"></i> Nouvelle véhicule</button>' +
        '</div>' +
        
        // FILTRES
        '<div class="card" style="margin-bottom:14px;">' +
            '<div class="card-header"><h3><i class="fas fa-filter"></i> Filtres</h3></div>' +
            '<div style="padding:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">' +
                '<div><label style="font-size:11px;display:block;margin-bottom:2px;">Statut assurance</label><select id="filterAssurance" style="padding:8px;border:1px solid var(--border);border-radius:6px;"><option value="">Tous</option><option value="ok">Valide</option><option value="expire">Expirée</option><option value="bientot">Expire bientôt</option></select></div>' +
                '<div><label style="font-size:11px;display:block;margin-bottom:2px;">Statut vignette</label><select id="filterVignette" style="padding:8px;border:1px solid var(--border);border-radius:6px;"><option value="">Tous</option><option value="ok">Valide</option><option value="expire">Expirée</option><option value="bientot">Expire bientôt</option></select></div>' +
                '<div><label style="font-size:11px;display:block;margin-bottom:2px;">Vidange</label><select id="filterVidange" style="padding:8px;border:1px solid var(--border);border-radius:6px;"><option value="">Tous</option><option value="ok">OK</option><option value="bientot">À venir (<500 km)</option><option value="urgent">Urgente (dépassée)</option></select></div>' +
                '<div><label style="font-size:11px;display:block;margin-bottom:2px;">Recherche</label><input type="text" id="searchVehicle" placeholder="Immatriculation, marque..." style="padding:8px;border:1px solid var(--border);border-radius:6px;width:200px;"></div>' +
                '<button class="btn btn-sm btn-primary" onclick="filterVehicles()"><i class="fas fa-search"></i> Filtrer</button>' +
                '<button class="btn btn-sm" style="background:var(--border);" onclick="resetFilters()"><i class="fas fa-undo"></i> Réinitialiser</button>' +
            '</div>' +
        '</div>' +
        
        // LISTE véhiculeS
        '<div class="card">' +
            '<div class="card-header"><h3><i class="fas fa-list"></i> Parc véhicule</h3><span style="font-size:11px;color:var(--text2);" id="vehicleCount">- véhicule(s)</span></div>' +
            '<div style="overflow-x:auto;">' +
                '<table>' +
                    '<thead><tr><th>Immatriculation</th><th>Marque / Modèle</th><th>Chauffeur</th><th>Km actuels</th><th>Vidange</th><th>Assurance</th><th>Vignette</th><th>Actions</th></tr></thead>' +
                    '<tbody id="vehiclesTable"><tr><td colspan="8" style="text-align:center;padding:20px;">Chargement...</td></tr></tbody>' +
                '</table>' +
            '</div>' +
        '</div>' +
        
        // LÉGENDE
        '<div class="card" style="margin-top:14px;padding:14px;">' +
            '<h4 style="font-size:13px;margin-bottom:8px;"><i class="fas fa-info-circle"></i> Légende des statuts</h4>' +
            '<div style="display:flex;gap:15px;flex-wrap:wrap;font-size:11px;">' +
                '<div><span class="badge badge-success">✅ Valide</span> = En règle</div>' +
                '<div><span class="badge badge-warning">⚠️ Bientôt</span> = Expire dans moins de 30 jours</div>' +
                '<div><span class="badge badge-danger">⚠️ Dépassée</span> = Vidange dépassée</div>' +
                '<div><span class="badge" style="background:#c0392b;color:white;">❌ Expirée</span> = Date dépassée</div>' +
            '</div>' +
        '</div>';
    
    loadVehicles();
}

var allVehicles = [];
var allDriversData = [];

async function loadVehicles() {
    try {
        var res = await apiGet('/vehicles');
        allVehicles = res || [];
        var user = JSON.parse(localStorage.getItem("dagoos_user") || "{}");
        var orgs = await apiGet("/organizations");
        var org = orgs.find(function(o) { return o.email === user.email; });
        if (org) { allVehicles = allVehicles.filter(function(v) { return v.organizationId === org.id; }); }
        var drvRes = await apiGet('/drivers');
        allDriversData = drvRes || [];
        renderVehicles(allVehicles);
        document.getElementById('vehicleCount').textContent = allVehicles.length + ' véhicule(s)';
    } catch(e) {
        document.getElementById('vehiclesTable').innerHTML = '<tr><td colspan="8">Erreur de chargement</td></tr>';
    }
}

function renderVehicles(data) {
    if (!data.length) {
        document.getElementById('vehiclesTable').innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:var(--text2);">Aucune véhicule enregistrée</td></tr>';
        return;
    }
    
    var html = '';
    var today = new Date().toISOString().split('T')[0];
    
    data.forEach(function(v) {
        // Vidange
        var vidangeBadge = 'badge-success';
        var vidangeText = '✅ OK';
        if (v.nextMaintenanceKm && v.currentKm) {
            var restant = v.nextMaintenanceKm - v.currentKm;
            if (restant <= 0) { vidangeBadge = 'badge-danger'; vidangeText = '⚠️ Dépassée de ' + Math.abs(restant).toLocaleString() + ' km'; }
            else if (restant <= 500) { vidangeBadge = 'badge-warning'; vidangeText = '⚠️ ' + restant.toLocaleString() + ' km'; }
            else { vidangeText = '✅ ' + restant.toLocaleString() + ' km'; }
        }
        
        // Assurance
        var assuranceBadge = 'badge-success';
        var assuranceText = '✅ Valide';
        if (v.insuranceDate) {
            if (v.insuranceDate < today) { assuranceBadge = 'badge'; assuranceText = '❌ Expirée'; }
            else {
                var jours = Math.ceil((new Date(v.insuranceDate) - new Date(today)) / 86400000);
                if (jours <= 30) { assuranceBadge = 'badge-warning'; assuranceText = '⚠️ ' + jours + ' jours'; }
                else { assuranceText = '✅ ' + new Date(v.insuranceDate).toLocaleDateString('fr-FR'); }
            }
        } else { assuranceBadge = 'badge-warning'; assuranceText = 'Non renseignée'; }
        
        // Vignette
        var vignetteBadge = 'badge-success';
        var vignetteText = '✅ Valide';
        if (v.vignetteDate) {
            if (v.vignetteDate < today) { vignetteBadge = 'badge'; vignetteText = '❌ Expirée'; }
            else {
                var jours = Math.ceil((new Date(v.vignetteDate) - new Date(today)) / 86400000);
                if (jours <= 30) { vignetteBadge = 'badge-warning'; vignetteText = '⚠️ ' + jours + ' jours'; }
                else { vignetteText = '✅ ' + new Date(v.vignetteDate).toLocaleDateString('fr-FR'); }
            }
        } else { vignetteBadge = 'badge-warning'; vignetteText = 'Non renseignée'; }
        
        var assuranceStyle = v.insuranceDate && v.insuranceDate < today ? 'background:#c0392b;color:white;' : '';
        var vignetteStyle = v.vignetteDate && v.vignetteDate < today ? 'background:#c0392b;color:white;' : '';
        
        // Chauffeur
        var driverName = 'Non assignée';
        var driver = allDriversData.find(function(d) { return d.vehicleId === v.id; });
        if (driver && driver.user) driverName = driver.user.name;
        
        html += '<tr>' +
            '<td><a href="#" onclick="viewVehicle(\'' + v.id + '\')" style="color:#1A5276;font-weight:600;text-decoration:none;"><i class="fas fa-véhiculercycle"></i> ' + (v.plate || 'N/A') + '</a></td>' +
            '<td>' + (v.model || 'N/A') + '</td>' +
            '<td>' + (driverName !== 'Non assignée' ? '<i class="fas fa-user"></i> ' + driverName : '<span style="color:#E74C3C;">' + driverName + '</span>') + '</td>' +
            '<td style="font-weight:600;">' + (v.currentKm || 0).toLocaleString() + ' km</td>' +
            '<td><span class="badge ' + vidangeBadge + '">' + vidangeText + '</span></td>' +
            '<td><span class="badge ' + assuranceBadge + '" style="' + assuranceStyle + '">' + assuranceText + '</span></td>' +
            '<td><span class="badge ' + vignetteBadge + '" style="' + vignetteStyle + '">' + vignetteText + '</span></td>' +
            '<td class="action-btns">' +
                '<button class="btn-sm btn-view" onclick="viewVehicle(\'' + v.id + '\')"><i class="fas fa-eye"></i> Voir</button>' +
                '<button class="btn-sm btn-edit" onclick="editVehicle(\'' + v.id + '\')"><i class="fas fa-edit"></i> Modifier</button>' +
                (driverName === 'Non assignée' ? '<button class="btn-sm btn-success" onclick="assignVehicle(\'' + v.id + '\')"><i class="fas fa-user-plus"></i> Assigner</button>' : '<button class="btn-sm btn-suspend" onclick="unassignVehicle(\'' + v.id + '\')"><i class="fas fa-user-slash"></i> Désassigner</button>') +
            '</td></tr>';
    });
    
    document.getElementById('vehiclesTable').innerHTML = html;
}

function filterVehicles() {
    var assurance = document.getElementById('filterAssurance').value;
    var vignette = document.getElementById('filterVignette').value;
    var vidange = document.getElementById('filterVidange').value;
    var search = document.getElementById('searchVehicle').value.toLowerCase();
    var today = new Date().toISOString().split('T')[0];
    
    var filtered = allVehicles.filter(function(v) {
        if (search && !(v.plate || '').toLowerCase().includes(search) && !(v.model || '').toLowerCase().includes(search)) return false;
        if (vidange && v.currentKm && v.nextMaintenanceKm) {
            var restant = v.nextMaintenanceKm - v.currentKm;
            if (vidange === 'urgent' && restant > 0) return false;
            if (vidange === 'bientot' && (restant <= 0 || restant > 500)) return false;
            if (vidange === 'ok' && restant <= 500) return false;
        }
        return true;
    });
    
    renderVehicles(filtered);
}

function resetFilters() {
    document.getElementById('filterAssurance').value = '';
    document.getElementById('filterVignette').value = '';
    document.getElementById('filterVidange').value = '';
    document.getElementById('searchVehicle').value = '';
    renderVehicles(allVehicles);
}

function showAddVehicle() {
    var h = '<div class="form-group"><label>Immatriculation</label><input id="addPlate" required></div>';
    h += '<div class="form-group"><label>Marque / Modèle</label><input id="addModel"></div>';
    h += '<div class="form-group"><label>Année</label><input type="number" id="addYear" value="2024"></div>';
    h += '<div class="form-group"><label>Cylindrée (cc)</label><input id="addCc" placeholder="100"></div>';
    h += '<div class="form-group"><label>Couleur</label><input id="addColor"></div>';
    h += '<div class="form-group"><label>N° Moteur</label><input id="addEngine"></div>';
    h += '<div class="form-group"><label>N° Châssis</label><input id="addChassis"></div>';
    h += '<div class="form-group"><label>Km actuels</label><input type="number" id="addKm" value="0"></div>';
    h += '<div class="form-group"><label>Prochaine vidange (km)</label><input type="number" id="addVidange" value="3000"></div>';
    h += '<div class="form-group"><label>Date fin assurance</label><input type="date" id="addAssurance"></div>';
    h += '<div class="form-group"><label>Date fin vignette</label><input type="date" id="addVignette"></div>';
    
    showModal('Nouvelle véhicule', h, function() {
        var data = {
            plate: document.getElementById('addPlate').value,
            model: document.getElementById('addModel').value,
            year: parseInt(document.getElementById('addYear').value) || 2024,
            currentKm: parseInt(document.getElementById('addKm').value) || 0,
            nextMaintenanceKm: parseInt(document.getElementById('addVidange').value) || 3000,
            insuranceDate: document.getElementById('addAssurance').value,
            vignetteDate: document.getElementById('addVignette').value
        };
        if (!data.plate) return alert('Immatriculation requise');
        apiPost('/vehicles', data).then(function() { closeModal(); loadVehicles(); });
    });
}

function viewVehicle(id) {
    var v = allVehicles.find(function(x) { return x.id === id; });
    if (!v) return;
    var driver = allDriversData.find(function(d) { return d.vehicleId === v.id; });
    var driverName = driver && driver.user ? driver.user.name : 'Non assignée';
    
    var info = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
    info += '<div><strong>Immatriculation:</strong> ' + (v.plate || 'N/A') + '</div>';
    info += '<div><strong>Marque/Modèle:</strong> ' + (v.model || 'N/A') + '</div>';
    info += '<div><strong>Année:</strong> ' + (v.year || 'N/A') + '</div>';
    info += '<div><strong>Km actuels:</strong> ' + (v.currentKm || 0).toLocaleString() + ' km</div>';
    info += '<div><strong>Prochaine vidange:</strong> ' + (v.nextMaintenanceKm || 0).toLocaleString() + ' km</div>';
    info += '<div><strong>Chauffeur:</strong> ' + driverName + '</div>';
    info += '</div>';
    
    showModal('Fiche véhicule: ' + (v.plate || ''), info);
}

function editVehicle(id) {
    var v = allVehicles.find(function(x) { return x.id === id; });
    if (!v) return;
    
    var h = '<div class="form-group"><label>Km actuels</label><input type="number" id="editKm" value="' + (v.currentKm || 0) + '"></div>';
    h += '<div class="form-group"><label>Prochaine vidange (km)</label><input type="number" id="editVidange" value="' + (v.nextMaintenanceKm || 3000) + '"></div>';
    h += '<div class="form-group"><label>Date fin assurance</label><input type="date" id="editAssurance" value="' + (v.insuranceDate || '') + '"></div>';
    h += '<div class="form-group"><label>Date fin vignette</label><input type="date" id="editVignette" value="' + (v.vignetteDate || '') + '"></div>';
    h += '<div class="form-group"><label>Statut</label><select id="editStatus"><option ' + (v.status === 'active' ? 'selected' : '') + '>active</option><option ' + (v.status === 'maintenance' ? 'selected' : '') + '>maintenance</option><option ' + (v.status === 'inactive' ? 'selected' : '') + '>inactive</option></select></div>';
    
    showModal('Modifier ' + (v.plate || ''), h, function() {
        apiPut('/vehicles/' + id, {
            currentKm: parseInt(document.getElementById('editKm').value) || 0,
            nextMaintenanceKm: parseInt(document.getElementById('editVidange').value) || 3000,
            insuranceDate: document.getElementById('editAssurance').value,
            vignetteDate: document.getElementById('editVignette').value,
            status: document.getElementById('editStatus').value
        }).then(function() { closeModal(); loadVehicles(); });
    });
}

function assignVehicle(id) {
    var freeDrivers = allDriversData.filter(function(d) { return !d.vehicleId && d.status === 'active'; });
    if (!freeDrivers.length) return alert('Aucun chauffeur disponible');
    
    var h = '<div class="form-group"><label>Chauffeur</label><select id="assignDriver">';
    freeDrivers.forEach(function(d) { h += '<option value="' + d.id + '">' + (d.user ? d.user.name : d.driverCode) + '</option>'; });
    h += '</select></div>';
    
    showModal('Assigner la véhicule', h, function() {
        var driverId = document.getElementById('assignDriver').value;
        apiPatch('/drivers/' + driverId, { vehicleId: id }).then(function() { closeModal(); loadVehicles(); });
    });
}

function unassignVehicle(id) {
    if (!confirm('Désassigner cette véhicule ?')) return;
    var driver = allDriversData.find(function(d) { return d.vehicleId === id; });
    if (driver) {
        apiPatch('/drivers/' + driver.id, { vehicleId: null }).then(function() { loadVehicles(); });
    }
}
