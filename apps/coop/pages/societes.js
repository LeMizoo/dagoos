function init_societes() {
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
            '<h1>🏢 Sociétés</h1>' +
            '<button class="btn btn-primary" onclick="showAddSociete()">➕ Nouvelle société</button>' +
        '</div>' +
        '<div class="stats-grid" id="societeStats" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px;"></div>' +
        '<div class="card"><table><thead><tr><th>Nom</th><th>Activité</th><th>Véhicules</th><th>Chauffeurs</th><th>NIF</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="societesTable"><tr><td colspan="7">Chargement...</td></tr></tbody></table></div>';
    loadSocietes();
}

async function loadSocietes() {
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var orgs = await apiGet('/organizations');
    var org = orgs.find(function(o) { return o.email === user.email; });
    
    try {
        var societes = await apiGet('/societes');
        var mySocietes = societes.filter(function(s) { return s.organizationId === org.id; });
        
        var totalVehicules = 0, totalChauffeurs = 0, actives = 0;
        mySocietes.forEach(function(s) {
            totalVehicules += (s.vehicles || []).length;
            totalChauffeurs += (s.drivers || []).length;
            if (s.status === 'active') actives++;
        });
        
        document.getElementById('societeStats').innerHTML = 
            '<div class="stat-card"><div class="stat-icon green">🏢</div><div class="stat-info"><div class="stat-number">' + mySocietes.length + '</div><div class="stat-label">Sociétés</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon blue">🏍️</div><div class="stat-info"><div class="stat-number">' + totalVehicules + '</div><div class="stat-label">Véhicules</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon yellow">👥</div><div class="stat-info"><div class="stat-number">' + totalChauffeurs + '</div><div class="stat-label">Chauffeurs</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red">✅</div><div class="stat-info"><div class="stat-number">' + actives + '</div><div class="stat-label">Actives</div></div></div>';
        
        document.getElementById('societesTable').innerHTML = mySocietes.length ? mySocietes.map(function(s) {
            var nbV = (s.vehicles || []).length;
            var nbD = (s.drivers || []).length;
            var statusBadge = s.status === 'active' ? 'badge-success' : s.status === 'inactive' ? 'badge-danger' : 'badge-warning';
            return '<tr><td><strong>' + s.name + '</strong></td>' +
                '<td>' + (s.activite || 'Transport') + '</td>' +
                '<td><span class="badge badge-info">' + nbV + '</span></td>' +
                '<td><span class="badge badge-info">' + nbD + '</span></td>' +
                '<td>' + (s.nif || 'N/A') + '</td>' +
                '<td><span class="badge ' + statusBadge + '">' + s.status + '</span></td>' +
                '<td class="action-btns">' +
                    '<button class="btn-sm btn-view" onclick="viewSociete(\'' + s.id + '\')">👁</button>' +
                    '<button class="btn-sm btn-edit" onclick="editSociete(\'' + s.id + '\')">✏️</button>' +
                    '<button class="btn-sm ' + (s.status === 'active' ? 'btn-suspend' : 'btn-success') + '" onclick="toggleSociete(\'' + s.id + '\',\'' + s.status + '\')"><i class="fas fa-' + (s.status === 'active' ? 'ban' : 'check') + '"></i></button>' +
                '</td></tr>';
        }).join('') : '<tr><td colspan="7">Aucune société. Créez votre première société.</td></tr>';
        
        document.getElementById('societeCount').textContent = mySocietes.length;
    } catch(e) { console.error(e); }
}

function showAddSociete() {
    var h = '<div class="form-group"><label>Nom de la société *</label><input id="addSocieteName"></div>';
    h += '<div class="form-group"><label>Type d\'activité</label><select id="addActivite"><option>Transport urbain</option><option>Transport régional</option><option>Livraison colis</option><option>Livraison plats</option><option>Logistique</option><option>Mixte</option></select></div>';
    h += '<div class="form-group"><label>Adresse</label><input id="addAdresse"></div>';
    h += '<div class="form-group"><label>NIF</label><input id="addNif"></div>';
    h += '<div class="form-group"><label>STAT</label><input id="addStat"></div>';
    h += '<div class="form-group"><label>Email</label><input id="addEmail"></div>';
    h += '<div class="form-group"><label>Téléphone</label><input id="addPhone"></div>';
    showModal('Nouvelle société', h, function() {
        var name = document.getElementById('addSocieteName').value;
        if (!name) return alert('Nom requis');
        apiGet('/organizations').then(function(orgs) {
            var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
            var org = orgs.find(function(o) { return o.email === user.email; });
            apiPost('/societes', {
                name: name,
                activite: document.getElementById('addActivite').value,
                adresse: document.getElementById('addAdresse').value,
                nif: document.getElementById('addNif').value,
                stat: document.getElementById('addStat').value,
                email: document.getElementById('addEmail').value,
                phone: document.getElementById('addPhone').value,
                organizationId: org.id
            }).then(function() { closeModal(); loadSocietes(); });
        });
    });
}

function viewSociete(id) {
    apiGet('/societes').then(function(societes) {
        var s = societes.find(function(x) { return x.id === id; });
        if (!s) return;
        var info = '<p><strong>Nom:</strong> ' + s.name + '</p>';
        info += '<p><strong>Activité:</strong> ' + (s.activite || 'N/A') + '</p>';
        info += '<p><strong>NIF:</strong> ' + (s.nif || 'N/A') + '</p>';
        info += '<p><strong>STAT:</strong> ' + (s.stat || 'N/A') + '</p>';
        info += '<p><strong>Véhicules:</strong> ' + (s.vehicles || []).length + '</p>';
        info += '<p><strong>Chauffeurs:</strong> ' + (s.drivers || []).length + '</p>';
        info += '<p><strong>Statut:</strong> ' + s.status + '</p>';
        showModal(s.name, info);
    });
}

function editSociete(id) {
    apiGet('/societes').then(function(societes) {
        var s = societes.find(function(x) { return x.id === id; });
        if (!s) return;
        var h = '<div class="form-group"><label>Nom</label><input id="editName" value="' + s.name + '"></div>';
        h += '<div class="form-group"><label>Activité</label><select id="editActivite"><option ' + (s.activite === 'Transport urbain' ? 'selected' : '') + '>Transport urbain</option><option ' + (s.activite === 'Transport régional' ? 'selected' : '') + '>Transport régional</option><option ' + (s.activite === 'Livraison colis' ? 'selected' : '') + '>Livraison colis</option><option ' + (s.activite === 'Livraison plats' ? 'selected' : '') + '>Livraison plats</option><option ' + (s.activite === 'Logistique' ? 'selected' : '') + '>Logistique</option><option ' + (s.activite === 'Mixte' ? 'selected' : '') + '>Mixte</option></select></div>';
        h += '<div class="form-group"><label>NIF</label><input id="editNif" value="' + (s.nif || '') + '"></div>';
        h += '<div class="form-group"><label>Statut</label><select id="editStatus"><option ' + (s.status === 'active' ? 'selected' : '') + '>active</option><option ' + (s.status === 'inactive' ? 'selected' : '') + '>inactive</option></select></div>';
        showModal('Modifier ' + s.name, h, function() {
            apiPut('/societes/' + id, {
                name: document.getElementById('editName').value,
                activite: document.getElementById('editActivite').value,
                nif: document.getElementById('editNif').value,
                status: document.getElementById('editStatus').value
            }).then(function() { closeModal(); loadSocietes(); });
        });
    });
}

function toggleSociete(id, status) {
    var ns = status === 'active' ? 'inactive' : 'active';
    if (confirm('Changer le statut en ' + ns + ' ?')) {
        apiPut('/societes/' + id, { status: ns }).then(function() { loadSocietes(); });
    }
}
