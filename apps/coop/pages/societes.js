function init_societes() {
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
            '<h1><i class="fas fa-building"></i> Sociétés</h1>' +
            '<button class="btn btn-primary" onclick="showAddSociete()"><i class="fas fa-plus"></i> Nouvelle société</button>' +
        '</div>' +
        '<div class="stats-grid" id="societeStats" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px;"></div>' +
        '<div class="card"><table><thead><tr><th>Nom</th><th>Activité</th><th>Véhicules</th><th>Chauffeurs</th><th>CA</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="societesTable"><tr><td colspan="7">Chargement...</td></tr></tbody></table></div>';
    loadSocietes();
}

async function loadSocietes() {
    try {
        var orgs = await apiGet('/organizations');
        var vehicles = await apiGet('/vehicles');
        var drivers = await apiGet('/drivers');
        var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
        var org = orgs.find(function(o) { return o.email === user.email; });
        
        // Pour l'instant, on affiche l'organisation elle-même comme "société principale"
        // Plus tard, on chargera les vraies sociétés depuis /api/societes
        var societes = org ? [{
            id: org.id,
            name: org.name,
            activite: 'Transport & Logistique',
            vehicules: vehicles.filter(function(v) { return v.organizationId === org.id; }).length,
            chauffeurs: drivers.filter(function(d) { return d.organization && d.organization.email === user.email; }).length,
            ca: 0,
            status: org.status
        }] : [];
        
        document.getElementById('societeStats').innerHTML = 
            '<div class="stat-card"><div class="stat-icon green"><i class="fas fa-building"></i></div><div class="stat-info"><div class="stat-number">' + societes.length + '</div><div class="stat-label">Sociétés</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon blue"><i class="fas fa-motorcycle"></i></div><div class="stat-info"><div class="stat-number">' + (societes[0] ? societes[0].vehicules : 0) + '</div><div class="stat-label">Véhicules</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-users"></i></div><div class="stat-info"><div class="stat-number">' + (societes[0] ? societes[0].chauffeurs : 0) + '</div><div class="stat-label">Chauffeurs</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red"><i class="fas fa-coins"></i></div><div class="stat-info"><div class="stat-number">0 Ar</div><div class="stat-label">CA global</div></div></div>';
        
        document.getElementById('societesTable').innerHTML = societes.length ? societes.map(function(s) {
            var statusBadge = s.status === 'active' ? 'badge-success' : 'badge-warning';
            return '<tr><td><strong>' + s.name + '</strong></td>' +
                '<td>' + s.activite + '</td>' +
                '<td><span class="badge badge-info">' + s.vehicules + '</span></td>' +
                '<td><span class="badge badge-info">' + s.chauffeurs + '</span></td>' +
                '<td>' + s.ca.toLocaleString() + ' Ar</td>' +
                '<td><span class="badge ' + statusBadge + '">' + s.status + '</span></td>' +
                '<td class="action-btns">' +
                    '<button class="btn-sm btn-view" onclick="viewSociete(\'' + s.id + '\')"><i class="fas fa-eye"></i></button>' +
                    '<button class="btn-sm btn-edit" onclick="editSociete(\'' + s.id + '\')"><i class="fas fa-edit"></i></button>' +
                '</td></tr>';
        }).join('') : '<tr><td colspan="7">Aucune société</td></tr>';
    } catch(e) { console.error(e); }
}

function showAddSociete() {
    var h = '<div class="form-group"><label>Nom de la société *</label><input id="addSocieteName"></div>';
    h += '<div class="form-group"><label>Type d\'activité</label><select id="addActivite"><option>Transport urbain</option><option>Transport régional</option><option>Livraison colis</option><option>Livraison plats</option><option>Logistique</option><option>Mixte</option></select></div>';
    h += '<div class="form-group"><label>Adresse</label><input id="addAdresse"></div>';
    h += '<div class="form-group"><label>NIF</label><input id="addNif"></div>';
    h += '<div class="form-group"><label>STAT</label><input id="addStat"></div>';
    showModal('Nouvelle société', h, function() {
        var name = document.getElementById('addSocieteName').value;
        if (!name) return alert('Nom requis');
        alert('Société créée (API à implémenter)');
        closeModal(); loadSocietes();
    });
}

function viewSociete(id) {
    alert('Détail société (à implémenter)');
}

function editSociete(id) {
    alert('Modifier société (à implémenter)');
}
