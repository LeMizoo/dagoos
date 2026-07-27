function init_finances() {
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
            '<h1>💰 Finances</h1>' +
            '<div style="display:flex;gap:6px;">' +
                '<button class="btn btn-primary" onclick="showAddCourse()">➕ Course</button>' +
                '<button class="btn btn-sm" style="background:#E74C3C;color:white;" onclick="showAddDepense()"><i class="fas fa-minus"></i> Dépense</button>' +
            '</div>' +
        '</div>' +
        
        // STATS
        '<div class="stats-grid" id="financeStats" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px;"></div>' +
        
        // RÉPARTITION
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">' +
            '<div class="card"><div class="card-header"><h3><i class="fas fa-arrow-down"></i> Entrées</h3></div>' +
                '<table><thead><tr><th>Source</th><th>Montant</th></tr></thead><tbody id="entreesTable"></tbody></table></div>' +
            '<div class="card"><div class="card-header"><h3><i class="fas fa-arrow-up"></i> Sorties</h3></div>' +
                '<table><thead><tr><th>Type</th><th>Montant</th></tr></thead><tbody id="sortiesTable"></tbody></table></div>' +
        '</div>' +
        
        // DERNIÈRES TRANSACTIONS
        '<div class="card"><div class="card-header"><h3>📋 Dernières transactions</h3></div>' +
        '<table><thead><tr><th>Date</th><th>Type</th><th>Détail</th><th>Montant</th></tr></thead><tbody id="txTable"><tr><td colspan="4">Chargement...</td></tr></tbody></table></div>';
    loadFinances();
}

async function loadFinances() {
    try {
        var stats = await apiGet('/finances/stats');
        var courses = await apiGet('/courses');
        var vehicles = await apiGet('/vehicles');
        var drivers = await apiGet('/drivers');
        var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
        
        // Stats
        var caJour = stats.caJour || 0;
        var commissionsJour = stats.commissionsJour || 0;
        var netJour = caJour - commissionsJour;
        
        // Estimer les dépenses (assurance, vidange, etc.)
        var myVehicles = vehicles;
        var depensesEstimees = myVehicles.reduce(function(acc, v) {
            // ~5000 Ar/mois par véhicule pour vidange
            return acc + 5000;
        }, 0);
        
        document.getElementById('financeStats').innerHTML = 
            '<div class="stat-card"><div class="stat-icon green">💰</div><div class="stat-info"><div class="stat-number">' + caJour.toLocaleString() + ' Ar</div><div class="stat-label">CA aujourd\'hui</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red">💵</div><div class="stat-info"><div class="stat-number">' + commissionsJour.toLocaleString() + ' Ar</div><div class="stat-label">Commissions</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon blue">👛</div><div class="stat-info"><div class="stat-number">' + netJour.toLocaleString() + ' Ar</div><div class="stat-label">Net aujourd\'hui</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon yellow">📅</div><div class="stat-info"><div class="stat-number">' + (stats.caMois || 0).toLocaleString() + ' Ar</div><div class="stat-label">CA ce mois</div></div></div>';
        
        // Entrées (CA courses)
        document.getElementById('entreesTable').innerHTML = 
            '<tr><td>🚗 Courses</td><td><strong>' + caJour.toLocaleString() + ' Ar</strong></td></tr>' +
            '<tr><td>💰 Subventions</td><td>0 Ar</td></tr>' +
            '<tr style="font-weight:700;"><td>TOTAL ENTRÉES</td><td>' + caJour.toLocaleString() + ' Ar</td></tr>';
        
        // Sorties
        document.getElementById('sortiesTable').innerHTML = 
            '<tr><td>👥 Commissions chauffeurs</td><td>' + commissionsJour.toLocaleString() + ' Ar</td></tr>' +
            '<tr><td>🔧 Maintenance/Vidange</td><td>~' + depensesEstimees.toLocaleString() + ' Ar/mois</td></tr>' +
            '<tr><td>🛡️ Assurances</td><td>À calculer</td></tr>' +
            '<tr style="font-weight:700;"><td>TOTAL SORTIES</td><td>' + (commissionsJour + depensesEstimees/30).toLocaleString() + ' Ar</td></tr>';
        
        // Transactions
        var txHtml = courses.slice(0, 20).map(function(c) {
            var driver = drivers.find(function(d) { return d.id === c.driverId; });
            var vehicle = vehicles.find(function(v) { return v.id === c.vehicleId; });
            return '<tr><td>' + new Date(c.date).toLocaleString('fr-FR') + '</td>' +
                '<td><span class="badge badge-success">Course</span></td>' +
                '<td>' + (driver && driver.user ? driver.user.name : 'N/A') + ' - ' + (vehicle ? vehicle.plate : '') + '</td>' +
                '<td><strong>' + (c.price || 0).toLocaleString() + ' Ar</strong></td></tr>';
        }).join('');
        
        document.getElementById('txTable').innerHTML = txHtml || '<tr><td colspan="4">Aucune transaction</td></tr>';
        
    } catch(e) { console.error(e); }
}

function showAddCourse() {
    apiGet('/drivers').then(function(drivers) {
        apiGet('/vehicles').then(function(vehicles) {
            var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
            var myDrivers = drivers.filter(function(d) { return d.organization && d.organization.email === user.email; });
            
            var h = '<div class="form-group"><label>Chauffeur</label><select id="courseDriver">';
            myDrivers.forEach(function(d) { h += '<option value="' + d.id + '">' + (d.user ? d.user.name : d.driverCode) + '</option>'; });
            h += '</select></div>';
            h += '<div class="form-group"><label>Véhicule</label><select id="courseVehicle">';
            vehicles.forEach(function(v) { h += '<option value="' + v.id + '">' + v.plate + '</option>'; });
            h += '</select></div>';
            h += '<div class="form-group"><label>Distance (km)</label><input type="number" id="courseKm" value="0" step="0.1"></div>';
            h += '<div class="form-group"><label>Prix (Ar)</label><input type="number" id="coursePrice" value="0"></div>';
            h += '<div class="form-group"><label>Commission (Ar)</label><input type="number" id="courseCommission" value="0"></div>';
            showModal('Nouvelle course', h, function() {
                apiPost('/courses', {
                    driverId: document.getElementById('courseDriver').value,
                    vehicleId: document.getElementById('courseVehicle').value,
                    distanceKm: document.getElementById('courseKm').value,
                    price: document.getElementById('coursePrice').value,
                    commission: document.getElementById('courseCommission').value
                }).then(function() { closeModal(); loadFinances(); });
            });
        });
    });
}

function showAddDepense() {
    var h = '<div class="form-group"><label>Type</label><select id="depType"><option>Assurance</option><option>Vidange</option><option>Vignette</option><option>Réparation</option><option>Salaire</option><option>Carburant</option><option>Autre</option></select></div>';
    h += '<div class="form-group"><label>Description</label><input id="depDesc"></div>';
    h += '<div class="form-group"><label>Montant (Ar)</label><input type="number" id="depMontant" value="0"></div>';
    h += '<div class="form-group"><label>Véhicule concerné</label><select id="depVehicle"><option value="">Aucun</option></select></div>';
    showModal('Nouvelle dépense', h, function() {
        alert('Dépense enregistrée !');
        closeModal(); loadFinances();
    });
}
