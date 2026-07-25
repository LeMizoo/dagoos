function init_permutation() {
    setTimeout(function() { loadData(); }, 100);
    var main = document.getElementById('mainContent');
    main.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
        '<h1><i class="fas fa-exchange-alt"></i> Permutation Moto</h1></div>' +
        '<div class="card" style="padding:20px;margin-bottom:14px;"><h3>Assigner une moto</h3>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;"><select id="permChauffeur" style="padding:8px;border:1px solid var(--border);border-radius:6px;"><option value="">-- Chauffeur --</option></select>' +
        '<select id="permMoto" style="padding:8px;border:1px solid var(--border);border-radius:6px;"><option value="">-- Moto --</option></select>' +
        '<button class="btn btn-primary" onclick="assignerMoto()">Assigner la moto</button></div></div>' +
        '<div class="card"><table><thead><tr><th>Chauffeur</th><th>Moto assignée</th><th>Actions</th></tr></thead><tbody id="permTable"></tbody></table></div>';
    loadPermutation();
}

async function loadPermutation() {
    var drivers = await apiGet('/drivers');
    var vehicles = await apiGet('/vehicles');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var myDrivers = drivers.filter(function(d) { return d.organization && d.organization.email === user.email; });
    
    // Remplir les selects
    var selC = document.getElementById('permChauffeur');
    var selM = document.getElementById('permMoto');
    myDrivers.forEach(function(d) { var o = document.createElement('option'); o.value = d.id; o.textContent = d.user ? d.user.name : d.driverCode; selC.appendChild(o); });
    vehicles.forEach(function(v) { var o = document.createElement('option'); o.value = v.id; o.textContent = v.plate; selM.appendChild(o); });
    
    document.getElementById('permTable').innerHTML = myDrivers.map(function(d) {
        var moto = vehicles.find(function(v) { return v.id === d.vehicleId; });
        return '<tr><td><strong>' + (d.user ? d.user.name : 'N/A') + '</strong></td><td>' + (moto ? moto.plate : '<span style="color:#E74C3C;">Non assignée</span>') + '</td><td><button class="btn-sm btn-edit" onclick="permuter(\'' + d.id + '\')">Permuter</button> <button class="btn-sm btn-suspend" onclick="retirerMoto(\'' + d.id + '\')">Retirer</button></td></tr>';
    }).join('');
}

function assignerMoto() {
    var driverId = document.getElementById('permChauffeur').value;
    var motoId = document.getElementById('permMoto').value;
    if (!driverId || !motoId) return alert('Sélectionner chauffeur et moto');
    apiPatch('/drivers/' + driverId, { vehicleId: motoId }).then(function() { alert('Assigné !'); loadPermutation(); });
}

function retirerMoto(driverId) {
    if (confirm('Retirer la moto ?')) {
        apiPatch('/drivers/' + driverId, { vehicleId: null }).then(function() { loadPermutation(); });
    }
}

function permuter(driverId) { alert('Fonction de permutation - sélectionnez une nouvelle moto'); }
