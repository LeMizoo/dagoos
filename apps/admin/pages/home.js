function init_home() {
    var main = document.getElementById('mainInner');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
            '<div><h1 style="font-size:22px;">Tableau de bord</h1><p style="color:var(--text2);font-size:13px;" id="currentDate"></p></div>' +
            '<div style="display:flex;align-items:center;gap:12px;">' +
                '<span id="apiStatus" style="font-size:11px;padding:4px 10px;border-radius:50px;"></span>' +
                '<button onclick="loadHomeStats()" style="padding:8px;background:var(--border);border:none;border-radius:8px;cursor:pointer;"><i class="fas fa-sync-alt"></i></button>' +
            '</div>' +
        '</div>' +
        '<div class="stats-grid" id="statsGrid" style="grid-template-columns:repeat(4,1fr);"></div>' +
        '<div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-top:20px;">' +
            '<div>' +
                '<div class="card"><div class="card-header"><h3><i class="fas fa-chart-line"></i> Repartition des plans</h3></div><div id="planChart" style="padding:20px;"></div></div>' +
                '<div class="card"><div class="card-header"><h3><i class="fas fa-clock"></i> Dernieres inscriptions</h3></div><div id="recentUsers" style="padding:0 18px 14px;max-height:250px;overflow-y:auto;"></div></div>' +
            '</div>' +
            '<div>' +
                '<div class="card" style="background:linear-gradient(135deg,#1A5276,#154360);color:white;padding:24px;text-align:center;">' +
                    '<div style="font-size:48px;font-weight:900;" id="totalFleets">0</div><div style="font-size:14px;">Flottes</div>' +
                    '<div style="margin-top:12px;font-size:36px;font-weight:900;" id="totalCoops">0</div><div style="font-size:14px;">Cooperatives</div>' +
                '</div>' +
                '<div class="card" style="background:linear-gradient(135deg,#F1C40F,#F39C12);color:#1A1A2E;padding:24px;text-align:center;margin-top:16px;">' +
                    '<div style="font-size:48px;font-weight:900;" id="totalDrivers">0</div><div style="font-size:14px;">Chauffeurs</div>' +
                '</div>' +
                '<div class="card" style="padding:16px;margin-top:16px;text-align:center;">' +
                    '<div style="font-size:12px;color:var(--text2);">Revenus estimes</div>' +
                    '<div style="font-size:28px;font-weight:900;color:#27AE60;">0 Ar</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    loadHomeStats();
    setInterval(loadHomeStats, 30000);
}

async function loadHomeStats() {
    var now = new Date();
    var el = document.getElementById('currentDate');
    if (el) el.textContent = now.toLocaleDateString('fr', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    try {
        var orgs = await apiGet('/organizations');
        var drivers = await apiGet('/drivers');
        var users = await apiGet('/users');
        
        var fleets = orgs.filter(function(o) { return o.type === 'FLEET_MANAGER'; });
        var coops = orgs.filter(function(o) { return o.type === 'COOPERATIVE'; });
        
        // Stats grid
        var statsGrid = document.getElementById('statsGrid');
        if (statsGrid) {
            var pending = orgs.filter(function(o) { return o.status === 'pending'; }).length;
            var suspended = orgs.filter(function(o) { return o.status === 'suspended'; }).length;
            var active = orgs.filter(function(o) { return o.status === 'active'; }).length;
            statsGrid.innerHTML = 
                '<div class="stat-card"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div><div class="stat-info"><div class="stat-number">' + active + '</div><div class="stat-label">Actifs</div></div></div>' +
                '<div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-clock"></i></div><div class="stat-info"><div class="stat-number">' + pending + '</div><div class="stat-label">En attente</div></div></div>' +
                '<div class="stat-card"><div class="stat-icon red"><i class="fas fa-ban"></i></div><div class="stat-info"><div class="stat-number">' + suspended + '</div><div class="stat-label">Suspendus</div></div></div>' +
                '<div class="stat-card"><div class="stat-icon blue"><i class="fas fa-globe"></i></div><div class="stat-info"><div class="stat-number">' + users.length + '</div><div class="stat-label">Utilisateurs</div></div></div>';
        }
        
        // Compteurs
        var elF = document.getElementById('totalFleets');
        var elC = document.getElementById('totalCoops');
        var elD = document.getElementById('totalDrivers');
        if (elF) elF.textContent = fleets.length;
        if (elC) elC.textContent = coops.length;
        if (elD) elD.textContent = drivers.length;
        
        // Sidebar counts
        ['fleetCount','coopCount','driverCount'].forEach(function(id) {
            var e = document.getElementById(id);
            if (e) e.textContent = id === 'driverCount' ? drivers.length : (id === 'fleetCount' ? fleets.length : coops.length);
        });
        
        // Plan chart
        var planChart = document.getElementById('planChart');
        if (planChart) {
            var plans = {};
            orgs.forEach(function(o) { plans[o.plan] = (plans[o.plan] || 0) + 1; });
            var maxVal = Math.max.apply(null, Object.values(plans).concat([1]));
            planChart.innerHTML = Object.keys(plans).map(function(p) {
                var pct = Math.round((plans[p] / orgs.length) * 100);
                return '<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;"><span>' + p + '</span><span>' + plans[p] + ' (' + pct + '%)</span></div><div style="background:var(--border);border-radius:50px;height:8px;"><div style="background:#1A5276;height:100%;border-radius:50px;width:' + pct + '%;"></div></div></div>';
            }).join('');
        }
        
        // Recent users
        var recentUsers = document.getElementById('recentUsers');
        if (recentUsers) {
            recentUsers.innerHTML = users.slice(-6).reverse().map(function(u) {
                return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);"><div style="width:32px;height:32px;border-radius:50%;background:#DBEAFE;color:#1A5276;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;">' + (u.name || '?')[0].toUpperCase() + '</div><div><strong>' + (u.name || 'N/A') + '</strong><br><span style="font-size:10px;color:var(--text2);">' + u.role + ' - ' + new Date(u.createdAt).toLocaleDateString('fr') + '</span></div></div>';
            }).join('') || '<p style="color:var(--text2);text-align:center;">Aucun</p>';
        }
        
        var apiEl = document.getElementById('apiStatus');
        if (apiEl) { apiEl.innerHTML = '<i class="fas fa-circle" style="color:#27AE60;font-size:8px;"></i> API Online'; apiEl.style.background = '#D1FAE5'; apiEl.style.color = '#065F46'; }
    } catch(e) { console.error(e); }
}
