function init_contrats() {
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
            '<h1>📝 Contrats</h1>' +
            '<button class="btn btn-primary" onclick="showAddContrat()">➕ Nouveau contrat</button>' +
        '</div>' +
        '<div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px;">' +
            '<div class="stat-card"><div class="stat-icon green">✅</div><div class="stat-info"><div class="stat-number" id="statActifs">0</div><div class="stat-label">Actifs</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon yellow">🕐</div><div class="stat-info"><div class="stat-number" id="statExpire">0</div><div class="stat-label">Expire bientôt</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red">🚫</div><div class="stat-info"><div class="stat-number" id="statResilies">0</div><div class="stat-label">Résiliés</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon blue">💰</div><div class="stat-info"><div class="stat-number" id="statCA">0 Ar</div><div class="stat-label">CA contrats</div></div></div>' +
        '</div>' +
        '<div class="card"><table><thead><tr><th>Client</th><th>Type</th><th>Début</th><th>Fin</th><th>Montant</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="contratsTable"><tr><td colspan="7">Chargement...</td></tr></tbody></table></div>';
    loadContrats();
}

async function loadContrats() {
    try {
        var contrats = await apiGet('/contrats');
        var actifs = 0, expire = 0, resilies = 0, totalCA = 0;
        
        contrats.forEach(function(c) {
            if (c.statut === 'actif') actifs++;
            else if (c.statut === 'expire_bientot') expire++;
            else if (c.statut === 'resilie') resilies++;
            totalCA += c.montant || 0;
        });
        
        document.getElementById('statActifs').textContent = actifs;
        document.getElementById('statExpire').textContent = expire;
        document.getElementById('statResilies').textContent = resilies;
        document.getElementById('statCA').textContent = totalCA.toLocaleString() + ' Ar';
        
        document.getElementById('contratsTable').innerHTML = contrats.length ? contrats.map(function(c) {
            var statutBadge = c.statut === 'actif' ? 'badge-success' : c.statut === 'expire_bientot' ? 'badge-warning' : 'badge-danger';
            var statutLabel = c.statut === 'actif' ? 'Actif' : c.statut === 'expire_bientot' ? 'Expire bientôt' : 'Résilié';
            return '<tr><td><strong>' + c.client + '</strong></td>' +
                '<td>' + c.type + '</td>' +
                '<td>' + (c.dateDebut ? new Date(c.dateDebut).toLocaleDateString('fr-FR') : 'N/A') + '</td>' +
                '<td>' + (c.dateFin ? new Date(c.dateFin).toLocaleDateString('fr-FR') : 'N/A') + '</td>' +
                '<td><strong>' + (c.montant || 0).toLocaleString() + ' Ar</strong></td>' +
                '<td><span class="badge ' + statutBadge + '">' + statutLabel + '</span></td>' +
                '<td class="action-btns">' +
                    '<button class="btn-sm btn-view" onclick="viewContrat(\'' + c.id + '\')">👁</button>' +
                    '<button class="btn-sm btn-edit" onclick="editContrat(\'' + c.id + '\')">✏️</button>' +
                    '<button class="btn-sm btn-suspend" onclick="resilierContrat(\'' + c.id + '\')">🚫</button>' +
                '</td></tr>';
        }).join('') : '<tr><td colspan="7">Aucun contrat</td></tr>';
    } catch(e) { console.error(e); }
}

function showAddContrat() {
    apiGet('/societes').then(function(societes) {
        var h = '<div class="form-group"><label>Société</label><select id="addSocieteId">';
        societes.forEach(function(s) { h += '<option value="' + s.id + '">' + s.name + '</option>'; });
        h += '</select></div>';
        h += '<div class="form-group"><label>Client *</label><input id="addClient"></div>';
        h += '<div class="form-group"><label>Type</label><select id="addType"><option>Transport scolaire</option><option>Transport régulier</option><option>Livraison plats</option><option>Livraison colis</option><option>Logistique</option><option>Événementiel</option></select></div>';
        h += '<div class="form-group"><label>Date début</label><input type="date" id="addDebut"></div>';
        h += '<div class="form-group"><label>Date fin</label><input type="date" id="addFin"></div>';
        h += '<div class="form-group"><label>Montant (Ar)</label><input type="number" id="addMontant" value="0"></div>';
        h += '<div class="form-group"><label>Description</label><textarea id="addDesc" rows="2" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></textarea></div>';
        showModal('Nouveau contrat', h, function() {
            var client = document.getElementById('addClient').value;
            if (!client) return alert('Client requis');
            apiPost('/contrats', {
                societeId: document.getElementById('addSocieteId').value,
                client: client,
                type: document.getElementById('addType').value,
                description: document.getElementById('addDesc').value,
                dateDebut: document.getElementById('addDebut').value,
                dateFin: document.getElementById('addFin').value,
                montant: document.getElementById('addMontant').value
            }).then(function() { closeModal(); loadContrats(); });
        });
    });
}

function viewContrat(id) {
    apiGet('/contrats').then(function(contrats) {
        var c = contrats.find(function(x) { return x.id === id; });
        if (!c) return;
        showModal('Contrat ' + c.client,
            '<p><strong>Client:</strong> ' + c.client + '</p>' +
            '<p><strong>Type:</strong> ' + c.type + '</p>' +
            '<p><strong>Période:</strong> ' + new Date(c.dateDebut).toLocaleDateString('fr-FR') + ' - ' + new Date(c.dateFin).toLocaleDateString('fr-FR') + '</p>' +
            '<p><strong>Montant:</strong> ' + (c.montant || 0).toLocaleString() + ' Ar</p>' +
            '<p><strong>Statut:</strong> ' + c.statut + '</p>' +
            '<p><strong>Description:</strong> ' + (c.description || 'N/A') + '</p>');
    });
}

function editContrat(id) {
    apiGet('/contrats').then(function(contrats) {
        var c = contrats.find(function(x) { return x.id === id; });
        if (!c) return;
        var h = '<div class="form-group"><label>Client</label><input id="editClient" value="' + c.client + '"></div>';
        h += '<div class="form-group"><label>Montant</label><input type="number" id="editMontant" value="' + (c.montant || 0) + '"></div>';
        h += '<div class="form-group"><label>Date fin</label><input type="date" id="editFin" value="' + (c.dateFin || '') + '"></div>';
        h += '<div class="form-group"><label>Statut</label><select id="editStatut"><option ' + (c.statut === 'actif' ? 'selected' : '') + '>actif</option><option ' + (c.statut === 'expire_bientot' ? 'selected' : '') + '>expire_bientot</option><option ' + (c.statut === 'resilie' ? 'selected' : '') + '>resilie</option></select></div>';
        showModal('Modifier contrat', h, function() {
            apiPut('/contrats/' + id, {
                client: document.getElementById('editClient').value,
                montant: document.getElementById('editMontant').value,
                dateFin: document.getElementById('editFin').value,
                statut: document.getElementById('editStatut').value
            }).then(function() { closeModal(); loadContrats(); });
        });
    });
}

function resilierContrat(id) {
    if (confirm('Résilier ce contrat ?')) {
        apiPut('/contrats/' + id, { statut: 'resilie' }).then(function() { loadContrats(); });
    }
}
