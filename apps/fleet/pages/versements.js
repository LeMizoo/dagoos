function init_versements() {
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
            '<h1>💵 Versements</h1>' +
        '</div>' +
        '<div class="stats-grid" id="versStats" style="grid-template-columns:repeat(4,1fr);margin-bottom:14px;"></div>' +
        '<div class="card"><table><thead><tr><th>Code</th><th>Chauffeur</th><th>Courses</th><th>CA brut</th><th>Commission</th><th>Net à verser</th></tr></thead><tbody id="versementsTable"><tr><td colspan="6">Chargement...</td></tr></tbody></table></div>';
    loadVersements();
}

async function loadVersements() {
    try {
        var data = await apiGet('/versements');
        var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
        var drivers = await apiGet('/drivers');
        var myDrivers = drivers.filter(function(d) { return d.organization && d.organization.email === user.email; });
        var myDriverIds = myDrivers.map(function(d) { return d.id; });
        var myVersements = data.filter(function(v) { return myDriverIds.indexOf(v.driverId) !== -1; });
        
        var totalCA = myVersements.reduce(function(s, v) { return s + v.caBrut; }, 0);
        var totalCommission = myVersements.reduce(function(s, v) { return s + v.commission; }, 0);
        var totalNet = myVersements.reduce(function(s, v) { return s + v.net; }, 0);
        
        document.getElementById('versStats').innerHTML = 
            '<div class="stat-card"><div class="stat-icon green">💰</div><div class="stat-info"><div class="stat-number">' + totalCA.toLocaleString() + ' Ar</div><div class="stat-label">CA brut total</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red">💵</div><div class="stat-info"><div class="stat-number">' + totalCommission.toLocaleString() + ' Ar</div><div class="stat-label">Commissions</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon blue">👛</div><div class="stat-info"><div class="stat-number">' + totalNet.toLocaleString() + ' Ar</div><div class="stat-label">Net à verser</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon yellow">👥</div><div class="stat-info"><div class="stat-number">' + myVersements.length + '</div><div class="stat-label">Chauffeurs actifs</div></div></div>';
        
        document.getElementById('versementsTable').innerHTML = myVersements.map(function(v) {
            return '<tr><td><code>' + v.code + '</code></td><td><strong>' + v.name + '</strong></td>' +
                '<td>' + v.nbCourses + '</td>' +
                '<td>' + v.caBrut.toLocaleString() + ' Ar</td>' +
                '<td>' + v.commission.toLocaleString() + ' Ar</td>' +
                '<td><strong>' + v.net.toLocaleString() + ' Ar</strong></td></tr>';
        }).join('') || '<tr><td colspan="6">Aucun versement aujourd\'hui</td></tr>';
    } catch(e) { console.error(e); }
}
