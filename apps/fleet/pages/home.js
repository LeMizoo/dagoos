function init_home() {
    var main = document.getElementById('mainContent');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">' +
            '<div>' +
                '<h1 style="font-size:20px;margin-bottom:2px;"><i class="fas fa-tachometer-alt"></i> Tableau de bord</h1>' +
                '<p style="color:var(--text2);font-size:12px;" id="currentDate"></p>' +
                '<p style="color:#1A5276;font-size:11px;margin-top:2px;" id="greeting"></p>' +
            '</div>' +
            '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">' +
                '<span id="apiStatus" style="font-size:10px;padding:3px 8px;border-radius:50px;"></span>' +
                '<button class="btn btn-sm" style="background:var(--border);" onclick="loadHomeData()"><i class="fas fa-sync-alt"></i></button>' +
            '</div>' +
        '</div>' +
        
        // STATUT ORGANISATION
        '<div id="orgStatusBar" style="margin-bottom:14px;"></div>' +
        
        // STATS PRINCIPALES
        '<div style="background:rgba(26,82,118,0.05);padding:8px 14px;border-radius:10px;border-left:3px solid #1A5276;margin-bottom:14px;display:flex;align-items:center;gap:8px;">' +
            '<i class="fas fa-chart-pie" style="color:#1A5276;"></i><span style="font-weight:600;font-size:13px;color:#1A5276;">Vue d\'ensemble</span>' +
            '<span style="background:#1A5276;color:white;padding:1px 8px;border-radius:10px;font-size:10px;" id="orgPlan"></span>' +
        '</div>' +
        '<div class="stats-grid" id="statsGrid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px;"></div>' +
        
        // FLOTTE & PERSONNEL
        '<div style="background:rgba(39,174,96,0.05);padding:8px 14px;border-radius:10px;border-left:3px solid #27AE60;margin-bottom:14px;display:flex;align-items:center;gap:8px;">' +
            '<i class="fas fa-users" style="color:#27AE60;"></i><span style="font-weight:600;font-size:13px;color:#27AE60;">Flotte & Personnel</span>' +
            '<span style="background:#27AE60;color:white;padding:1px 8px;border-radius:10px;font-size:10px;" id="fleetSummary"></span>' +
        '</div>' +
        '<div class="stats-grid" id="fleetGrid" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px;"></div>' +
        
        // ACTIONS RAPIDES
        '<div class="grid-2" style="margin-bottom:14px;">' +
            '<button onclick="loadPage(\'vehicles\')" class="action-card" style="background:#1A5276;">' +
                '<i class="fas fa-motorcycle" style="font-size:22px;margin-bottom:6px;"></i>' +
                '<span style="font-weight:600;">Gérer les véhicules</span>' +
                '<span style="font-size:11px;opacity:0.8;">Ajouter, modifier, suivre</span>' +
            '</button>' +
            '<button onclick="loadPage(\'drivers\')" class="action-card" style="background:#27AE60;">' +
                '<i class="fas fa-users" style="font-size:22px;margin-bottom:6px;"></i>' +
                '<span style="font-weight:600;">Gérer les chauffeurs</span>' +
                '<span style="font-size:11px;opacity:0.8;">Ajouter, modifier, assigner</span>' +
            '</button>' +
        '</div>' +
        
        // ALERTES
        '<div id="alertsGrid" style="margin-bottom:14px;"></div>' +
        
        // DERNIERS CHAUFFEURS
        '<div class="card"><div class="card-header"><h3><i class="fas fa-users"></i> Derniers chauffeurs</h3><a href="#" onclick="loadPage(\'drivers\')" style="font-size:11px;color:#1A5276;">Voir tout <i class="fas fa-arrow-right"></i></a></div>' +
        '<div style="overflow-x:auto;"><table><thead><tr><th>Code</th><th>Nom</th><th>Véhicule</th><th>Propriétaire</th><th>Statut</th></tr></thead><tbody id="recentDrivers"></tbody></table></div></div>' +
        
        '<div style="text-align:center;padding:8px;font-size:10px;color:var(--text2);">Dashboard Fleet · Mis à jour à <span id="lastUpdate"></span></div>';
    
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
    
    var lastEl = document.getElementById('lastUpdate');
    if (lastEl) lastEl.textContent = timeStr;
    
    var hour = now.getHours();
    var greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var greetEl = document.getElementById('greeting');
    if (greetEl) greetEl.textContent = greeting + ' ' + (user.name || '') + ' !';
}

async function loadHomeData() {
    if (!document.getElementById('statsGrid')) return;
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    
    try {
        var orgs = await apiGet('/organizations');
        var drivers = await apiGet('/drivers');
        var vehicles = await apiGet('/vehicles');
        var proprietaires = await apiGet('/proprietaires');
        
        var org = orgs.find(function(o) { return o.email === user.email; });
        var myDrivers = drivers.filter(function(d) { return d.organization && d.organization.email === user.email; });
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        var myVehicles = vehicles; // Tous les véhicules pour l'instant
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        // Barre de statut
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        var statusBar = document.getElementById('orgStatusBar');
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        if (statusBar && org) {
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            var statusColors = { active: '#27AE60', pending: '#F39C12', suspended: '#E74C3C', rejected: '#E74C3C' };
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            var statusLabels = { active: 'Actif', pending: 'En attente de validation', suspended: 'Suspendu', rejected: 'Rejeté' };
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            var statusIcons = { active: 'check-circle', pending: 'clock', suspended: 'ban', rejected: 'times-circle' };
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            statusBar.innerHTML = '<div style="background:' + (statusColors[org.status] || '#6C757D') + ';color:white;padding:10px 16px;border-radius:10px;display:flex;align-items:center;gap:10px;">' +
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
                '<i class="fas fa-' + (statusIcons[org.status] || 'info-circle') + '"></i>' +
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
                '<div><strong>' + org.name + '</strong> - Plan <strong>' + (org.plan || 'Freemium') + '</strong></div>' +
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
                '<span style="margin-left:auto;background:rgba(255,255,255,0.2);padding:3px 10px;border-radius:10px;font-size:11px;">' + (statusLabels[org.status] || org.status) + '</span></div>';
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        }
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        // Stats principales
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        var el = document.getElementById('statsGrid');
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        if (el) el.innerHTML = 
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            '<div class="stat-card" onclick="loadPage(\'vehicles\')" style="cursor:pointer;"><div class="stat-icon blue"><i class="fas fa-motorcycle"></i></div><div class="stat-info"><div class="stat-number">' + myVehicles.length + '</div><div class="stat-label">Véhicules</div></div></div>' +
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            '<div class="stat-card" onclick="loadPage(\'drivers\')" style="cursor:pointer;"><div class="stat-icon green"><i class="fas fa-users"></i></div><div class="stat-info"><div class="stat-number">' + myDrivers.length + '</div><div class="stat-label">Chauffeurs</div></div></div>' +
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            '<div class="stat-card" onclick="loadPage(\'proprietaires\')" style="cursor:pointer;"><div class="stat-icon yellow"><i class="fas fa-building"></i></div><div class="stat-info"><div class="stat-number">' + (proprietaires.length || 0) + '</div><div class="stat-label">Propriétaires</div></div></div>' +
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            '<div class="stat-card"><div class="stat-icon red"><i class="fas fa-route"></i></div><div class="stat-info"><div class="stat-number" id="statCourses">-</div><div class="stat-label">Courses aujourd\'hui</div></div></div>';
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        // Flotte & Personnel
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        el = document.getElementById('fleetGrid');
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        if (el) el.innerHTML = 
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            '<div class="stat-card"><i class="fas fa-motorcycle" style="font-size:22px;"></i><div class="stat-info"><div class="stat-number">' + myVehicles.filter(function(v){return v.model && v.model.includes("Cygnus")||v.model.includes("YAMAHA");}).length + '</div><div class="stat-label">Motos</div></div></div>' +
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            '<div class="stat-card"><i class="fas fa-car" style="font-size:22px;"></i><div class="stat-info"><div class="stat-number">' + myVehicles.filter(function(v){return v.model && (v.model.includes("Prius")||v.model.includes("Picanto"));}).length + '</div><div class="stat-label">Taxis</div></div></div>' +
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            '<div class="stat-card"><i class="fas fa-bus" style="font-size:22px;"></i><div class="stat-info"><div class="stat-number">' + myVehicles.filter(function(v){return v.model && (v.model.includes("Sprinter")||v.model.includes("Coaster")||v.model.includes("County"));}).length + '</div><div class="stat-label">Bus</div></div></div>' +
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            '<div class="stat-card"><i class="fas fa-truck" style="font-size:22px;"></i><div class="stat-info"><div class="stat-number">' + myVehicles.filter(function(v){return v.model && v.model.includes("BAJAJ");}).length + '</div><div class="stat-label">Tricycles</div></div></div>';
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        // Résumé
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        document.getElementById('fleetSummary').textContent = myDrivers.length + ' chauffeurs - ' + myVehicles.length + ' véhicules';
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        document.getElementById('orgPlan').textContent = (org ? org.plan : 'Freemium');
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        document.getElementById('driverCount').textContent = myDrivers.length;
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
    var vc = document.getElementById("vehicleCount"); if (vc) vc.textContent = myVehicles.length;
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
    var pc = document.getElementById("propCount"); if (pc) pc.textContent = proprietaires.length;
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        // Alertes
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        el = document.getElementById('alertsGrid');
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        if (el) {
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            var expiredInsurance = myVehicles.filter(function(v){ return v.insuranceDate && new Date(v.insuranceDate) < new Date(); });
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            var vidangeUrgente = myVehicles.filter(function(v){ return v.currentKm && v.nextMaintenanceKm && v.currentKm >= v.nextMaintenanceKm; });
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            var nonAssignes = myDrivers.filter(function(d){ return !d.vehicleId; });
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            if (expiredInsurance.length > 0 || vidangeUrgente.length > 0 || nonAssignes.length > 0) {
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
                el.innerHTML = '<div style="background:rgba(231,76,60,0.05);padding:8px 14px;border-radius:10px;border-left:3px solid #E74C3C;margin-bottom:14px;display:flex;align-items:center;gap:8px;">' +
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
                    '<i class="fas fa-exclamation-triangle" style="color:#E74C3C;"></i><span style="font-weight:600;font-size:13px;color:#E74C3C;">Alertes</span></div>' +
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
                    '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
                    (expiredInsurance.length > 0 ? '<div class="stat-card" style="border-left:3px solid #E74C3C;"><div class="stat-info"><div class="stat-number" style="color:#E74C3C;">' + expiredInsurance.length + '</div><div class="stat-label">Assurances expirées</div></div></div>' : '') +
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
                    (vidangeUrgente.length > 0 ? '<div class="stat-card" style="border-left:3px solid #F39C12;"><div class="stat-info"><div class="stat-number" style="color:#F39C12;">' + vidangeUrgente.length + '</div><div class="stat-label">Vidanges urgentes</div></div></div>' : '') +
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
                    (nonAssignes.length > 0 ? '<div class="stat-card" style="border-left:3px solid #8B5CF6;"><div class="stat-info"><div class="stat-number" style="color:#8B5CF6;">' + nonAssignes.length + '</div><div class="stat-label">Chauffeurs sans véhicule</div></div></div>' : '') +
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
                    '</div>';
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            }
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        }
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        // Derniers chauffeurs
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        el = document.getElementById('recentDrivers');
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        if (el) {
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            el.innerHTML = myDrivers.slice(0, 5).map(function(d) {
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
                var moto = myVehicles.find(function(v) { return v.id === d.vehicleId; });
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
                var prop = proprietaires.find(function(p) { return p.id === d.proprietaireId; });
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
                return '<tr><td><code>' + d.driverCode + '</code></td><td><strong>' + (d.user ? d.user.name : 'N/A') + '</strong></td>' +
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
                    '<td>' + (moto ? moto.plate : 'Non assigné') + '</td>' +
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
                    '<td>' + (prop ? prop.name : '-') + '</td>' +
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
                    '<td><span class="badge ' + (d.status === 'active' ? 'badge-success' : 'badge-danger') + '">' + d.status + '</span></td></tr>';
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            }).join('') || '<tr><td colspan="5">Aucun chauffeur</td></tr>';
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        }
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        // API Status
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        var apiEl = document.getElementById('apiStatus');
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        if (apiEl) {
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            apiEl.innerHTML = '<i class="fas fa-circle" style="color:#27AE60;font-size:7px;"></i> En ligne';
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
            apiEl.style.background = '#D1FAE5'; apiEl.style.color = '#065F46';
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        }
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
    } catch(e) {
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        var apiEl = document.getElementById('apiStatus');
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
        if (apiEl) { apiEl.innerHTML = 'Hors ligne'; apiEl.style.background = '#FEE2E2'; apiEl.style.color = '#991B1B'; }
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
    }
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
}
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
