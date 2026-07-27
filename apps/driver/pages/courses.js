function init_courses() {
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div style="background:linear-gradient(135deg,#F1C40F,#F39C12);color:#1A1A2E;padding:14px 16px;">' +
            '<h1 style="font-size:16px;"><i class="fas fa-history"></i> Historique des courses</h1>' +
            '<p style="font-size:11px;opacity:0.8;">' + (user.name || 'Chauffeur') + '</p>' +
        '</div>' +
        '<div style="padding:12px;max-width:500px;margin:0 auto;">' +
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;">' +
                '<div id="coursesList" style="max-height:70vh;overflow-y:auto;"></div>' +
            '</div>' +
        '</div>';
    loadCourses();
}

async function loadCourses() {
    try {
        var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
        var courses = await apiGet('/courses');
        var myCourses = courses.filter(function(c) { return c.driverId === user.driverId; });
        var html = '';
        myCourses.reverse().forEach(function(c) {
            html += '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #334155;">' +
                '<div><strong>' + (c.price || 0).toLocaleString() + ' Ar</strong><br><span style="font-size:10px;color:#94A3B8;">' + (c.distanceKm || 0) + ' km · ' + new Date(c.date).toLocaleDateString('fr-FR') + '</span></div>' +
                '<div style="text-align:right;"><span style="font-size:10px;color:#EF4444;">Comm: ' + (c.commission || 0).toLocaleString() + ' Ar</span><br><span style="font-size:10px;color:#22C55E;">Net: ' + ((c.price||0) - (c.commission||0)).toLocaleString() + ' Ar</span></div>' +
            '</div>';
        });
        document.getElementById('coursesList').innerHTML = html || '<p style="text-align:center;color:#94A3B8;padding:20px;">Aucune course</p>';
    } catch(e) {}
}
