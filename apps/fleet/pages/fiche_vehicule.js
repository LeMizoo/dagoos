function init_fiche_vehicule() {
    var main = document.getElementById('mainContent');
    main.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
        '<h1><i class="fas fa-file-alt"></i> Fiche Véhicule</h1>' +
        '<div style="display:flex;gap:8px;"><button class="btn btn-edit" onclick="editCurrentVehicle()"><i class="fas fa-edit"></i> Modifier</button>' +
        '<button class="btn btn-primary" onclick="showAddVehicle()"><i class="fas fa-plus"></i> Nouveau véhicule</button></div></div>' +
        '<div class="card" style="padding:20px;"><div class="form-group"><label>Sélectionner un véhicule</label><select id="selectVehicle" onchange="loadVehicleDetail()" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;"><option value="">-- Sélectionner --</option></select></div>' +
        '<div id="vehicleDetail" style="margin-top:16px;"></div></div>';
    loadVehicleList();
}

var currentVehicleId = null;

async function loadVehicleList() {
    var vehicles = await apiGet('/vehicles');
    var user = JSON.parse(localStorage.getItem("dagoos_user") || "{}");
    var orgs = await apiGet("/organizations");
    var org = orgs.find(function(o) { return o.email === user.email; });
    if (org) { vehicles = vehicles.filter(function(v) { return v.organizationId === org.id; }); }
    
    var sel = document.getElementById('selectVehicle');
    sel.innerHTML = '<option value="">-- Sélectionner --</option>';
    
    if (!vehicles.length) { sel.innerHTML = "<option value="">-- Aucun vehicule --</option>"; document.getElementById("vehicleDetail").innerHTML = ""; return; }
    
    vehicles.forEach(function(v) {
        var opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = v.plate + ' - ' + (v.model || 'N/A');
        sel.appendChild(opt);
    });
    sel.value = vehicles[0].id;
    loadVehicleDetail();
}

async function loadVehicleDetail() {
    var id = document.getElementById('selectVehicle').value;
    if (!id) { document.getElementById('vehicleDetail').innerHTML = ''; return; }
    currentVehicleId = id;
    var vehicles = await apiGet('/vehicles');
    var user = JSON.parse(localStorage.getItem("dagoos_user") || "{}");
    var orgs = await apiGet("/organizations");
    var org = orgs.find(function(o) { return o.email === user.email; });
    if (org) { vehicles = vehicles.filter(function(v) { return v.organizationId === org.id; }); }
    var v = vehicles.find(function(x) { return x.id === id; });
    if (!v) return;
    
    var restant = (v.nextMaintenanceKm || 0) - (v.currentKm || 0);
    var restantColor = restant <= 0 ? '#E74C3C' : restant <= 500 ? '#F39C12' : '#27AE60';
    
    var detail = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">';
    detail += '<div><h4>Identification</h4>';
    detail += '<p><strong>Immatriculation:</strong> ' + (v.plate || 'N/A') + '</p>';
    detail += '<p><strong>Marque/Modèle:</strong> ' + (v.model || 'N/A') + '</p>';
    detail += '<p><strong>Année:</strong> ' + (v.year || 'N/A') + '</p>';
    detail += '<p><strong>Kilométrage:</strong> ' + (v.currentKm || 0).toLocaleString() + ' km</p>';
    detail += '<p><strong>Statut:</strong> ' + (v.status || 'active') + '</p></div>';
    
    detail += '<div><h4>Gestion vidange</h4>';
    detail += '<p><strong>Km actuels:</strong> ' + (v.currentKm || 0).toLocaleString() + ' km</p>';
    detail += '<p><strong>Prochaine vidange:</strong> ' + (v.nextMaintenanceKm || 0).toLocaleString() + ' km</p>';
    detail += '<p><strong>Restant:</strong> <span style="color:' + restantColor + ';font-weight:600;">' + restant.toLocaleString() + ' km</span></p>';
    detail += '<p><strong>Assurance:</strong> ' + (v.insuranceDate ? new Date(v.insuranceDate).toLocaleDateString('fr-FR') : 'N/A') + '</p></div></div>';
    
    detail += '<div style="margin-top:16px;"><h4>Valider une vidange</h4>';
    detail += '<div style="display:flex;gap:10px;flex-wrap:wrap;">';
    detail += '<input type="number" id="vidangeKm" value="' + (v.currentKm || 0) + '" style="padding:8px;border:1px solid var(--border);border-radius:6px;width:100px;">';
    detail += '<input type="date" id="vidangeDate" style="padding:8px;border:1px solid var(--border);border-radius:6px;">';
    detail += '<input type="number" id="vidangeNext" value="' + ((v.currentKm || 0) + 3000) + '" style="padding:8px;border:1px solid var(--border);border-radius:6px;width:100px;">';
    detail += '<input type="number" id="vidangeCost" placeholder="Coût (Ar)" style="padding:8px;border:1px solid var(--border);border-radius:6px;width:100px;">';
    detail += '<button class="btn btn-primary" onclick="validerVidange()"><i class="fas fa-check"></i> Valider la vidange</button></div></div>';
    
    document.getElementById('vehicleDetail').innerHTML = detail;
}

function validerVidange() {
    if (!currentVehicleId) return;
    var km = document.getElementById('vidangeKm').value;
    var next = document.getElementById('vidangeNext').value;
    if (!km) return alert('Km actuels requis');
    apiPut('/vehicles/' + currentVehicleId, { currentKm: parseInt(km), nextMaintenanceKm: parseInt(next) }).then(function() {
        alert('✅ Vidange validée !');
        loadVehicleDetail();
    });
}

function editCurrentVehicle() {
    if (!currentVehicleId) return;
    editVehicle(currentVehicleId);
}
 
// force deploy v2
// FICHE VEHICULE V2 -  Sat, Jul 25, 2026 5:22:28 PM
