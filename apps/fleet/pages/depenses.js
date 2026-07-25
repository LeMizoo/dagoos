function init_depenses() {
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
            '<h1><i class="fas fa-receipt"></i> Dépenses</h1>' +
            '<button class="btn btn-primary" onclick="showAddDepense()"><i class="fas fa-plus"></i> Nouvelle dépense</button>' +
        '</div>' +
        '<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px;">' +
            '<div class="stat-card"><div class="stat-info"><div class="stat-number">0 Ar</div><div class="stat-label">Aujourd\'hui</div></div></div>' +
            '<div class="stat-card"><div class="stat-info"><div class="stat-number">0 Ar</div><div class="stat-label">Cette semaine</div></div></div>' +
            '<div class="stat-card"><div class="stat-info"><div class="stat-number">0 Ar</div><div class="stat-label">Ce mois</div></div></div>' +
        '</div>' +
        '<div class="card"><div class="card-header"><h3><i class="fas fa-list"></i> Dépenses récentes</h3></div>' +
        '<table><thead><tr><th>Date</th><th>Catégorie</th><th>Description</th><th>Montant</th></tr></thead><tbody id="depensesTable"><tr><td colspan="4">Aucune dépense</td></tr></tbody></table></div>';
}

function showAddDepense() {
    var h = '<div class="form-group"><label>Catégorie</label><select id="depCat"><option>Carburant</option><option>Maintenance</option><option>Assurance</option><option>Salaire</option><option>Autre</option></select></div>';
    h += '<div class="form-group"><label>Description</label><input id="depDesc"></div>';
    h += '<div class="form-group"><label>Montant (Ar)</label><input type="number" id="depMontant"></div>';
    showModal('Nouvelle dépense', h, function() {
        alert('Dépense enregistrée ! (simulation)');
        closeModal();
    });
}
