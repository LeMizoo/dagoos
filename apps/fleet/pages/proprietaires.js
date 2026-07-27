function init_proprietaires() {
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
            '<h1>🏢 Propriétaires</h1>' +
            '<button class="btn btn-primary" onclick="showAddProprietaire()">➕ Nouveau propriétaire</button>' +
        '</div>' +
        '<div class="card"><table><thead><tr><th>Nom</th><th>CIN</th><th>Téléphone</th><th>Email</th><th>Véhicules</th><th>Contrat</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="propTable"><tr><td colspan="8">Chargement...</td></tr></tbody></table></div>';
    setTimeout(loadProprietaires, 100);
}

async function loadProprietaires() {
    var props = await apiGet('/proprietaires');
    var vehicles = await apiGet('/vehicles');
    
    document.getElementById('propTable').innerHTML = props.length ? props.map(function(p) {
        var nbVehicules = vehicles.filter(function(v) { return v.proprietaireId === p.id; }).length;
        var contratBadge = p.status === 'active' ? 'badge-success' : p.status === 'expire' ? 'badge-danger' : 'badge-warning';
        var contratLabel = p.status === 'active' ? 'Actif' : p.status === 'expire' ? 'Expiré' : 'En attente';
        return '<tr><td><strong>' + p.name + '</strong></td>' +
            '<td>' + (p.cin || 'N/A') + '</td>' +
            '<td>' + (p.phone || 'N/A') + '</td>' +
            '<td>' + (p.email || 'N/A') + '</td>' +
            '<td><span class="badge badge-info">' + nbVehicules + ' véhicule(s)</span></td>' +
            '<td><span class="badge ' + contratBadge + '">' + contratLabel + '</span></td>' +
            '<td><span class="badge ' + (p.status === 'active' ? 'badge-success' : 'badge-danger') + '">' + p.status + '</span></td>' +
            '<td class="action-btns">' +
                '<button class="btn-sm btn-view" onclick="viewProprietaire(\'' + p.id + '\')">👁</button>' +
                '<button class="btn-sm btn-edit" onclick="editProprietaire(\'' + p.id + '\')">✏️</button>' +
                '<button class="btn-sm btn-suspend" onclick="toggleProprietaire(\'' + p.id + '\',\'' + p.status + '\')"><i class="fas fa-' + (p.status === 'active' ? 'ban' : 'check') + '"></i></button>' +
            '</td></tr>';
    }).join('') : '<tr><td colspan="8">Aucun propriétaire</td></tr>';
}

function showAddProprietaire() {
    var h = '<div class="form-group"><label>Nom complet *</label><input id="addName" required></div>';
    h += '<div class="form-group"><label>CIN</label><input id="addCin"></div>';
    h += '<div class="form-group"><label>Téléphone</label><input id="addPhone"></div>';
    h += '<div class="form-group"><label>Email</label><input id="addEmail"></div>';
    h += '<div class="form-group"><label>Adresse</label><input id="addAddress"></div>';
    h += '<div class="form-group"><label>NIF</label><input id="addNif"></div>';
    h += '<div class="form-group"><label>N° Statistique</label><input id="addStat"></div>';
    h += '<div class="form-group"><label>Date début contrat</label><input type="date" id="addDateDebut"></div>';
    h += '<div class="form-group"><label>Date fin contrat</label><input type="date" id="addDateFin"></div>';
    showModal('Nouveau contrat propriétaire', h, function() {
        var name = document.getElementById('addName').value;
        if (!name) return alert('Nom requis');
        apiGet('/organizations').then(function(orgs) {
            var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
            var org = orgs.find(function(o) { return o.email === user.email; });
            apiPost('/proprietaires', {
                name: name, cin: document.getElementById('addCin').value,
                phone: document.getElementById('addPhone').value,
                email: document.getElementById('addEmail').value,
                address: document.getElementById('addAddress').value,
                organizationId: org ? org.id : null
            }).then(function() { closeModal(); setTimeout(loadProprietaires, 100); });
        });
    });
}

function viewProprietaire(id) {
    apiGet('/proprietaires').then(function(props) {
        var p = props.find(function(x) { return x.id === id; });
        if (!p) return;
        var info = '<p><strong>Nom:</strong> ' + p.name + '</p>';
        info += '<p><strong>CIN:</strong> ' + (p.cin || 'N/A') + '</p>';
        info += '<p><strong>Téléphone:</strong> ' + (p.phone || 'N/A') + '</p>';
        info += '<p><strong>Email:</strong> ' + (p.email || 'N/A') + '</p>';
        info += '<p><strong>Adresse:</strong> ' + (p.address || 'N/A') + '</p>';
        info += '<p><strong>Statut:</strong> ' + p.status + '</p>';
        if (p.vehicles && p.vehicles.length) {
            info += '<h4>Véhicules</h4>' + p.vehicles.map(function(v) { return '<p>🏍️ ' + v.plate + ' - ' + v.model + '</p>'; }).join('');
        }
        showModal(p.name, info);
    });
}

function editProprietaire(id) {
    apiGet('/proprietaires').then(function(props) {
        var p = props.find(function(x) { return x.id === id; });
        if (!p) return;
        var h = '<div class="form-group"><label>Nom</label><input id="editName" value="' + p.name + '"></div>';
        h += '<div class="form-group"><label>CIN</label><input id="editCin" value="' + (p.cin || '') + '"></div>';
        h += '<div class="form-group"><label>Téléphone</label><input id="editPhone" value="' + (p.phone || '') + '"></div>';
        h += '<div class="form-group"><label>Email</label><input id="editEmail" value="' + (p.email || '') + '"></div>';
        h += '<div class="form-group"><label>Statut</label><select id="editStatus"><option ' + (p.status === 'active' ? 'selected' : '') + '>active</option><option ' + (p.status === 'expire' ? 'selected' : '') + '>expire</option><option ' + (p.status === 'pending' ? 'selected' : '') + '>pending</option></select></div>';
        showModal('Modifier ' + p.name, h, function() {
            apiPut('/proprietaires/' + id, {
                name: document.getElementById('editName').value,
                cin: document.getElementById('editCin').value,
                phone: document.getElementById('editPhone').value,
                email: document.getElementById('editEmail').value,
                status: document.getElementById('editStatus').value
            }).then(function() { closeModal(); setTimeout(loadProprietaires, 100); });
        });
    });
}

function toggleProprietaire(id, status) {
    var ns = status === 'active' ? 'expire' : 'active';
    var msg = ns === 'expire' ? 'Résilier ce contrat ? Une notification sera envoyée.' : 'Réactiver ce contrat ?';
    if (confirm(msg)) {
        apiPut('/proprietaires/' + id, { status: ns }).then(function() {
            alert('Contrat ' + (ns === 'expire' ? 'résilié' : 'réactivé') + '. Notification envoyée.');
            setTimeout(loadProprietaires, 100);
        });
    }
}
