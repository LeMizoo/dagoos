function init_home() {
    var main = document.getElementById('mainContent');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">' +
            '<div>' +
                '<h1 style="font-size:20px;">📊 Tableau de bord</h1>' +
                '<p style="color:var(--text2);font-size:12px;" id="currentDate"></p>' +
                '<p style="color:#27AE60;font-size:11px;" id="greeting"></p>' +
            '</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">' +
                '<span id="apiStatus" style="font-size:10px;padding:3px 8px;border-radius:50px;"></span>' +
                '<button class="btn btn-sm" style="background:var(--border);" onclick="loadHomeData()">🔄</button>' +
            '</div>' +
        '</div>' +
        
        '<div id="orgStatusBar" style="margin-bottom:14px;"></div>' +
        
        // STATS GLOBALES
        '<div style="background:rgba(39,174,96,0.05);padding:8px 14px;border-radius:10px;border-left:3px solid #27AE60;margin-bottom:14px;display:flex;align-items:center;gap:8px;">' +
            '<i class="fas fa-chart-pie" style="color:#27AE60;"></i><span style="font-weight:600;font-size:13px;color:#27AE60;">Vue d\'ensemble</span>' +
            '<span style="background:#27AE60;color:white;padding:1px 8px;border-radius:10px;font-size:10px;" id="orgPlan"></span>' +
        '</div>' +
        '<div class="stats-grid" id="statsGrid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px;"></div>' +
        
        // SOCIÉTÉS
        '<div style="background:rgba(26,82,118,0.05);padding:8px 14px;border-radius:10px;border-left:3px solid #27AE60;margin-bottom:14px;display:flex;align-items:center;gap:8px;">' +
            '<i class="fas fa-building" style="color:#27AE60;"></i><span style="font-weight:600;font-size:13px;color:#27AE60;">Sociétés</span>' +
            '<a href="#" onclick="loadPage(\'societes\')" style="margin-left:auto;font-size:11px;color:#27AE60;">Gérer →</a>' +
        '</div>' +
        '<div class="stats-grid" id="societesGrid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px;"></div>' +
        
        // CA PAR SOCIÉTÉ
        '<div class="card"><div class="card-header"><h3>📊 CA par société (ce mois)</h3></div><div id="caSocietes" style="padding:16px;"></div></div>' +
        
        // DERNIÈRES ACTIVITÉS
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px;">' +
            '<div class="card"><div class="card-header"><h3>🕐 Dernières livraisons</h3></div><div id="recentLivraisons" style="padding:0 16px 14px;max-height:250px;overflow-y:auto;"></div></div>' +
            '<div class="card"><div class="card-header"><h3>📝 Contrats actifs</h3></div><div id="recentContrats" style="padding:0 16px 14px;max-height:250px;overflow-y:auto;"></div></div>' +
        '</div>' +
        
        '<div style="text-align:center;padding:8px;font-size:10px;color:var(--text2);">Dashboard Coop · Mis à jour à <span id="lastUpdate"></span></div>';
    
    updateDateTime();
    loadHomeData();
    setInterval(updateDateTime, 60000);
    setInterval(loadHomeData, 30000);
}

function updateDateTime() {
    var now = new Date();
    var options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    var dateStr = now.toLocaleDateString('fr-FR', options);
    dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    var timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    var dateEl = document.getElementById('currentDate');
    if (dateEl) dateEl.innerHTML = '<i class="far fa-calendar-alt"></i> ' + dateStr + ' | <i class="far fa-clock"></i> ' + timeStr;
    var lastEl = document.getElementById('lastUpdate'); if (lastEl) lastEl.textContent = timeStr;
    var hour = now.getHours();
    var greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var greetEl = document.getElementById('greeting'); if (greetEl) greetEl.textContent = greeting + ' ' + (user.name || '') + ' !';
}

async function loadHomeData() {
    if (!document.getElementById('statsGrid')) return;
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    try {
        var orgs = await apiGet('/organizations');
        var drivers = await apiGet('/drivers');
        var vehicles = await apiGet('/vehicles');
        var societes = await apiGet('/societes');
        var contrats = await apiGet('/contrats');
        var livraisons = await apiGet('/livraisons');
        var courses = await apiGet('/courses');
        
        var org = orgs.find(function(o) { return o.email === user.email; });
        var myDrivers = drivers.filter(function(d) { return d.organization && d.organization.email === user.email; });
        var myVehicles = vehicles.filter(function(v) { return v.organizationId === (org ? org.id : null); });
        var mySocietes = societes.filter(function(s) { return s.organizationId === (org ? org.id : null); });
        var myContrats = contrats.filter(function(c) { return mySocietes.find(function(s) { return s.id === c.societeId; }); });
        var myLivraisons = livraisons.filter(function(l) { return mySocietes.find(function(s) { return s.id === l.societeId; }); });
        
        // Barre statut
        var statusBar = document.getElementById('orgStatusBar');
        if (statusBar && org) {
            var statusColors = { active: '#27AE60', pending: '#F39C12', suspended: '#E74C3C' };
            statusBar.innerHTML = '<div style="background:' + (statusColors[org.status] || '#6C757D') + ';color:white;padding:10px 16px;border-radius:10px;display:flex;align-items:center;gap:10px;">' +
                '<div><strong>' + org.name + '</strong> - Plan <strong>' + (org.plan || 'Freemium') + '</strong></div>' +
                '<span style="margin-left:auto;background:rgba(255,255,255,0.2);padding:3px 10px;border-radius:10px;font-size:11px;">' + (org.status === 'active' ? 'Actif' : org.status) + '</span></div>';
        }
        
        // Stats globales
        document.getElementById('statsGrid').innerHTML = 
            '<div class="stat-card" onclick="loadPage(\'societes\')" style="cursor:pointer;"><div class="stat-icon green">🏢</div><div class="stat-info"><div class="stat-number">' + mySocietes.length + '</div><div class="stat-label">Sociétés</div></div></div>' +
            '<div class="stat-card" onclick="loadPage(\'vehicles\')" style="cursor:pointer;"><div class="stat-icon blue">🏍️</div><div class="stat-info"><div class="stat-number">' + myVehicles.length + '</div><div class="stat-label">Véhicules</div></div></div>' +
            '<div class="stat-card" onclick="loadPage(\'drivers\')" style="cursor:pointer;"><div class="stat-icon yellow">👥</div><div class="stat-info"><div class="stat-number">' + myDrivers.length + '</div><div class="stat-label">Chauffeurs/Livreurs</div></div></div>' +
            '<div class="stat-card" onclick="loadPage(\'contrats\')" style="cursor:pointer;"><div class="stat-icon red">📝</div><div class="stat-info"><div class="stat-number">' + myContrats.filter(function(c){return c.statut==='actif';}).length + '</div><div class="stat-label">Contrats actifs</div></div></div>';
        
        // Sociétés
        document.getElementById('societesGrid').innerHTML = mySocietes.length ? mySocietes.map(function(s) {
            var nbV = (s.vehicles || []).length || myVehicles.filter(function(v) { return v.societeId === s.id; }).length;
            var nbD = (s.drivers || []).length || myDrivers.filter(function(d) { return d.societeId === s.id; }).length;
            return '<div class="stat-card" onclick="loadPage(\'societes\')" style="cursor:pointer;"><div class="stat-info"><div class="stat-number">' + nbV + '</div><div class="stat-label">🚛 ' + s.name + '</div></div></div>';
        }).join('') : '<div class="stat-card"><div class="stat-info"><div class="stat-number">0</div><div class="stat-label">Aucune société</div></div></div>';
        
        document.getElementById('orgPlan').textContent = org ? org.plan : 'Freemium';
        document.getElementById('societeCount').textContent = mySocietes.length;
        document.getElementById('driverCount').textContent = myDrivers.length;
        document.getElementById('vehicleCount').textContent = myVehicles.length;
        
        // CA par société
        var caSocietesEl = document.getElementById('caSocietes');
        if (caSocietesEl) {
            var caHTML = '';
            mySocietes.forEach(function(s) {
                var societeCourses = courses.filter(function(c) { return c.societeId === s.id; });
                var ca = societeCourses.reduce(function(sum, c) { return sum + (c.price || 0); }, 0);
                var maxCA = Math.max.apply(null, mySocietes.map(function(s2) {
                    return courses.filter(function(c) { return c.societeId === s2.id; }).reduce(function(sum, c) { return sum + (c.price || 0); }, 0);
                })) || 1;
                var pct = Math.round((ca / maxCA) * 100);
                caHTML += '<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;"><span>' + s.name + '</span><span>' + ca.toLocaleString() + ' Ar</span></div><div style="background:var(--border);border-radius:50px;height:8px;"><div style="background:#27AE60;height:100%;border-radius:50px;width:' + pct + '%;"></div></div></div>';
            });
            caSocietesEl.innerHTML = caHTML || '<p style="text-align:center;color:var(--text2);">Aucune donnée</p>';
        }
        
        // Dernières livraisons
        var livEl = document.getElementById('recentLivraisons');
        if (livEl) {
            livEl.innerHTML = myLivraisons.slice(0, 5).map(function(l) {
                var statutBadge = l.statut === 'livree' ? 'badge-success' : l.statut === 'en_cours' ? 'badge-info' : 'badge-warning';
                return '<div style="padding:8px 0;border-bottom:1px solid var(--border);"><strong>' + l.type + '</strong> - <span class="badge ' + statutBadge + '">' + l.statut + '</span><br><span style="font-size:11px;color:var(--text2);">' + (l.prix || 0).toLocaleString() + ' Ar</span></div>';
            }).join('') || '<p style="text-align:center;color:var(--text2);padding:10px;">Aucune livraison</p>';
        }
        
        // Contrats actifs
        var contratsEl = document.getElementById('recentContrats');
        if (contratsEl) {
            var actifs = myContrats.filter(function(c) { return c.statut === 'actif'; });
            contratsEl.innerHTML = actifs.slice(0, 5).map(function(c) {
                return '<div style="padding:8px 0;border-bottom:1px solid var(--border);"><strong>' + c.client + '</strong><br><span style="font-size:11px;color:var(--text2);">' + c.type + ' · ' + (c.montant || 0).toLocaleString() + ' Ar</span></div>';
            }).join('') || '<p style="text-align:center;color:var(--text2);padding:10px;">Aucun contrat actif</p>';
        }
        
        var apiEl = document.getElementById('apiStatus');
        if (apiEl) { apiEl.innerHTML = '<i class="fas fa-circle" style="color:#27AE60;font-size:7px;"></i> En ligne'; apiEl.style.background = '#D1FAE5'; apiEl.style.color = '#065F46'; }
    } catch(e) {
        var apiEl = document.getElementById('apiStatus');
        if (apiEl) { apiEl.innerHTML = 'Hors ligne'; apiEl.style.background = '#FEE2E2'; apiEl.style.color = '#991B1B'; }
    }
}
