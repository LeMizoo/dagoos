function init_fiche_chauffeur() {
    var main = document.getElementById('mainContent');
    main.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
        '<h1><i class="fas fa-id-card"></i> Fiche Chauffeur</h1>' +
        '<div style="display:flex;gap:8px;"><button class="btn btn-edit" onclick="editCurrentDriver()"><i class="fas fa-edit"></i> Modifier</button>' +
        '<button class="btn btn-primary" onclick="alert(\'Contrat généré !\')"><i class="fas fa-file-contract"></i> Générer contrat</button></div></div>' +
        '<div class="card" style="padding:20px;"><div class="form-group"><label>Sélectionner un chauffeur</label><select id="selectChauffeur" onchange="loadChauffeurDetail()" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;"><option value="">-- Sélectionner --</option></select></div>' +
        '<div id="chauffeurDetail" style="margin-top:16px;"></div></div>';
    loadChauffeurList();
}

var currentDriverId = null;

async function loadChauffeurList() {
    var drivers = await apiGet('/drivers');
    var myDrivers = myDrivers.filter(function(d) { return d.organization && d.organization.email === user.email; });
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var myDrivers = myDrivers.filter(function(d) { return d.organization && d.organization.email === user.email; });
    var sel = document.getElementById('selectChauffeur');
    if (!myDrivers.length) {
        sel.innerHTML = '<option value="">Aucun chauffeur</option>';
        return;
    }
    myDrivers.forEach(function(d) {
        var opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = (d.user ? d.user.name : d.driverCode) + ' - ' + (d.user ? d.user.phone || '' : '');
        sel.appendChild(opt);
    });
    sel.value = myDrivers[0].id;
    loadChauffeurDetail();
}

async function loadChauffeurDetail() {
    var id = document.getElementById('selectChauffeur').value;
    if (!id) { document.getElementById('chauffeurDetail').innerHTML = ''; return; }
    currentDriverId = id;
    var drivers = await apiGet('/drivers');
    var myDrivers = myDrivers.filter(function(d) { return d.organization && d.organization.email === user.email; });
    var vehicles = await apiGet('/vehicles');
    var d = myDrivers.find(function(x) { return x.id === id; });
    if (!d) return;
    var moto = vehicles.find(function(v) { return v.id === d.vehicleId; });
    
    var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">';
    html += '<div><h4><i class="fas fa-user"></i> Informations personnelles</h4>';
    html += '<p><strong>Nom:</strong> ' + (d.user ? d.user.name : 'N/A') + '</p>';
    html += '<p><strong>Téléphone:</strong> ' + (d.user ? d.user.phone || 'N/A' : 'N/A') + '</p>';
    html += '<p><strong>Code d\'accès:</strong> <code style="font-size:16px;letter-spacing:2px;">' + d.driverCode + '</code></p>';
    html += '<p><strong>Permis:</strong> ' + (d.license || 'Non renseigné') + '</p>';
    html += '<p><strong>Statut:</strong> <span class="badge ' + (d.status === 'active' ? 'badge-success' : 'badge-danger') + '">' + d.status + '</span></p></div>';
    
    html += '<div><h4><i class="fas fa-motorcycle"></i> Moto assignée</h4>';
    html += moto ? '<p><strong>Immatriculation:</strong> ' + moto.plate + '</p><p><strong>Modèle:</strong> ' + (moto.model || 'N/A') + '</p><p><strong>Km:</strong> ' + (moto.currentKm || 0).toLocaleString() + ' km</p>' : '<p style="color:#E74C3C;">Aucune moto assignée</p>';
    html += '</div></div>';
    
    html += '<div style="margin-top:16px;"><h4><i class="fas fa-file-alt"></i> Documents</h4>';
    html += '<div style="display:flex;gap:10px;flex-wrap:wrap;">';
    ['CIN', 'Permis', 'Photo', 'Certificat residence'].forEach(function(doc) {
        html += '<div style="background:#FEF3C7;padding:10px;border-radius:8px;text-align:center;width:100px;"><p style="font-size:24px;">📄</p><p style="font-size:10px;">' + doc + '</p><span class="badge badge-warning">Manquant</span></div>';
    });
    html += '</div></div>';
    
    document.getElementById('chauffeurDetail').innerHTML = html;
}

function editCurrentDriver() {
    if (!currentDriverId) return;
    alert('Modification du chauffeur (à implémenter)');
}
