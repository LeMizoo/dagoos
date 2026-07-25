function init_home() {
    var main = document.getElementById('mainInner');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">' +
            '<div><h1 style="font-size:20px;"><i class="fas fa-tachometer-alt"></i> Tableau de bord</h1><p style="color:var(--text2);font-size:12px;" id="currentDate"></p></div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                '<button class="btn btn-sm btn-primary" onclick="loadPage(\'fleets\')"><i class="fas fa-file-alt"></i> Flottes</button>' +
                '<button class="btn btn-sm" style="background:#27AE60;color:white;" onclick="loadPage(\'drivers\')"><i class="fas fa-clock"></i> Chauffeurs</button>' +
                '<button class="btn btn-sm" style="background:#3498DB;color:white;" onclick="loadPage(\'payments\')"><i class="fas fa-coins"></i> Finances</button>' +
            '</div>' +
        '</div>' +
        
        // CATÉGORIE : STATS GÉNÉRALES
        '<div style="background:rgba(26,82,118,0.05);padding:8px 14px;border-radius:10px;border-left:3px solid #1A5276;margin-bottom:14px;display:flex;align-items:center;gap:8px;">' +
            '<i class="fas fa-chart-pie" style="color:#1A5276;"></i><span style="font-weight:600;font-size:13px;color:#1A5276;">Statistiques générales</span>' +
            '<span style="background:#1A5276;color:white;padding:1px 8px;border-radius:10px;font-size:10px;" id="totalOrgs">0 organisations</span>' +
        '</div>' +
        '<div class="stats-grid" id="statsGrid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px;"></div>' +
        
        // CATÉGORIE : FLOTTES & COOPS
        '<div style="background:rgba(39,174,96,0.05);padding:8px 14px;border-radius:10px;border-left:3px solid #27AE60;margin-bottom:14px;display:flex;align-items:center;gap:8px;">' +
            '<i class="fas fa-building" style="color:#27AE60;"></i><span style="font-weight:600;font-size:13px;color:#27AE60;">Flottes & Coopératives</span>' +
            '<a href="#" onclick="loadPage(\'fleets\')" style="margin-left:auto;font-size:11px;color:#1A5276;">Voir tout <i class="fas fa-arrow-right"></i></a>' +
        '</div>' +
        '<div class="stats-grid" id="orgsGrid" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px;"></div>' +
        
        // CATÉGORIE : ALERTES
        '<div style="background:rgba(231,76,60,0.05);padding:8px 14px;border-radius:10px;border-left:3px solid #E74C3C;margin-bottom:14px;display:flex;align-items:center;gap:8px;">' +
            '<i class="fas fa-bell" style="color:#E74C3C;"></i><span style="font-weight:600;font-size:13px;color:#E74C3C;">Alertes & Actions</span>' +
        '</div>' +
        '<div class="stats-grid" id="alertsGrid" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px;"></div>' +
        
        // GRAPHIQUES
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">' +
            '<div class="card"><div class="card-header"><h3><i class="fas fa-chart-bar"></i> Répartition des plans</h3></div><div id="planChart" style="padding:16px;"></div></div>' +
            '<div class="card"><div class="card-header"><h3><i class="fas fa-chart-pie"></i> Flottes vs Coops</h3></div><div id="typeChart" style="padding:16px;"></div></div>' +
        '</div>' +
        
        // DERNIÈRES INSCRIPTIONS
        '<div class="card"><div class="card-header"><h3><i class="fas fa-clock"></i> Dernières inscriptions</h3><a href="#" onclick="loadPage(\'fleets\')" style="font-size:11px;color:#1A5276;">Voir tout <i class="fas fa-arrow-right"></i></a></div>' +
        '<div style="overflow-x:auto;"><table><thead><tr><th>Date</th><th>Nom</th><th>Email</th><th>Type</th><th>Plan</th><th>Statut</th></tr></thead><tbody id="recentOrgs"></tbody></table></div></div>' +
        
        '<div style="text-align:center;padding:8px;font-size:10px;color:var(--text2);">Dashboard Admin · Auto-refresh 30s</div>';
    
    loadHomeStats();
    setInterval(loadHomeStats, 30000);
}

async function loadHomeStats() {
    var now = new Date();
    document.getElementById('currentDate').textContent = now.toLocaleDateString('fr', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' | ' + now.toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' });
    
    try {
        var orgs = await apiGet('/organizations');
        var drivers = await apiGet('/drivers');
        var users = await apiGet('/users');
        
        var fleets = orgs.filter(function(o) { return o.type === 'FLEET_MANAGER'; });
        var coops = orgs.filter(function(o) { return o.type === 'COOPERATIVE'; });
        var pending = orgs.filter(function(o) { return o.status === 'pending'; });
        var suspended = orgs.filter(function(o) { return o.status === 'suspended'; });
        var active = orgs.filter(function(o) { return o.status === 'active'; });
        var rejected = orgs.filter(function(o) { return o.status === 'rejected'; });
        
        // Stats générales
        document.getElementById('statsGrid').innerHTML = 
            '<div class="stat-card stat-card-clickable" onclick="loadPage(\'fleets\')"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div><div class="stat-info"><div class="stat-number">' + active.length + '</div><div class="stat-label">Organisations actives</div></div></div>' +
            '<div class="stat-card stat-card-clickable" onclick="loadPage(\'fleets\')"><div class="stat-icon yellow"><i class="fas fa-clock"></i></div><div class="stat-info"><div class="stat-number">' + pending.length + '</div><div class="stat-label">En attente</div></div></div>' +
            '<div class="stat-card stat-card-clickable" onclick="loadPage(\'drivers\')"><div class="stat-icon blue"><i class="fas fa-users"></i></div><div class="stat-info"><div class="stat-number">' + drivers.length + '</div><div class="stat-label">Chauffeurs</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red"><i class="fas fa-globe"></i></div><div class="stat-info"><div class="stat-number">' + users.length + '</div><div class="stat-label">Utilisateurs</div></div></div>';
        
        // Flottes & Coops
        document.getElementById('orgsGrid').innerHTML = 
            '<div class="stat-card stat-card-clickable" onclick="loadPage(\'fleets\')"><div class="stat-icon" style="font-size:24px;">🚛</div><div class="stat-info"><div class="stat-number">' + fleets.length + '</div><div class="stat-label">Flottes</div></div></div>' +
            '<div class="stat-card stat-card-clickable" onclick="loadPage(\'coops\')"><div class="stat-icon" style="font-size:24px;">🏢</div><div class="stat-info"><div class="stat-number">' + coops.length + '</div><div class="stat-label">Coopératives</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red"><i class="fas fa-ban"></i></div><div class="stat-info"><div class="stat-number">' + suspended.length + '</div><div class="stat-label">Suspendus</div></div></div>';
        
        // Alertes
        document.getElementById('alertsGrid').innerHTML = 
            '<div class="stat-card stat-card-clickable" onclick="loadPage(\'fleets\')" style="border-left:3px solid #F39C12;' + (pending.length > 0 ? 'animation:pulse 1.5s infinite;' : '') + '"><div class="stat-icon yellow"><i class="fas fa-exclamation-triangle"></i></div><div class="stat-info"><div class="stat-number" style="color:' + (pending.length > 0 ? '#F39C12' : '#27AE60') + ';">' + pending.length + '</div><div class="stat-label">' + (pending.length > 0 ? '⚠️ En attente de validation' : '✅ Tout est validé') + '</div></div></div>' +
            '<div class="stat-card" style="border-left:3px solid #E74C3C;"><div class="stat-icon red"><i class="fas fa-times-circle"></i></div><div class="stat-info"><div class="stat-number">' + rejected.length + '</div><div class="stat-label">Rejetés</div></div></div>' +
            '<div class="stat-card stat-card-clickable" onclick="loadPage(\'messages\')"><div class="stat-icon blue"><i class="fas fa-envelope"></i></div><div class="stat-info"><div class="stat-number" id="unreadMsgs">0</div><div class="stat-label">Messages non lus</div></div></div>';
        
        // Compteurs sidebar
        ['fleetCount','coopCount','driverCount'].forEach(function(id) {
            var e = document.getElementById(id);
            if (e) e.textContent = id === 'driverCount' ? drivers.length : (id === 'fleetCount' ? fleets.length : coops.length);
        });
        document.getElementById('totalOrgs').textContent = orgs.length + ' organisations';
        
        // Graphique plans
        var plans = {};
        orgs.forEach(function(o) { plans[o.plan] = (plans[o.plan] || 0) + 1; });
        var planChart = document.getElementById('planChart');
        if (planChart) {
            planChart.innerHTML = Object.keys(plans).map(function(p) {
                var pct = Math.round((plans[p] / orgs.length) * 100);
                var colors = { Freemium: '#3498DB', Basic: '#27AE60', Standard: '#F39C12', Premium: '#E74C3C' };
                return '<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;"><span>' + p + '</span><span><strong>' + plans[p] + '</strong> (' + pct + '%)</span></div><div style="background:var(--border);border-radius:50px;height:8px;"><div style="background:' + (colors[p] || '#1A5276') + ';height:100%;border-radius:50px;width:' + pct + '%;"></div></div></div>';
            }).join('');
        }
        
        // Graphique type
        var typeChart = document.getElementById('typeChart');
        if (typeChart) {
            var total = fleets.length + coops.length || 1;
            var fleetPct = Math.round((fleets.length / total) * 100);
            var coopPct = 100 - fleetPct;
            typeChart.innerHTML = 
                '<div style="display:flex;justify-content:center;gap:40px;text-align:center;">' +
                    '<div><div style="width:80px;height:80px;border-radius:50%;background:conic-gradient(#1A5276 ' + fleetPct * 3.6 + 'deg, #27AE60 0);margin:0 auto 8px;"></div><strong>🚛 Flottes</strong><br>' + fleets.length + ' (' + fleetPct + '%)</div>' +
                    '<div><div style="width:80px;height:80px;border-radius:50%;background:conic-gradient(#27AE60 ' + coopPct * 3.6 + 'deg, #1A5276 0);margin:0 auto 8px;"></div><strong>🏢 Coops</strong><br>' + coops.length + ' (' + coopPct + '%)</div>' +
                '</div>';
        }
        
        // Dernières inscriptions
        var recentOrgs = document.getElementById('recentOrgs');
        if (recentOrgs) {
            recentOrgs.innerHTML = orgs.slice(-10).reverse().map(function(o) {
                var statusBadge = o.status === 'active' ? '<span class="badge badge-success">Actif</span>' : o.status === 'pending' ? '<span class="badge badge-warning">En attente</span>' : '<span class="badge badge-danger">' + o.status + '</span>';
                return '<tr><td style="font-size:11px;">' + new Date(o.createdAt).toLocaleDateString('fr') + '</td><td><strong>' + o.name + '</strong></td><td>' + (o.email || 'N/A') + '</td><td>' + (o.type === 'FLEET_MANAGER' ? '🚛 Flotte' : '🏢 Coop') + '</td><td>' + (o.plan || 'Freemium') + '</td><td>' + statusBadge + '</td></tr>';
            }).join('') || '<tr><td colspan="6">Aucune organisation</td></tr>';
        }
        
        // Messages non lus
        try {
            var msgRes = await apiGet('/messages/unread-count');
            var unreadEl = document.getElementById('unreadMsgs');
            if (unreadEl && msgRes) unreadEl.textContent = msgRes.count || 0;
        } catch(e) {}
        
    } catch(e) { console.error(e); }
}
