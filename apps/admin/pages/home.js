function init_home() {
    var main = document.getElementById('mainInner');
    main.innerHTML = '<div class="topbar"><h1><i class="fas fa-chart-bar"></i> Tableau de bord</h1><span id="apiStatus" style="font-size:12px;padding:4px 10px;border-radius:50px;"></span></div><div class="stats-grid" id="statsGrid"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;"><div class="card"><div class="card-header"><h3><i class="fas fa-clock"></i> Inscriptions recentes</h3></div><div id="recentUsers" style="padding:0 18px 14px;max-height:280px;overflow-y:auto;"></div></div><div class="card"><div class="card-header"><h3><i class="fas fa-motorcycle"></i> Chauffeurs</h3></div><div id="recentDrivers" style="padding:0 18px 14px;max-height:280px;overflow-y:auto;"></div></div></div>';
    loadHomeStats();
    setInterval(loadHomeStats, 30000);
}

async function loadHomeStats() {
    try {
        var orgs = await apiGet('/organizations');
        var drivers = await apiGet('/drivers');
        var users = await apiGet('/users');
        var fleets = orgs.filter(function(o) { return o.type === 'FLEET_MANAGER'; }).length;
        var coops = orgs.filter(function(o) { return o.type === 'COOPERATIVE'; }).length;
        document.getElementById('statsGrid').innerHTML = 
            '<div class="stat-card"><div class="stat-icon blue"><i class="fas fa-coins"></i></div><div class="stat-info"><div class="stat-number">0 Ar</div><div class="stat-label">Revenus</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon green"><i class="fas fa-users"></i></div><div class="stat-info"><div class="stat-number">' + drivers.length + '</div><div class="stat-label">Chauffeurs</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-truck"></i></div><div class="stat-info"><div class="stat-number">' + fleets + '</div><div class="stat-label">Flottes</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red"><i class="fas fa-building"></i></div><div class="stat-info"><div class="stat-number">' + coops + '</div><div class="stat-label">Coops</div></div></div>';
        document.getElementById('fleetCount').textContent = fleets;
        document.getElementById('coopCount').textContent = coops;
        document.getElementById('driverCount').textContent = drivers.length;
        document.getElementById('recentUsers').innerHTML = users.slice(-5).reverse().map(function(u) {
            return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);"><strong>' + (u.name || 'N/A') + '</strong> - <span style="color:var(--text2);">' + u.role + '</span></div>';
        }).join('') || '<p style="color:var(--text2);text-align:center;">Aucun</p>';
        document.getElementById('recentDrivers').innerHTML = drivers.slice(0,5).map(function(d) {
            return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);"><code>' + d.driverCode + '</code> ' + (d.user ? d.user.name : 'N/A') + '</div>';
        }).join('') || '<p style="color:var(--text2);text-align:center;">Aucun</p>';
        var apiEl = document.getElementById('apiStatus');
        if (apiEl) { apiEl.innerHTML = '<i class="fas fa-circle" style="color:#27AE60;font-size:8px;"></i> API Online'; apiEl.style.background = '#D1FAE5'; apiEl.style.color = '#065F46'; }
    } catch(e) { console.error(e); }
}
