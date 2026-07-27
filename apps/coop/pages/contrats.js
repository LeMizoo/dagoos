function init_contrats() {
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
            '<h1><i class="fas fa-file-contract"></i> Contrats</h1>' +
            '<button class="btn btn-primary" onclick="showAddContrat()"><i class="fas fa-plus"></i> Nouveau contrat</button>' +
        '</div>' +
        '<div class="stats-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px;">' +
            '<div class="stat-card"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div><div class="stat-info"><div class="stat-number" id="statActifs">0</div><div class="stat-label">Contrats actifs</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-clock"></i></div><div class="stat-info"><div class="stat-number" id="statExpire">0</div><div class="stat-label">Expire bientôt</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red"><i class="fas fa-ban"></i></div><div class="stat-info"><div class="stat-number" id="statResilies">0</div><div class="stat-label">Résiliés</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon blue"><i class="fas fa-coins"></i></div><div class="stat-info"><div class="stat-number" id="statCA">0 Ar</div><div class="stat-label">CA contrats</div></div></div>' +
        '</div>' +
        '<div class="card"><div class="card-header"><h3><i class="fas fa-list"></i> Liste des contrats</h3></div>' +
        '<table><thead><tr><th>N°</th><th>Client</th><th>Société</th><th>Type</th><th>Début</th><th>Fin</th><th>Montant</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="contratsTable"><tr><td colspan="9">Chargement...</td></tr></tbody></table></div>';
    loadContrats();
}

var contratsData = [];

async function loadContrats() {
    try {
        var res = await apiGet('/contrats');
        contratsData = res || [];
        renderContrats();
    } catch(e) {
        // Données de démonstration en attendant l'API
        contratsData = [
            { id: '1', client: 'École Les Flamboyants', societe: 'Coop Tana', type: 'Transport scolaire', dateDebut: '2026-01-01', dateFin: '2026-12-31', montant: 1200000, statut: 'actif' },
            { id: '2', client: 'Restaurant Le Gourmet', societe: 'Coop Tana', type: 'Livraison plats', dateDebut: '2026-03-01', dateFin: '2026-08-31', montant: 600000, statut: 'actif' },
            { id: '3', client: 'Société Logistique Express', societe: 'Coop Tana', type: 'Logistique', dateDebut: '2026-06-01', dateFin: '2027-06-01', montant: 2400000, statut: 'expire_bientot' }
        ];
        renderContrats();
    }
}

function renderContrats() {
    var html = '';
    var actifs = 0, expire = 0, resilies = 0, totalCA = 0;
    
    contratsData.forEach(function(c) {
        if (c.statut === 'actif') actifs++;
        else if (c.statut === 'expire_bientot') expire++;
        else if (c.statut === 'resilie') resilies++;
        totalCA += c.montant || 0;
        
        var statutBadge = c.statut === 'actif' ? 'badge-success' : c.statut === 'expire_bientot' ? 'badge-warning' : 'badge-danger';
        var statutLabel = c.statut === 'actif' ? 'Actif' : c.statut === 'expire_bientot' ? 'Expire bientôt' : 'Résilié';
        
        html += '<tr>' +
            '<td><code>#' + c.id + '</code></td>' +
            '<td><strong>' + c.client + '</strong></td>' +
            '<td>' + c.societe + '</td>' +
            '<td>' + c.type + '</td>' +
            '<td>' + new Date(c.dateDebut).toLocaleDateString('fr-FR') + '</td>' +
            '<td>' + new Date(c.dateFin).toLocaleDateString('fr-FR') + '</td>' +
            '<td><strong>' + (c.montant || 0).toLocaleString() + ' Ar</strong></td>' +
            '<td><span class="badge ' + statutBadge + '">' + statutLabel + '</span></td>' +
            '<td class="action-btns">' +
                '<button class="btn-sm btn-view" onclick="viewContrat(\'' + c.id + '\')"><i class="fas fa-eye"></i></button>' +
                '<button class="btn-sm btn-edit" onclick="editContrat(\'' + c.id + '\')"><i class="fas fa-edit"></i></button>' +
            '</td></tr>';
    });
    
    document.getElementById('contratsTable').innerHTML = html || '<tr><td colspan="9">Aucun contrat</td></tr>';
    document.getElementById('statActifs').textContent = actifs;
    document.getElementById('statExpire').textContent = expire;
    document.getElementById('statResilies').textContent = resilies;
    document.getElementById('statCA').textContent = totalCA.toLocaleString() + ' Ar';
}

function showAddContrat() {
    var h = '<div class="form-group"><label>Client *</label><input id="addClient"></div>';
    h += '<div class="form-group"><label>Type de contrat</label><select id="addType"><option>Transport scolaire</option><option>Transport régulier</option><option>Livraison plats</option><option>Livraison colis</option><option>Logistique</option><option>Événementiel</option></select></div>';
    h += '<div class="form-group"><label>Date début</label><input type="date" id="addDebut"></div>';
    h += '<div class="form-group"><label>Date fin</label><input type="date" id="addFin"></div>';
    h += '<div class="form-group"><label>Montant mensuel (Ar)</label><input type="number" id="addMontant" value="0"></div>';
    h += '<div class="form-group"><label>Description</label><textarea id="addDesc" rows="2" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></textarea></div>';
    showModal('Nouveau contrat', h, function() {
        var client = document.getElementById('addClient').value;
        if (!client) return alert('Client requis');
        alert('Contrat créé ! (API à implémenter)');
        closeModal(); loadContrats();
    });
}

function viewContrat(id) {
    var c = contratsData.find(function(x) { return x.id === id; });
    if (!c) return;
    showModal('Contrat #' + c.id,
        '<p><strong>Client:</strong> ' + c.client + '</p>' +
        '<p><strong>Type:</strong> ' + c.type + '</p>' +
        '<p><strong>Période:</strong> ' + new Date(c.dateDebut).toLocaleDateString('fr-FR') + ' - ' + new Date(c.dateFin).toLocaleDateString('fr-FR') + '</p>' +
        '<p><strong>Montant:</strong> ' + (c.montant || 0).toLocaleString() + ' Ar</p>' +
        '<p><strong>Statut:</strong> ' + c.statut + '</p>');
}

function editContrat(id) { alert('Modifier contrat (à implémenter)'); }
