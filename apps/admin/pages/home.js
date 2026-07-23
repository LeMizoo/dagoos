// ========================================
// ADMIN - HOME
// ========================================

function init_home() {
    var main = document.getElementById('mainInner');
    main.innerHTML = '<div class="topbar"><h1><i class="fas fa-chart-bar"></i> Tableau de bord</h1></div><div class="stats-grid" id="statsGrid"><div class="stat-card">Chargement...</div></div>';
    loadHomeStats();
    setInterval(loadHomeStats, 30000);
}

async function loadHomeStats() {
    try {
        var orgs = await apiGet('/organizations');
        var drivers = await apiGet('/drivers');
        var fleets = orgs.filter(function(o) { return o.type === 'FLEET_MANAGER'; }).length;
        var coops = orgs.filter(function(o) { return o.type === 'COOPERATIVE'; }).length;
        document.getElementById('statsGrid').innerHTML = 
            '<div class="stat-card"><div class="stat-icon blue"><i class="fas fa-dollar-sign"></i></div><div class="stat-info"><div class="stat-number">0 Ar</div><div class="stat-label">Revenus</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon green"><i class="fas fa-users"></i></div><div class="stat-info"><div class="stat-number">' + drivers.length + '</div><div class="stat-label">Chauffeurs</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-truck"></i></div><div class="stat-info"><div class="stat-number">' + fleets + '</div><div class="stat-label">Flottes</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red"><i class="fas fa-building"></i></div><div class="stat-info"><div class="stat-number">' + coops + '</div><div class="stat-label">Coops</div></div></div>';
        document.getElementById('fleetCount').textContent = fleets;
        document.getElementById('coopCount').textContent = coops;
        document.getElementById('driverCount').textContent = drivers.length;
    } catch (e) { console.error(e); }
}
