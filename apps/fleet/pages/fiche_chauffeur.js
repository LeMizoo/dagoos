function init_fiche_chauffeur() {
    document.getElementById('mainContent').innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
        '<h1><i class="fas fa-id-card"></i> Fiche Chauffeur</h1>' +
        '<div style="display:flex;gap:8px;"><button class="btn btn-edit" onclick="editCurrentDriver()"><i class="fas fa-edit"></i> Modifier</button>' +
        '<button class="btn btn-primary" onclick="alert(\'Contrat généré !\')"><i class="fas fa-file-contract"></i> Générer contrat</button></div></div>' +
        '<div class="card" style="padding:20px;"><div class="form-group"><label>Sélectionner un chauffeur</label><select id="selectChauffeur" onchange="loadChauffeurDetail()" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;"><option value="">-- Sélectionner --</option></select></div>' +
        '<div id="chauffeurDetail" style="margin-top:16px;"></div></div>';
    setTimeout(loadChauffeurList, 100);
}

var currentDriverId = null;

async function loadChauffeurList() {
    var drivers = await apiGet('/drivers');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var myDrivers = (drivers || []).filter(function(d) { return d.organization && d.organization.email === user.email; });
    var sel = document.getElementById('selectChauffeur');
    sel.innerHTML = '<option value="">-- Sélectionner --</option>';
    if (!myDrivers.length) { document.getElementById('chauffeurDetail').innerHTML = '<p style="text-align:center;padding:30px;color:var(--text2);">Aucun chauffeur dans votre flotte</p>'; return; }
    myDrivers.forEach(function(d) { var o = document.createElement('option'); o.value = d.id; o.textContent = (d.user ? d.user.name : d.driverCode); sel.appendChild(o); });
    sel.value = myDrivers[0].id;
    loadChauffeurDetail();
}

async function loadChauffeurDetail() {
    var id = document.getElementById('selectChauffeur').value;
    if (!id) { document.getElementById('chauffeurDetail').innerHTML = ''; return; }
    currentDriverId = id;
    var drivers = await apiGet('/drivers');
    var vehicles = await apiGet('/vehicles');
    var d = (drivers || []).find(function(x) { return x.id === id; });
    if (!d) return;
    var moto = (vehicles || []).find(function(v) { return v.id === d.vehicleId; });
    
    var html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">';
    html += '<div><h4>Informations personnelles</h4>';
    html += '<p><strong>Nom:</strong> ' + (d.user ? d.user.name : 'N/A') + '</p>';
    html += '<p><strong>Code d\'accès:</strong> <code>' + d.driverCode + '</code></p>';
    html += '<p><strong>Statut:</strong> ' + d.status + '</p></div>';
    html += '<div><h4>Moto assignée</h4>';
    html += moto ? '<p>' + moto.plate + ' - ' + (moto.model || '') + '</p>' : '<p style="color:#E74C3C;">Aucune</p>';
    html += '</div></div>';
    document.getElementById('chauffeurDetail').innerHTML = html;
}
function editCurrentDriver() { alert('Modification à implémenter'); }
