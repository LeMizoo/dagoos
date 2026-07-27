function init_finances() {
    document.getElementById('mainInner').innerHTML = 
        '<div class="topbar"><h1><i class="fas fa-coins"></i> Finances globales</h1></div>' +
        
        '<div class="stats-grid" id="globalStats" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px;"></div>' +
        
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">' +
            '<div class="card"><div class="card-header"><h3><i class="fas fa-chart-bar"></i> CA par type</h3></div><div id="caChart" style="padding:16px;"></div></div>' +
            '<div class="card"><div class="card-header"><h3><i class="fas fa-chart-pie"></i> Répartition Flottes vs Coops</h3></div><div id="typeChart" style="padding:16px;"></div></div>' +
        '</div>' +
        
        '<div class="card"><div class="card-header"><h3><i class="fas fa-list"></i> Dernières transactions</h3></div>' +
        '<table><thead><tr><th>Date</th><th>Organisation</th><th>Type</th><th>Montant</th></tr></thead><tbody id="allTx"><tr><td colspan="4">Chargement...</td></tr></tbody></table></div>';
    loadGlobalFinances();
}

async function loadGlobalFinances() {
    try {
        var stats = await apiGet('/finances/stats');
        var courses = await apiGet('/courses');
        var orgs = await apiGet('/organizations');
        var drivers = await apiGet('/drivers');
        
        // Stats
        document.getElementById('globalStats').innerHTML = 
            '<div class="stat-card"><div class="stat-icon green"><i class="fas fa-coins"></i></div><div class="stat-info"><div class="stat-number">' + (stats.caJour || 0).toLocaleString() + ' Ar</div><div class="stat-label">CA aujourd\'hui</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon blue"><i class="fas fa-calendar-week"></i></div><div class="stat-info"><div class="stat-number">' + (stats.caSemaine || 0).toLocaleString() + ' Ar</div><div class="stat-label">CA cette semaine</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-calendar-alt"></i></div><div class="stat-info"><div class="stat-number">' + (stats.caMois || 0).toLocaleString() + ' Ar</div><div class="stat-label">CA ce mois</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red"><i class="fas fa-building"></i></div><div class="stat-info"><div class="stat-number">' + orgs.length + '</div><div class="stat-label">Organisations</div></div></div>';
        
        // Graphique CA par type (Flotte vs Coop)
        var fleetCourses = courses.filter(function(c) { return c.organizationType === 'FLEET_MANAGER'; });
        var coopCourses = courses.filter(function(c) { return c.organizationType === 'COOPERATIVE'; });
        var fleetCA = fleetCourses.reduce(function(s, c) { return s + (c.price || 0); }, 0);
        var coopCA = coopCourses.reduce(function(s, c) { return s + (c.price || 0); }, 0);
        var totalCA = fleetCA + coopCA || 1;
        
        document.getElementById('caChart').innerHTML = 
            '<div style="margin-bottom:10px;"><span>🚛 Flottes</span><div style="background:var(--border);border-radius:50px;height:10px;"><div style="background:#1A5276;height:100%;border-radius:50px;width:' + Math.round(fleetCA/totalCA*100) + '%;"></div></div><span style="font-size:11px;">' + fleetCA.toLocaleString() + ' Ar</span></div>' +
            '<div><span>🏢 Coops</span><div style="background:var(--border);border-radius:50px;height:10px;"><div style="background:#27AE60;height:100%;border-radius:50px;width:' + Math.round(coopCA/totalCA*100) + '%;"></div></div><span style="font-size:11px;">' + coopCA.toLocaleString() + ' Ar</span></div>';
        
        document.getElementById('typeChart').innerHTML = 
            '<div style="display:flex;justify-content:center;gap:30px;text-align:center;">' +
                '<div><div style="width:70px;height:70px;border-radius:50%;background:conic-gradient(#1A5276 ' + Math.round(fleetCA/totalCA*360) + 'deg, #27AE60 0);margin:0 auto 8px;"></div><strong>🚛 Flottes</strong><br>' + fleetCA.toLocaleString() + ' Ar</div>' +
                '<div><div style="width:70px;height:70px;border-radius:50%;background:conic-gradient(#27AE60 ' + Math.round(coopCA/totalCA*360) + 'deg, #1A5276 0);margin:0 auto 8px;"></div><strong>🏢 Coops</strong><br>' + coopCA.toLocaleString() + ' Ar</div>' +
            '</div>';
        
        // Dernières transactions
        document.getElementById('allTx').innerHTML = courses.slice(0, 20).map(function(c) {
            var driver = drivers.find(function(d) { return d.id === c.driverId; });
            var org = orgs.find(function(o) { return o.id === c.organizationId; });
            return '<tr><td>' + new Date(c.date).toLocaleString('fr-FR') + '</td>' +
                '<td>' + (org ? org.name : 'N/A') + '</td>' +
                '<td><span class="badge badge-info">Course</span></td>' +
                '<td><strong>' + (c.price || 0).toLocaleString() + ' Ar</strong></td></tr>';
        }).join('') || '<tr><td colspan="4">Aucune transaction</td></tr>';
        
    } catch(e) { console.error(e); }
}
