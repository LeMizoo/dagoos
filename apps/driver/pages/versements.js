function init_versements() {
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div style="background:linear-gradient(135deg,#F1C40F,#F39C12);color:#1A1A2E;padding:14px 16px;">' +
            '<h1 style="font-size:16px;"><i class="fas fa-coins"></i> Versements</h1>' +
        '</div>' +
        '<div style="padding:12px;max-width:500px;margin:0 auto;">' +
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:8px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;">💵 Aujourd\'hui</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;text-align:center;">' +
                    '<div><div style="font-size:20px;font-weight:800;color:#22C55E;" id="versBrut">0 Ar</div><div style="font-size:10px;color:#94A3B8;">CA brut</div></div>' +
                    '<div><div style="font-size:20px;font-weight:800;color:#EF4444;" id="versComm">0 Ar</div><div style="font-size:10px;color:#94A3B8;">Commission</div></div>' +
                '</div>' +
                '<div style="text-align:center;margin-top:10px;padding:10px;background:rgba(218,165,32,0.1);border-radius:8px;">' +
                    '<div style="font-size:12px;color:#DAA520;">Net à verser</div>' +
                    '<div style="font-size:24px;font-weight:800;color:#DAA520;" id="versNet">0 Ar</div>' +
                '</div>' +
            '</div>' +
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;">📆 Semaine</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;text-align:center;">' +
                    '<div><div style="font-size:18px;font-weight:800;color:#22C55E;" id="versSemBrut">0 Ar</div><div style="font-size:10px;color:#94A3B8;">CA brut</div></div>' +
                    '<div><div style="font-size:18px;font-weight:800;color:#3B82F6;" id="versSemNet">0 Ar</div><div style="font-size:10px;color:#94A3B8;">Net</div></div>' +
                '</div>' +
            '</div>' +
        '</div>';
    loadVersements();
}

async function loadVersements() {
    try {
        var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
        var courses = await apiGet('/courses');
        var myCourses = courses.filter(function(c) { return c.driverId === user.driverId; });
        var today = new Date().toISOString().split('T')[0];
        var todayCourses = myCourses.filter(function(c) { return c.date && c.date.startsWith(today); });
        var weekCourses = myCourses.filter(function(c) {
            var d = new Date(c.date);
            return d >= new Date(Date.now() - 7*24*60*60*1000);
        });
        
        var caToday = todayCourses.reduce(function(s,c){return s+(c.price||0);},0);
        var commToday = todayCourses.reduce(function(s,c){return s+(c.commission||0);},0);
        var caWeek = weekCourses.reduce(function(s,c){return s+(c.price||0);},0);
        var commWeek = weekCourses.reduce(function(s,c){return s+(c.commission||0);},0);
        
        document.getElementById('versBrut').textContent = caToday.toLocaleString() + ' Ar';
        document.getElementById('versComm').textContent = commToday.toLocaleString() + ' Ar';
        document.getElementById('versNet').textContent = (caToday - commToday).toLocaleString() + ' Ar';
        document.getElementById('versSemBrut').textContent = caWeek.toLocaleString() + ' Ar';
        document.getElementById('versSemNet').textContent = (caWeek - commWeek).toLocaleString() + ' Ar';
    } catch(e) {}
}
