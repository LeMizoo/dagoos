function init_home() {
    var main = document.getElementById('mainInner');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">' +
            '<div>' +
                '<h1 style="font-size:20px;margin-bottom:2px;">📊 Tableau de bord</h1>' +
                '<p style="color:var(--text2);font-size:12px;" id="currentDate"></p>' +
                '<p style="color:#1A5276;font-size:11px;margin-top:2px;" id="greeting"></p>' +
            '</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">' +
                '<span id="apiStatus" style="font-size:10px;padding:3px 8px;border-radius:50px;"></span>' +
                '<button class="btn btn-sm btn-primary" onclick="loadPage(\'fleets\')">🚛 Flottes</button>' +
                '<button class="btn btn-sm" style="background:#27AE60;color:white;" onclick="loadPage(\'drivers\')">👥 Chauffeurs</button>' +
                '<button class="btn btn-sm" style="background:#3498DB;color:white;" onclick="loadPage(\'payments\')">💰 Finances</button>' +
                '<button class="btn btn-sm" style="background:var(--border);" onclick="loadHomeStats()">🔄</button>' +
            '</div>' +
        '</div>' +
        
        '<div style="background:rgba(26,82,118,0.05);padding:8px 14px;border-radius:10px;border-left:3px solid #1A5276;margin-bottom:14px;display:flex;align-items:center;gap:8px;">' +
            '<i class="fas fa-chart-pie" style="color:#1A5276;"></i><span style="font-weight:600;font-size:13px;color:#1A5276;">Statistiques générales</span>' +
            '<span style="background:#1A5276;color:white;padding:1px 8px;border-radius:10px;font-size:10px;" id="totalOrgs">0 organisation</span>' +
        '</div>' +
        '<div class="stats-grid" id="statsGrid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px;"></div>' +
        
        '<div style="background:rgba(39,174,96,0.05);padding:8px 14px;border-radius:10px;border-left:3px solid #27AE60;margin-bottom:14px;display:flex;align-items:center;gap:8px;">' +
            '<i class="fas fa-building" style="color:#27AE60;"></i><span style="font-weight:600;font-size:13px;color:#27AE60;">Flottes & Coopératives</span>' +
            '<a href="#" onclick="loadPage(\'fleets\')" style="margin-left:auto;font-size:11px;color:#1A5276;">Voir tout →</a>' +
        '</div>' +
        '<div class="stats-grid" id="orgsGrid" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px;"></div>' +
        
        '<div style="background:rgba(231,76,60,0.05);padding:8px 14px;border-radius:10px;border-left:3px solid #E74C3C;margin-bottom:14px;display:flex;align-items:center;gap:8px;">' +
            '<i class="fas fa-bell" style="color:#E74C3C;"></i><span style="font-weight:600;font-size:13px;color:#E74C3C;">Alertes</span>' +
        '</div>' +
        '<div class="stats-grid" id="alertsGrid" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px;"></div>' +
        
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">' +
            '<div class="card"><div class="card-header"><h3>📊 Répartition des plans</h3></div><div id="planChart" style="padding:16px;"></div></div>' +
            '<div class="card"><div class="card-header"><h3>📊 Flottes vs Coopératives</h3></div><div id="typeChart" style="padding:16px;"></div></div>' +
        '</div>' +
        
        '<div class="card"><div class="card-header"><h3>🕐 Dernières inscriptions</h3><a href="#" onclick="loadPage(\'fleets\')" style="font-size:11px;color:#1A5276;">Voir tout →</a></div>' +
        '<div style="overflow-x:auto;"><table><thead><tr><th>Date</th><th>Nom</th><th>Email</th><th>Type</th><th>Plan</th><th>Statut</th></tr></thead><tbody id="recentOrgs"></tbody></table></div></div>' +
        
        '<div style="text-align:center;padding:8px;font-size:10px;color:var(--text2);">Dashboard Admin · Mis à jour à <span id="lastUpdate"></span></div>';
    
    updateDateTime();
    loadHomeStats();
    setInterval(updateDateTime, 30000);
    setInterval(loadHomeStats, 30000);
}

function updateDateTime() {
    var now = new Date();
    var options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    var dateStr = now.toLocaleDateString('fr-FR', options);
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    var timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    var dateEl = document.getElementById('currentDate');
    if (dateEl) dateEl.innerHTML = '<i class="far fa-calendar-alt"></i> ' + dateStr + ' | <i class="far fa-clock"></i> ' + timeStr;
    
    var lastEl = document.getElementById('lastUpdate');
    if (lastEl) lastEl.textContent = timeStr;
    
    // Message de bienvenue selon l'heure
    var hour = now.getHours();
    var greeting = '';
    if (hour < 6) greeting = '🌙 Bonne nuit';
    else if (hour < 12) greeting = '🌅 Bonjour';
    else if (hour < 15) greeting = '☀️ Bon après-midi';
    else if (hour < 19) greeting = '🌤️ Bonne fin de journée';
    else greeting = '🌆 Bonne soirée';
    
    var greetEl = document.getElementById('greeting');
    if (greetEl) greetEl.textContent = greeting + ' ' + (user.name || 'Admin') + ' !';
}

async function loadHomeStats() {
    if (!document.getElementById('statsGrid')) return;
    
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
        
        var el;
        
        // Stats générales
        el = document.getElementById('statsGrid');
        if (el) el.innerHTML = 
            '<div class="stat-card" onclick="loadPage(\'fleets\')" style="cursor:pointer;"><div class="stat-icon green">✅</div><div class="stat-info"><div class="stat-number">' + active.length + '</div><div class="stat-label">Actives</div></div></div>' +
            '<div class="stat-card" onclick="loadPage(\'fleets\')" style="cursor:pointer;"><div class="stat-icon yellow">🕐</div><div class="stat-info"><div class="stat-number">' + pending.length + '</div><div class="stat-label">En attente</div></div></div>' +
            '<div class="stat-card" onclick="loadPage(\'drivers\')" style="cursor:pointer;"><div class="stat-icon blue">👥</div><div class="stat-info"><div class="stat-number">' + drivers.length + '</div><div class="stat-label">Chauffeurs</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red">🌐</div><div class="stat-info"><div class="stat-number">' + users.length + '</div><div class="stat-label">Utilisateurs</div></div></div>';
        
        // Flottes & Coops
        el = document.getElementById('orgsGrid');
        if (el) el.innerHTML = 
            '<div class="stat-card" onclick="loadPage(\'fleets\')" style="cursor:pointer;"><div class="stat-icon" style="font-size:20px;">🚛</div><div class="stat-info"><div class="stat-number">' + fleets.length + '</div><div class="stat-label">Flottes</div></div></div>' +
            '<div class="stat-card" onclick="loadPage(\'coops\')" style="cursor:pointer;"><div class="stat-icon" style="font-size:20px;">🏢</div><div class="stat-info"><div class="stat-number">' + coops.length + '</div><div class="stat-label">Coopératives</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red">🚫</div><div class="stat-info"><div class="stat-number">' + suspended.length + '</div><div class="stat-label">Suspendues</div></div></div>';
        
        // Alertes
        el = document.getElementById('alertsGrid');
        if (el) el.innerHTML = 
            '<div class="stat-card" onclick="loadPage(\'fleets\')" style="cursor:pointer;border-left:3px solid ' + (pending.length > 0 ? '#F39C12' : '#27AE60') + ';"><div class="stat-icon ' + (pending.length > 0 ? 'yellow' : 'green') + '"><i class="fas fa-' + (pending.length > 0 ? 'exclamation-triangle' : 'check-circle') + '"></i></div><div class="stat-info"><div class="stat-number" style="color:' + (pending.length > 0 ? '#F39C12' : '#27AE60') + ';">' + pending.length + '</div><div class="stat-label">' + (pending.length > 0 ? 'À valider' : 'Tout validé') + '</div></div></div>' +
            '<div class="stat-card" style="border-left:3px solid #E74C3C;"><div class="stat-icon red">❌</div><div class="stat-info"><div class="stat-number">' + rejected.length + '</div><div class="stat-label">Rejetées</div></div></div>' +
            '<div class="stat-card" onclick="loadPage(\'messages\')" style="cursor:pointer;"><div class="stat-icon blue">📧</div><div class="stat-info"><div class="stat-number" id="unreadMsgs">0</div><div class="stat-label">Messages non lus</div></div></div>';
        
        // Sidebar counters
        ['fleetCount','coopCount','driverCount'].forEach(function(id) {
            var e = document.getElementById(id);
            if (e) e.textContent = id === 'driverCount' ? drivers.length : (id === 'fleetCount' ? fleets.length : coops.length);
    var av = document.getElementById("adminVehicles"); if (av) av.textContent = vehicles.length;
        });
        el = document.getElementById('totalOrgs');
        if (el) el.textContent = orgs.length + ' organisation' + (orgs.length > 1 ? 's' : '');
        
        // Graphique plans
        var plans = {};
        orgs.forEach(function(o) { plans[o.plan] = (plans[o.plan] || 0) + 1; });
        el = document.getElementById('planChart');
        if (el) {
            var colors = { Freemium: '#3498DB', Basic: '#27AE60', Standard: '#F39C12', Premium: '#E74C3C' };
            el.innerHTML = Object.keys(plans).map(function(p) {
                var pct = orgs.length > 0 ? Math.round((plans[p] / orgs.length) * 100) : 0;
                return '<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;"><span>' + p + '</span><span><strong>' + plans[p] + '</strong> (' + pct + '%)</span></div><div style="background:var(--border);border-radius:50px;height:8px;"><div style="background:' + (colors[p] || '#1A5276') + ';height:100%;border-radius:50px;width:' + pct + '%;"></div></div></div>';
            }).join('');
        }
        
        // Graphique type
        el = document.getElementById('typeChart');
        if (el) {
            var total = fleets.length + coops.length || 1;
            var fleetPct = Math.round((fleets.length / total) * 100);
            el.innerHTML = 
                '<div style="display:flex;justify-content:center;gap:40px;text-align:center;">' +
                    '<div><div style="width:70px;height:70px;border-radius:50%;background:conic-gradient(#1A5276 ' + fleetPct * 3.6 + 'deg, #27AE60 0);margin:0 auto 8px;"></div><strong>🚛 Flottes</strong><br><span style="font-size:18px;font-weight:800;">' + fleets.length + '</span> (' + fleetPct + '%)</div>' +
                    '<div><div style="width:70px;height:70px;border-radius:50%;background:conic-gradient(#27AE60 ' + (100-fleetPct) * 3.6 + 'deg, #1A5276 0);margin:0 auto 8px;"></div><strong>🏢 Coops</strong><br><span style="font-size:18px;font-weight:800;">' + coops.length + '</span> (' + (100-fleetPct) + '%)</div>' +
                '</div>';
        }
        
        // Dernières inscriptions
        el = document.getElementById('recentOrgs');
        if (el) {
            el.innerHTML = orgs.slice(-10).reverse().map(function(o) {
                var statusBadge = o.status === 'active' ? '<span class="badge badge-success">Actif</span>' : o.status === 'pending' ? '<span class="badge badge-warning">En attente</span>' : '<span class="badge badge-danger">' + o.status + '</span>';
                return '<tr><td style="font-size:11px;">' + new Date(o.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + '</td><td><strong>' + o.name + '</strong></td><td style="font-size:10px;">' + (o.email || 'N/A') + '</td><td>' + (o.type === 'FLEET_MANAGER' ? '🚛 Flotte' : '🏢 Coop') + '</td><td>' + (o.plan || 'Freemium') + '</td><td>' + statusBadge + '</td></tr>';
            }).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--text2);padding:20px;">Aucune organisation pour le moment</td></tr>';
        }
        
        // Messages non lus
        try {
            var msgRes = await apiGet('/messages/unread-count');
            var unreadEl = document.getElementById('unreadMsgs');
            if (unreadEl && msgRes) unreadEl.textContent = msgRes.count || 0;
        } catch(e) {}
        
        // API Status
        var apiEl = document.getElementById('apiStatus');
        if (apiEl) {
            apiEl.innerHTML = '<i class="fas fa-circle" style="color:#27AE60;font-size:7px;"></i> API Online';
            apiEl.style.background = '#D1FAE5';
            apiEl.style.color = '#065F46';
        }
        
    } catch(e) {
        var apiEl = document.getElementById('apiStatus');
        if (apiEl) {
            apiEl.innerHTML = '<i class="fas fa-circle" style="color:#E74C3C;font-size:7px;"></i> API Offline';
            apiEl.style.background = '#FEE2E2';
            apiEl.style.color = '#991B1B';
        }
    }
}
