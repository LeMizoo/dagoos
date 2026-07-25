function init_drivers() {
    var main = document.getElementById('mainContent');
    main.innerHTML = '<div class="topbar"><h1><i class="fas fa-users"></i> Chauffeurs</h1>' +
        '<button class="btn btn-primary" onclick="showAddDriver()"><i class="fas fa-plus"></i> Ajouter</button></div>' +
        '<div class="card"><div class="card-header"><h3>Filtres</h3></div>' +
        '<div style="padding:12px;display:flex;gap:10px;"><select id="filterStatus" style="padding:8px;border:1px solid var(--border);border-radius:6px;"><option value="">Tous</option><option value="active">Actif</option><option value="inactive">Inactif</option></select><button class="btn btn-sm btn-primary" onclick="filterDrivers()">Filtrer</button></div></div>' +
        '<div class="card"><table><thead><tr><th>Code</th><th>Nom</th><th>Email</th><th>Propriétaire</th><th>Véhicule</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="driversTable"></tbody></table></div>';
    loadDrivers();
}

var allDrivers = [];
var allVehicles = [];
var allProprietaires = [];

async function loadDrivers() {
    var drivers = await apiGet('/drivers');
    allVehicles = await apiGet('/vehicles');
    allProprietaires = await apiGet('/proprietaires');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    allDrivers = drivers.filter(function(d) { return d.organization && d.organization.email === user.email; });
    renderDrivers(allDrivers);
}

function renderDrivers(data) {
    document.getElementById('driversTable').innerHTML = data.length ? data.map(function(d) {
        var moto = allVehicles.find(function(v) { return v.id === d.vehicleId; });
        var prop = allProprietaires.find(function(p) { return p.id === d.proprietaireId; });
        var vehicleName = moto ? moto.plate + ' - ' + (moto.model || '') : 'Non assigné';
        var propName = prop ? prop.name : 'Non assigné';
        return '<tr><td><code>' + d.driverCode + '</code></td><td><strong>' + (d.user ? d.user.name : 'N/A') + '</strong></td><td>' + (d.user ? d.user.email : 'N/A') + '</td><td>' + propName + '</td><td>' + vehicleName + '</td><td><span class="badge ' + (d.status === 'active' ? 'badge-success' : 'badge-danger') + '">' + d.status + '</span></td><td><button class="btn-sm btn-view" onclick="viewDriver(\'' + d.id + '\')"><i class="fas fa-eye"></i></button><button class="btn-sm btn-suspend" onclick="toggleDriver(\'' + d.id + '\',\'' + d.status + '\')"><i class="fas fa-' + (d.status === 'active' ? 'ban' : 'check') + '"></i></button></td></tr>';
    }).join('') : '<tr><td colspan="7">Aucun chauffeur</td></tr>';
}

function filterDrivers() {
    var s = document.getElementById('filterStatus').value;
    renderDrivers(s ? allDrivers.filter(function(d) { return d.status === s; }) : allDrivers);
}

function showAddDriver() {
    var h = '<div class="form-group"><label>Nom complet</label><input id="addName"></div>';
    h += '<div class="form-group"><label>Numéro (ex: 003)</label><input id="addNum"></div>';
    h += '<div class="form-group"><label>PIN (4 chiffres)</label><input type="password" id="addPin" maxlength="4"></div>';
    h += '<div class="form-group"><label>Propriétaire</label><select id="addProp"><option value="">Aucun</option>';
    allProprietaires.forEach(function(p) { h += '<option value="' + p.id + '">' + p.name + '</option>'; });
    h += '</select></div>';
    h += '<div class="form-group"><label>Véhicule</label><select id="addVehicle"><option value="">Aucun</option>';
    allVehicles.forEach(function(v) { h += '<option value="' + v.id + '">' + v.plate + '</option>'; });
    h += '</select></div>';
    showModal('Ajouter un chauffeur', h, function() {
        var name = document.getElementById('addName').value;
        var num = document.getElementById('addNum').value;
        var pin = document.getElementById('addPin').value;
        if (!name || !num || pin.length !== 4) return alert('Tous les champs requis');
        apiGet('/organizations').then(function(orgs) {
            var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
            var org = orgs.find(function(o) { return o.email === user.email; });
            if (!org) return alert('Organisation non trouvée');
            var prefix = org.type === 'COOPERATIVE' ? 'CO-' : 'FL-';
            var code = prefix + org.code + num;
            apiPost('/drivers', { name: name, driverCode: code, pin: pin, organizationId: org.id, proprietaireId: document.getElementById('addProp').value, vehicleId: document.getElementById('addVehicle').value }).then(function() { closeModal(); loadDrivers(); });
        });
    });
}

function viewDriver(id) {
    var d = allDrivers.find(function(x) { return x.id === id; });
    if (!d) return;
    var prop = allProprietaires.find(function(p) { return p.id === d.proprietaireId; });
    var moto = allVehicles.find(function(v) { return v.id === d.vehicleId; });
    showModal(d.user ? d.user.name : d.driverCode, 
        '<p><strong>Code:</strong> ' + d.driverCode + '</p>' +
        '<p><strong>Email:</strong> ' + (d.user ? d.user.email : 'N/A') + '</p>' +
        '<p><strong>Propriétaire:</strong> ' + (prop ? prop.name : 'Non assigné') + '</p>' +
        '<p><strong>Véhicule:</strong> ' + (moto ? moto.plate : 'Non assigné') + '</p>' +
        '<p><strong>Statut:</strong> ' + d.status + '</p>');
}

function toggleDriver(id, status) {
    var ns = status === 'active' ? 'inactive' : 'active';
    if (confirm('Changer en ' + ns + ' ?')) {
        apiPatch('/drivers/' + id, { status: ns }).then(function() { loadDrivers(); });
    }
}
