// ========================================
// DRIVER - HISTORIQUE COURSES
// ========================================
async function init_courses() {
    var main = document.getElementById('mainContent');
    var user = JSON.parse(localStorage.getItem("dagoos_user") || "{}");
    
    main.innerHTML = '<div style="padding:12px;max-width:500px;margin:0 auto;padding-bottom:80px;"><div style="text-align:center;padding:40px;color:#DAA520;">Chargement...</div></div>';

    try {
        var courses = await apiGet('/courses?driverId=' + user.driverId);
        var arr = Array.isArray(courses) ? courses : [];
        arr.sort(function(a, b) { return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt); });

        var html = '<div style="padding:12px;max-width:500px;margin:0 auto;padding-bottom:80px;">' +
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:16px;margin-bottom:12px;">' +
                '<h3 style="color:#DAA520;margin-bottom:12px;">🕐 Historique (' + arr.length + ' courses)</h3>';

        if (arr.length === 0) {
            html += '<p style="text-align:center;color:#94A3B8;padding:20px;">Aucune course enregistrée</p>';
        } else {
            var total = 0;
            for (var i = 0; i < arr.length; i++) {
                var c = arr[i];
                total += c.price || 0;
                var date = new Date(c.date || c.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
                var time = new Date(c.date || c.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                html += '<div style="background:#252525;border-radius:10px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">' +
                    '<div>' +
                        '<div style="font-size:11px;color:#888;">' + date + ' ' + time + '</div>' +
                        '<div style="font-weight:600;color:#fff;">' + (c.type || 'Course') + '</div>' +
                        (c.distanceKm ? '<div style="font-size:11px;color:#94A3B8;">📏 ' + c.distanceKm + ' km</div>' : '') +
                    '</div>' +
                    '<div style="text-align:right;">' +
                        '<div style="font-weight:700;color:#DAA520;">' + (c.price || 0).toLocaleString() + ' Ar</div>' +
                        '<div style="font-size:10px;color:#888;">Commission: ' + (c.commission || 0).toLocaleString() + ' Ar</div>' +
                    '</div>' +
                '</div>';
            }
            html += '<div style="text-align:right;padding:8px;font-weight:700;color:#DAA520;">Total: ' + total.toLocaleString() + ' Ar</div>';
        }
        html += '</div></div>';
        main.innerHTML = html;
    } catch(e) {
        main.innerHTML = '<div style="text-align:center;padding:40px;color:#F87171;">Erreur de chargement</div>';
    }
}

window.init_courses = init_courses;
