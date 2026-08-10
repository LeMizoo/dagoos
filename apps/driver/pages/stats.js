// ========================================
// DRIVER - STATISTIQUES
// ========================================
async function init_stats() {
    var main = document.getElementById('mainContent');
    var user = JSON.parse(localStorage.getItem("dagoos_user") || "{}");
    
    main.innerHTML = '<div style="padding:12px;max-width:500px;margin:0 auto;padding-bottom:80px;"><div style="text-align:center;padding:40px;color:#DAA520;"><i class="fas fa-spinner fa-spin"></i> Chargement...</div></div>';

    try {
        var courses = await apiGet('/courses?driverId=' + user.driverId);
        var arr = Array.isArray(courses) ? courses : [];
        
        var today = new Date().toISOString().split('T')[0];
        var todayCourses = arr.filter(function(c) { return c.date && c.date.startsWith(today); });
        var weekCourses = arr;
        
        var caJour = todayCourses.reduce(function(s, c) { return s + (c.price || 0); }, 0);
        var comJour = Math.round(caJour * 0.20);
        var netJour = Math.round(caJour * 0.80);
        var caSem = weekCourses.reduce(function(s, c) { return s + (c.price || 0); }, 0);
        var comSem = Math.round(caSem * 0.20);
        var netSem = Math.round(caSem * 0.80);

        main.innerHTML = 
            '<div style="padding:12px;max-width:500px;margin:0 auto;padding-bottom:80px;">' +
                '<div class="card" style="background:#1E293B;border-radius:12px;padding:20px;margin-bottom:12px;">' +
                    '<h3 style="color:#DAA520;margin-bottom:16px;">📅 Aujourd\'hui</h3>' +
                    '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;text-align:center;">' +
                        '<div style="background:#252525;border-radius:10px;padding:12px;"><div style="font-size:24px;font-weight:800;color:#fff;">' + todayCourses.length + '</div><div style="font-size:10px;color:#888;">Courses</div></div>' +
                        '<div style="background:#252525;border-radius:10px;padding:12px;"><div style="font-size:24px;font-weight:800;color:#22C55E;">' + caJour.toLocaleString() + ' Ar</div><div style="font-size:10px;color:#888;">CA Brut</div></div>' +
                        '<div style="background:#252525;border-radius:10px;padding:12px;"><div style="font-size:24px;font-weight:800;color:#3B82F6;">' + comJour.toLocaleString() + ' Ar</div><div style="font-size:10px;color:#888;">Commission (gardé)</div></div>' +
                        '<div style="background:#252525;border-radius:10px;padding:12px;"><div style="font-size:24px;font-weight:800;color:#8B5CF6;">' + netJour.toLocaleString() + ' Ar</div><div style="font-size:10px;color:#888;">Net (versé)</div></div>' +
                    '</div>' +
                '</div>' +
                '<div class="card" style="background:#1E293B;border-radius:12px;padding:20px;margin-bottom:12px;">' +
                    '<h3 style="color:#DAA520;margin-bottom:16px;">📆 Cette semaine</h3>' +
                    '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;text-align:center;">' +
                        '<div style="background:#252525;border-radius:10px;padding:12px;"><div style="font-size:20px;font-weight:800;color:#fff;">' + weekCourses.length + '</div><div style="font-size:10px;color:#888;">Courses</div></div>' +
                        '<div style="background:#252525;border-radius:10px;padding:12px;"><div style="font-size:20px;font-weight:800;color:#22C55E;">' + caSem.toLocaleString() + ' Ar</div><div style="font-size:10px;color:#888;">CA Brut</div></div>' +
                        '<div style="background:#252525;border-radius:10px;padding:12px;"><div style="font-size:20px;font-weight:800;color:#3B82F6;">' + comSem.toLocaleString() + ' Ar</div><div style="font-size:10px;color:#888;">Commission</div></div>' +
                        '<div style="background:#252525;border-radius:10px;padding:12px;"><div style="font-size:20px;font-weight:800;color:#8B5CF6;">' + netSem.toLocaleString() + ' Ar</div><div style="font-size:10px;color:#888;">Net</div></div>' +
                    '</div>' +
                '</div>' +
            '</div>';
    } catch(e) {
        main.innerHTML = '<div style="text-align:center;padding:40px;color:#F87171;">Erreur de chargement</div>';
    }
}

window.init_stats = init_stats;
