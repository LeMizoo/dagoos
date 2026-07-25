function init_finances() {
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
            '<h1><i class="fas fa-coins"></i> Finances</h1>' +
            '<span id="apiStatus" style="font-size:10px;padding:3px 8px;border-radius:50px;"></span>' +
        '</div>' +
        '<div class="stats-grid" id="financeStats" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px;"></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">' +
            '<div class="card"><div class="card-header"><h3><i class="fas fa-chart-line"></i> CA vs Dépenses (7 jours)</h3></div><div id="caChart" style="padding:16px;text-align:center;color:var(--text2);">Données disponibles après enregistrement des courses</div></div>' +
            '<div class="card"><div class="card-header"><h3><i class="fas fa-chart-pie"></i> Répartition des revenus</h3></div><div id="repartitionChart" style="padding:16px;text-align:center;color:var(--text2);">Par type de véhicule</div></div>' +
        '</div>' +
        '<div class="card"><div class="card-header"><h3><i class="fas fa-history"></i> Dernières transactions</h3></div>' +
        '<table><thead><tr><th>Date</th><th>Chauffeur</th><th>Véhicule</th><th>Type</th><th>Montant</th></tr></thead><tbody id="txTable"><tr><td colspan="5">Aucune transaction</td></tr></tbody></table></div>';
    loadFinances();
}

async function loadFinances() {
    var vehicles = await apiGet('/vehicles');
    var drivers = await apiGet('/drivers');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var myDrivers = drivers.filter(function(d) { return d.organization && d.organization.email === user.email; });
    
    document.getElementById('financeStats').innerHTML = 
        '<div class="stat-card"><div class="stat-icon green"><i class="fas fa-coins"></i></div><div class="stat-info"><div class="stat-number">0 Ar</div><div class="stat-label">CA aujourd\'hui</div></div></div>' +
        '<div class="stat-card"><div class="stat-icon blue"><i class="fas fa-calendar-week"></i></div><div class="stat-info"><div class="stat-number">0 Ar</div><div class="stat-label">CA cette semaine</div></div></div>' +
        '<div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-calendar-alt"></i></div><div class="stat-info"><div class="stat-number">0 Ar</div><div class="stat-label">CA ce mois</div></div></div>' +
        '<div class="stat-card"><div class="stat-icon red"><i class="fas fa-chart-pie"></i></div><div class="stat-info"><div class="stat-number">0%</div><div class="stat-label">Marge brute</div></div></div>';
}
