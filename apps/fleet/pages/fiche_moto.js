function init_fiche_moto() {
    var main = document.getElementById('mainContent');
    main.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
        '<h1><i class="fas fa-file-alt"></i> Fiche Moto</h1>' +
        '<div style="display:flex;gap:8px;"><button class="btn btn-primary" onclick="showAddVehicle()"><i class="fas fa-plus"></i> Nouvelle moto</button></div></div>' +
        '<div class="card" style="padding:24px;"><div class="form-group"><label>Sélectionner une moto</label><select id="selectVehicle" onchange="loadVehicleDetail()" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;"><option value="">-- Sélectionner --</option></select></div>' +
        '<div id="vehicleDetail" style="margin-top:16px;"></div></div>';
    loadVehicleList();
}

async function loadVehicleList() {
    var vehicles = await apiGet('/vehicles');
    var sel = document.getElementById('selectVehicle');
    vehicles.forEach(function(v) {
        var opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = v.plate + ' - ' + (v.model || 'N/A');
        sel.appendChild(opt);
    });
}

async function loadVehicleDetail() {
    var id = document.getElementById('selectVehicle').value;
    if (!id) { document.getElementById('vehicleDetail').innerHTML = ''; return; }
    var vehicles = await apiGet('/vehicles');
    var v = vehicles.find(function(x) { return x.id === id; });
    if (!v) return;
    
    var detail = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">';
    detail += '<div><h4>Identification</h4>';
    detail += '<p><strong>Immatriculation:</strong> ' + (v.plate || 'N/A') + '</p>';
    detail += '<p><strong>Marque/Modèle:</strong> ' + (v.model || 'N/A') + '</p>';
    detail += '<p><strong>Année:</strong> ' + (v.year || 'N/A') + '</p>';
    detail += '<p><strong>Couleur:</strong> ' + (v.color || 'N/A') + '</p>';
    detail += '<p><strong>N° Moteur:</strong> ' + (v.engineNo || 'N/A') + '</p>';
    detail += '<p><strong>N° Châssis:</strong> ' + (v.chassisNo || 'N/A') + '</p>';
    detail += '<p><strong>Kilométrage:</strong> ' + (v.currentKm || 0).toLocaleString() + ' km</p></div>';
    
    detail += '<div><h4>Gestion vidange</h4>';
    detail += '<p><strong>Km actuels:</strong> ' + (v.currentKm || 0).toLocaleString() + ' km</p>';
    detail += '<p><strong>Prochaine vidange:</strong> ' + (v.nextMaintenanceKm || 0).toLocaleString() + ' km</p>';
    var restant = (v.nextMaintenanceKm || 0) - (v.currentKm || 0);
    detail += '<p><strong>Restant:</strong> <span style="color:' + (restant <= 0 ? '#E74C3C' : restant <= 500 ? '#F39C12' : '#27AE60') + ';">' + restant.toLocaleString() + ' km</span></p>';
    detail += '<p><strong>Assurance:</strong> ' + (v.insuranceDate ? new Date(v.insuranceDate).toLocaleDateString('fr-FR') : 'N/A') + '</p>';
    detail += '<p><strong>Vignette:</strong> ' + (v.vignetteDate ? new Date(v.vignetteDate).toLocaleDateString('fr-FR') : 'N/A') + '</p>';
    detail += '<p><strong>Statut:</strong> ' + (v.status || 'active') + '</p></div></div>';
    
    detail += '<div style="margin-top:16px;"><h4>Valider une vidange</h4>';
    detail += '<div style="display:flex;gap:10px;flex-wrap:wrap;">';
    detail += '<input type="number" id="vidangeKm" placeholder="Km actuels" value="' + (v.currentKm || 0) + '" style="padding:8px;border:1px solid var(--border);border-radius:6px;">';
    detail += '<input type="date" id="vidangeDate" style="padding:8px;border:1px solid var(--border);border-radius:6px;">';
    detail += '<input type="number" id="vidangeNext" placeholder="Prochaine vidange (km)" value="' + ((v.currentKm || 0) + 3000) + '" style="padding:8px;border:1px solid var(--border);border-radius:6px;">';
    detail += '<input type="number" id="vidangeCost" placeholder="Coût (Ar)" style="padding:8px;border:1px solid var(--border);border-radius:6px;">';
    detail += '<button class="btn btn-primary" onclick="validerVidange(\'' + v.id + '\')"><i class="fas fa-check"></i> Valider la vidange</button></div></div>';
    
    document.getElementById('vehicleDetail').innerHTML = detail;
}

function validerVidange(id) {
    var km = document.getElementById('vidangeKm').value;
    var next = document.getElementById('vidangeNext').value;
    if (!km) return alert('Km requis');
    apiPut('/vehicles/' + id, { currentKm: parseInt(km), nextMaintenanceKm: parseInt(next) }).then(function() {
        alert('Vidange validée !');
        loadVehicleDetail();
    });
}
