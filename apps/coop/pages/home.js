function init_home() {
    var main = document.getElementById('mainContent');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    main.innerHTML = '<div class="topbar"><div><h1>👋 Bienvenue, ' + (user.name || '') + '</h1><p id="orgName" style="color:#6C757D;">Chargement...</p></div><div class="user-info"><div class="user-avatar">' + (user.name || 'C')[0].toUpperCase() + '</div></div></div>' +
        '<div class="stats-grid">' +
            '<div class="stat-card"><div class="stat-icon blue"><i class="fas fa-box"></i></div><div class="stat-info"><div class="number">0</div><div class="stat-label">Livraisons</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon green"><i class="fas fa-users"></i></div><div class="stat-info"><div class="number" id="statDrivers">-</div><div class="stat-label">Livreurs</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-motorcycle"></i></div><div class="stat-info"><div class="number">0</div><div class="stat-label">Véhicules</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red"><i class="fas fa-dollar-sign"></i></div><div class="stat-info"><div class="number">0 Ar</div><div class="stat-label">Revenus</div></div></div>' +
        '</div>';
    loadHomeData();
}

async function loadHomeData() {
    try {
        var orgs = await apiGet('/organizations');
        var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
        var org = orgs.find(function(o) { return o.email === user.email; });
        if (org) document.getElementById('orgName').textContent = '<i class="fas fa-building"></i> ' + org.name + ' (' + (org.plan || 'Freemium') + ')';
        var drivers = await apiGet('/drivers');
        var myDrivers = drivers.filter(function(d) { return d.organization && d.organization.email === user.email; });
        document.getElementById('statDrivers').textContent = myDrivers.length;
    } catch(e) { console.error(e); }
}
