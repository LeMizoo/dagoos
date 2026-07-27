function init_stats() {
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div style="background:linear-gradient(135deg,#F1C40F,#F39C12);color:#1A1A2E;padding:14px 16px;">' +
            '<h1 style="font-size:16px;"><i class="fas fa-chart-bar"></i> Statistiques</h1>' +
        '</div>' +
        '<div style="padding:12px;max-width:500px;margin:0 auto;">' +
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:8px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;">📅 Ce mois</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;">' +
                    '<div><div style="font-size:20px;font-weight:800;color:#fff;" id="statMoisCourses">0</div><div style="font-size:10px;color:#94A3B8;">Courses</div></div>' +
                    '<div><div style="font-size:20px;font-weight:800;color:#22C55E;" id="statMoisCA">0 Ar</div><div style="font-size:10px;color:#94A3B8;">CA</div></div>' +
                    '<div><div style="font-size:20px;font-weight:800;color:#3B82F6;" id="statMoisGain">0 Ar</div><div style="font-size:10px;color:#94A3B8;">Gain net</div></div>' +
                '</div>' +
            '</div>' +
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;">📊 Résumé</h3>' +
                '<div id="statsSummary" style="color:#94A3B8;font-size:12px;"></div>' +
            '</div>' +
        '</div>';
    loadStats();
}

async function loadStats() {
    try {
        var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
        var courses = await apiGet('/courses');
        var myCourses = courses.filter(function(c) { return c.driverId === user.driverId; });
        var moisCourses = myCourses.filter(function(c) {
            var d = new Date(c.date);
            var now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        var caMois = moisCourses.reduce(function(s, c) { return s + (c.price || 0); }, 0);
        var commMois = moisCourses.reduce(function(s, c) { return s + (c.commission || 0); }, 0);
        
        document.getElementById('statMoisCourses').textContent = moisCourses.length;
        document.getElementById('statMoisCA').textContent = caMois.toLocaleString() + ' Ar';
        document.getElementById('statMoisGain').textContent = (caMois - commMois).toLocaleString() + ' Ar';
        document.getElementById('statsSummary').innerHTML = 
            'Total courses: <strong>' + myCourses.length + '</strong><br>' +
            'CA total: <strong>' + myCourses.reduce(function(s,c){return s+(c.price||0);},0).toLocaleString() + ' Ar</strong><br>' +
            'Km parcourus: <strong>' + myCourses.reduce(function(s,c){return s+(c.distanceKm||0);},0).toLocaleString() + ' km</strong>';
    } catch(e) {}
}
