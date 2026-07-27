function init_rapports() {
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
            '<h1><i class="fas fa-chart-bar"></i> Rapports</h1>' +
        '</div>' +
        
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px;">' +
            '<div class="card" style="padding:20px;text-align:center;cursor:pointer;" onclick="exportVehicules()">' +
                '<i class="fas fa-motorcycle" style="font-size:40px;color:#27AE60;margin-bottom:10px;"></i>' +
                '<h3>Export Véhicules</h3>' +
                '<p style="color:var(--text2);font-size:12px;">Liste complète des véhicules</p>' +
            '</div>' +
            '<div class="card" style="padding:20px;text-align:center;cursor:pointer;" onclick="exportChauffeurs()">' +
                '<i class="fas fa-users" style="font-size:40px;color:#27AE60;margin-bottom:10px;"></i>' +
                '<h3>Export Chauffeurs</h3>' +
                '<p style="color:var(--text2);font-size:12px;">Liste complète des chauffeurs</p>' +
            '</div>' +
            '<div class="card" style="padding:20px;text-align:center;cursor:pointer;" onclick="exportFinances()">' +
                '<i class="fas fa-coins" style="font-size:40px;color:#F39C12;margin-bottom:10px;"></i>' +
                '<h3>Export Finances</h3>' +
                '<p style="color:var(--text2);font-size:12px;">Courses, CA, commissions</p>' +
            '</div>' +
        '</div>' +
        
        '<div class="card">' +
            '<div class="card-header"><h3><i class="fas fa-table"></i> Aperçu avant export</h3>' +
                '<select id="reportType" onchange="loadPreview()" style="padding:6px;border:1px solid var(--border);border-radius:6px;">' +
                    '<option value="vehicules">Véhicules</option>' +
                    '<option value="chauffeurs">Chauffeurs</option>' +
                    '<option value="finances">Finances</option>' +
                '</select>' +
            '</div>' +
            '<div style="overflow-x:auto;"><table id="previewTable"><thead><tr><th colspan="5">Chargement...</th></tr></thead><tbody></tbody></table></div>' +
        '</div>';
    
    loadPreview();
}

async function loadPreview() {
    var type = document.getElementById('reportType').value;
    var vehicles = await apiGet('/vehicles');
    var drivers = await apiGet('/drivers');
    var courses = await apiGet('/courses');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var orgs = await apiGet('/organizations');
    var org = orgs.find(function(o) { return o.email === user.email; });
    
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === (org ? org.id : null); });
    var myDrivers = drivers.filter(function(d) { return d.organization && d.organization.email === user.email; });
    var myCourses = courses.filter(function(c) { return myDrivers.find(function(d) { return d.id === c.driverId; }); });
    
    var html = '';
    
    if (type === 'vehicules') {
        html = '<thead><tr><th>Immatriculation</th><th>Modèle</th><th>Km</th><th>Vidange</th><th>Assurance</th></tr></thead><tbody>';
        myVehicles.forEach(function(v) {
            html += '<tr><td>' + (v.plate || 'N/A') + '</td><td>' + (v.model || 'N/A') + '</td><td>' + (v.currentKm || 0).toLocaleString() + '</td><td>' + (v.nextMaintenanceKm || 0).toLocaleString() + ' km</td><td>' + (v.insuranceDate || 'N/A') + '</td></tr>';
        });
        html += '</tbody>';
    } else if (type === 'chauffeurs') {
        html = '<thead><tr><th>Code</th><th>Nom</th><th>Email</th><th>Véhicule</th><th>Statut</th></tr></thead><tbody>';
        myDrivers.forEach(function(d) {
            var moto = myVehicles.find(function(v) { return v.id === d.vehicleId; });
            html += '<tr><td>' + d.driverCode + '</td><td>' + (d.user ? d.user.name : 'N/A') + '</td><td>' + (d.user ? d.user.email : 'N/A') + '</td><td>' + (moto ? moto.plate : 'Non assigné') + '</td><td>' + d.status + '</td></tr>';
        });
        html += '</tbody>';
    } else if (type === 'finances') {
        html = '<thead><tr><th>Date</th><th>Chauffeur</th><th>Véhicule</th><th>Distance</th><th>Prix</th><th>Commission</th></tr></thead><tbody>';
        myCourses.slice(0, 50).forEach(function(c) {
            var driver = myDrivers.find(function(d) { return d.id === c.driverId; });
            var moto = myVehicles.find(function(v) { return v.id === c.vehicleId; });
            html += '<tr><td>' + new Date(c.date).toLocaleDateString('fr-FR') + '</td><td>' + (driver && driver.user ? driver.user.name : 'N/A') + '</td><td>' + (moto ? moto.plate : 'N/A') + '</td><td>' + (c.distanceKm || 0) + ' km</td><td>' + (c.price || 0).toLocaleString() + ' Ar</td><td>' + (c.commission || 0).toLocaleString() + ' Ar</td></tr>';
        });
        html += '</tbody>';
    }
    
    document.getElementById('previewTable').innerHTML = html || '<tbody><tr><td colspan="6">Aucune donnée</td></tr></tbody>';
}

function exportVehicules() {
    apiGet('/vehicles').then(function(vehicles) {
        var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
        apiGet('/organizations').then(function(orgs) {
            var org = orgs.find(function(o) { return o.email === user.email; });
            var myVehicles = vehicles.filter(function(v) { return v.organizationId === (org ? org.id : null); });
            var csv = 'Immatriculation,Modèle,Année,Km actuels,Prochaine vidange,Assurance,Statut\n';
            myVehicles.forEach(function(v) {
                csv += '"' + (v.plate || '') + '","' + (v.model || '') + '","' + (v.year || '') + '","' + (v.currentKm || 0) + '","' + (v.nextMaintenanceKm || 0) + '","' + (v.insuranceDate || '') + '","' + (v.status || '') + '"\n';
            });
            downloadCSV(csv, 'vehicules.csv');
        });
    });
}

function exportChauffeurs() {
    apiGet('/drivers').then(function(drivers) {
        var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
        var myDrivers = drivers.filter(function(d) { return d.organization && d.organization.email === user.email; });
        var csv = 'Code,Nom,Email,Téléphone,Véhicule,Statut\n';
        apiGet('/vehicles').then(function(vehicles) {
            myDrivers.forEach(function(d) {
                var moto = vehicles.find(function(v) { return v.id === d.vehicleId; });
                csv += '"' + d.driverCode + '","' + (d.user ? d.user.name : '') + '","' + (d.user ? d.user.email : '') + '","' + (d.user ? d.user.phone : '') + '","' + (moto ? moto.plate : '') + '","' + d.status + '"\n';
            });
            downloadCSV(csv, 'chauffeurs.csv');
        });
    });
}

function exportFinances() {
    apiGet('/courses').then(function(courses) {
        var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
        apiGet('/drivers').then(function(drivers) {
            apiGet('/vehicles').then(function(vehicles) {
                var myDrivers = drivers.filter(function(d) { return d.organization && d.organization.email === user.email; });
                var myCourses = courses.filter(function(c) { return myDrivers.find(function(d) { return d.id === c.driverId; }); });
                var csv = 'Date,Chauffeur,Véhicule,Distance (km),Prix (Ar),Commission (Ar)\n';
                myCourses.forEach(function(c) {
                    var driver = myDrivers.find(function(d) { return d.id === c.driverId; });
                    var moto = vehicles.find(function(v) { return v.id === c.vehicleId; });
                    csv += '"' + (c.date || '') + '","' + (driver && driver.user ? driver.user.name : '') + '","' + (moto ? moto.plate : '') + '","' + (c.distanceKm || 0) + '","' + (c.price || 0) + '","' + (c.commission || 0) + '"\n';
                });
                downloadCSV(csv, 'finances.csv');
            });
        });
    });
}

function downloadCSV(csv, filename) {
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}
