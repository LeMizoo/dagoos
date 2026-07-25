function init_finances() {
    document.getElementById('mainInner').innerHTML = 
        '<div class="topbar"><h1><i class="fas fa-coins"></i> Finances globales</h1></div>' +
        '<div class="stats-grid" id="globalStats" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px;"></div>' +
        '<div class="card"><div class="card-header"><h3><i class="fas fa-chart-bar"></i> CA par organisation</h3></div><div id="orgCA" style="padding:16px;"></div></div>' +
        '<div class="card"><div class="card-header"><h3><i class="fas fa-list"></i> Dernières courses toutes flottes</h3></div>' +
        '<table><thead><tr><th>Date</th><th>Flotte</th><th>Chauffeur</th><th>Véhicule</th><th>Prix</th></tr></thead><tbody id="allCourses"></tbody></table></div>';
    loadGlobalFinances();
}

async function loadGlobalFinances() {
    try {
        var stats = await apiGet('/finances/stats');
        var courses = await apiGet('/courses');
        var orgs = await apiGet('/organizations');
        var drivers = await apiGet('/drivers');
        var vehicles = await apiGet('/vehicles');
        
        document.getElementById('globalStats').innerHTML = 
            '<div class="stat-card"><div class="stat-icon green"><i class="fas fa-coins"></i></div><div class="stat-info"><div class="stat-number">' + (stats.caJour || 0).toLocaleString() + ' Ar</div><div class="stat-label">CA global aujourd\'hui</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon blue"><i class="fas fa-calendar-week"></i></div><div class="stat-info"><div class="stat-number">' + (stats.caSemaine || 0).toLocaleString() + ' Ar</div><div class="stat-label">CA cette semaine</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-calendar-alt"></i></div><div class="stat-info"><div class="stat-number">' + (stats.caMois || 0).toLocaleString() + ' Ar</div><div class="stat-label">CA ce mois</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red"><i class="fas fa-building"></i></div><div class="stat-info"><div class="stat-number">' + orgs.length + '</div><div class="stat-label">Organisations</div></div></div>';
        
        document.getElementById('allCourses').innerHTML = courses.slice(0, 20).map(function(c) {
            var driver = drivers.find(function(d) { return d.id === c.driverId; });
            var vehicle = vehicles.find(function(v) { return v.id === c.vehicleId; });
            var org = driver && driver.organization ? driver.organization.name : 'N/A';
            return '<tr><td>' + new Date(c.date).toLocaleString('fr-FR') + '</td>' +
                '<td>' + org + '</td>' +
                '<td>' + (driver && driver.user ? driver.user.name : 'N/A') + '</td>' +
                '<td>' + (vehicle ? vehicle.plate : 'N/A') + '</td>' +
                '<td><strong>' + (c.price || 0).toLocaleString() + ' Ar</strong></td></tr>';
        }).join('') || '<tr><td colspan="5">Aucune course</td></tr>';
    } catch(e) { console.error(e); }
}
