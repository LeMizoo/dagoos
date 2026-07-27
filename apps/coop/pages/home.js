function init_home() {
    var main = document.getElementById('mainContent');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">' +
            '<div>' +
                '<h1 style="font-size:20px;"><i class="fas fa-chart-pie"></i> Tableau de bord</h1>' +
                '<p style="color:var(--text2);font-size:12px;" id="currentDate"></p>' +
                '<p style="color:#27AE60;font-size:11px;" id="greeting"></p>' +
            '</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">' +
                '<span id="apiStatus" style="font-size:10px;padding:3px 8px;border-radius:50px;"></span>' +
                '<button class="btn btn-sm" style="background:var(--border);" onclick="loadHomeData()"><i class="fas fa-sync-alt"></i></button>' +
            '</div>' +
        '</div>' +
        '<div id="orgStatusBar" style="margin-bottom:14px;"></div>' +
        '<div class="stats-grid" id="statsGrid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px;"></div>' +
        '<div style="background:rgba(39,174,96,0.05);padding:8px 14px;border-radius:10px;border-left:3px solid #27AE60;margin-bottom:14px;display:flex;align-items:center;gap:8px;">' +
            '<i class="fas fa-building" style="color:#27AE60;"></i><span style="font-weight:600;font-size:13px;color:#27AE60;">Sociétés & Activités</span>' +
        '</div>' +
        '<div class="stats-grid" id="societesGrid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px;"></div>' +
        '<div class="grid-2" style="margin-bottom:14px;">' +
            '<button onclick="loadPage(\'vehicles\')" class="action-card" style="background:#1A5276;">' +
                '<i class="fas fa-motorcycle" style="font-size:22px;margin-bottom:6px;"></i><span style="font-weight:600;">Gérer les véhicules</span>' +
            '</button>' +
            '<button onclick="loadPage(\'drivers\')" class="action-card" style="background:#27AE60;">' +
                '<i class="fas fa-users" style="font-size:22px;margin-bottom:6px;"></i><span style="font-weight:600;">Gérer les chauffeurs</span>' +
            '</button>' +
        '</div>' +
        '<div class="card"><div class="card-header"><h3><i class="fas fa-clock"></i> Dernières activités</h3></div>' +
        '<table><thead><tr><th>Société</th><th>Type</th><th>Détail</th><th>Date</th></tr></thead><tbody id="recentActivities"><tr><td colspan="4">Chargement...</td></tr></tbody></table></div>' +
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
        var org = orgs.find(function(o) { return o.email === user.email; });
        var myDrivers = (drivers || []).filter(function(d) { return d.organization && d.organization.email === user.email; });
        var myVehicles = (vehicles || []).filter(function(v) { return v.organizationId === (org ? org.id : null); });
        
        var statusBar = document.getElementById('orgStatusBar');
        if (statusBar && org) {
            var statusColors = { active: '#27AE60', pending: '#F39C12', suspended: '#E74C3C' };
            var statusLabels = { active: 'Actif', pending: 'En attente', suspended: 'Suspendu' };
            statusBar.innerHTML = '<div style="background:' + (statusColors[org.status] || '#6C757D') + ';color:white;padding:10px 16px;border-radius:10px;display:flex;align-items:center;gap:10px;">' +
                '<div><strong>' + org.name + '</strong> - Plan <strong>' + (org.plan || 'Freemium') + '</strong></div>' +
                '<span style="margin-left:auto;background:rgba(255,255,255,0.2);padding:3px 10px;border-radius:10px;font-size:11px;">' + (statusLabels[org.status] || org.status) + '</span></div>';
        }
        
        document.getElementById('statsGrid').innerHTML = 
            '<div class="stat-card" onclick="loadPage(\'vehicles\')" style="cursor:pointer;"><div class="stat-icon blue"><i class="fas fa-motorcycle"></i></div><div class="stat-info"><div class="stat-number">' + myVehicles.length + '</div><div class="stat-label">Véhicules</div></div></div>' +
            '<div class="stat-card" onclick="loadPage(\'drivers\')" style="cursor:pointer;"><div class="stat-icon green"><i class="fas fa-users"></i></div><div class="stat-info"><div class="stat-number">' + myDrivers.length + '</div><div class="stat-label">Chauffeurs</div></div></div>' +
            '<div class="stat-card" onclick="loadPage(\'societes\')" style="cursor:pointer;"><div class="stat-icon yellow"><i class="fas fa-building"></i></div><div class="stat-info"><div class="stat-number">0</div><div class="stat-label">Sociétés</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red"><i class="fas fa-coins"></i></div><div class="stat-info"><div class="stat-number">0 Ar</div><div class="stat-label">CA aujourd\'hui</div></div></div>';
        
        document.getElementById('societesGrid').innerHTML = 
            '<div class="stat-card"><div class="stat-info"><div class="stat-number">0</div><div class="stat-label">🚛 Transport</div></div></div>' +
            '<div class="stat-card"><div class="stat-info"><div class="stat-number">0</div><div class="stat-label">📦 Livraison</div></div></div>' +
            '<div class="stat-card"><div class="stat-info"><div class="stat-number">0</div><div class="stat-label">📋 Contrats actifs</div></div></div>' +
            '<div class="stat-card"><div class="stat-info"><div class="stat-number">0 Ar</div><div class="stat-label">💰 Facturation</div></div></div>';
        
        var apiEl = document.getElementById('apiStatus');
        if (apiEl) { apiEl.innerHTML = '<i class="fas fa-circle" style="color:#27AE60;font-size:7px;"></i> En ligne'; apiEl.style.background = '#D1FAE5'; apiEl.style.color = '#065F46'; }
    } catch(e) {
        var apiEl = document.getElementById('apiStatus');
        if (apiEl) { apiEl.innerHTML = 'Hors ligne'; apiEl.style.background = '#FEE2E2'; apiEl.style.color = '#991B1B'; }
    }
}
