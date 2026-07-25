function init_rapports() {
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
            '<h1><i class="fas fa-chart-bar"></i> Rapports</h1>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">' +
            '<div class="card" style="padding:20px;text-align:center;cursor:pointer;" onclick="alert(\'Export Excel à venir\')"><i class="fas fa-file-excel" style="font-size:40px;color:#27AE60;"></i><h3>Export Excel</h3><p style="color:var(--text2);">Véhicules, chauffeurs, finances</p></div>' +
            '<div class="card" style="padding:20px;text-align:center;cursor:pointer;" onclick="alert(\'Export PDF à venir\')"><i class="fas fa-file-pdf" style="font-size:40px;color:#E74C3C;"></i><h3>Export PDF</h3><p style="color:var(--text2);">Rapport complet</p></div>' +
            '<div class="card" style="padding:20px;text-align:center;cursor:pointer;" onclick="alert(\'Statistiques à venir\')"><i class="fas fa-chart-pie" style="font-size:40px;color:#3498DB;"></i><h3>Statistiques</h3><p style="color:var(--text2);">Graphiques et analyses</p></div>' +
        '</div>';
}
