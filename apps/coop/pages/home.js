function init_home() {
    var main = document.getElementById('mainContent');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    main.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
        '<div><h1><i class="fas fa-chart-pie"></i> Tableau de bord</h1><p style="color:var(--text2);">Bienvenue, ' + (user.name || '') + '</p></div></div>' +
        '<div class="stats-grid"><div class="stat-card"><div class="stat-icon green"><i class="fas fa-box"></i></div><div class="stat-info"><div class="stat-number" id="coopLivraisons">-</div><div class="stat-label">Livraisons</div></div></div>' +
        '<div class="stat-card"><div class="stat-icon blue"><i class="fas fa-users"></i></div><div class="stat-info"><div class="stat-number" id="statDrivers">-</div><div class="stat-label">Livreurs</div></div></div>' +
        '<div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-motorcycle"></i></div><div class="stat-info"><div class="stat-number" id="coopVehicules">-</div><div class="stat-label">Véhicules</div></div></div>' +
        '<div class="stat-card"><div class="stat-icon red"><i class="fas fa-coins"></i></div><div class="stat-info"><div class="stat-number" id="coopRevenus">-</div><div class="stat-label">Revenus</div></div></div></div>';
    loadHomeData();
}
async function loadHomeData() {
    var drivers = await apiGet('/drivers');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var myDrivers = drivers.filter(function(d) { return d.organization && d.organization.email === user.email; });
    document.getElementById('statDrivers').textContent = myDrivers.length;
}
