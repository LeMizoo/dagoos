function init_home() {
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div style="background:linear-gradient(135deg,#F1C40F,#F39C12);color:#1A1A2E;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">' +
            '<div>' +
                '<h1 style="font-size:18px;"><i class="fas fa-motorcycle"></i> Bonjour, ' + (user.name || 'Chauffeur') + '</h1>' +
                '<p style="font-size:12px;opacity:0.8;">' + (user.driverCode || '') + ' | ' + (user.organization || '') + '</p>' +
            '</div>' +
            '<div style="text-align:right;">' +
                '<div style="font-size:28px;font-weight:900;" id="currentTime"></div>' +
                '<div style="font-size:11px;" id="currentDate"></div>' +
            '</div>' +
        '</div>' +
        
        // STATUT EN LIGNE
        '<div style="background:#1A1A2E;color:white;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;">' +
            '<span><i class="fas fa-circle" style="color:#27AE60;font-size:8px;"></i> En ligne</span>' +
            '<span style="font-size:12px;">Prêt pour les courses</span>' +
        '</div>' +
        
        // STATS DU JOUR
        '<div style="padding:16px;">' +
            '<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px;">' +
                '<div class="stat-card" style="background:white;text-align:center;">' +
                    '<div style="font-size:28px;font-weight:900;color:#1A5276;" id="statCourses">0</div>' +
                    '<div style="font-size:11px;color:#6C757D;">Courses aujourd\'hui</div>' +
                '</div>' +
                '<div class="stat-card" style="background:white;text-align:center;">' +
                    '<div style="font-size:28px;font-weight:900;color:#27AE60;" id="statCA">0 Ar</div>' +
                    '<div style="font-size:11px;color:#6C757D;">CA aujourd\'hui</div>' +
                '</div>' +
                '<div class="stat-card" style="background:white;text-align:center;">' +
                    '<div style="font-size:28px;font-weight:900;color:#F39C12;" id="statGain">0 Ar</div>' +
                    '<div style="font-size:11px;color:#6C757D;">Gain net estimé</div>' +
                '</div>' +
            '</div>' +
            
            // DERNIÈRES COURSES
            '<div class="card">' +
                '<div class="card-header"><h3><i class="fas fa-history"></i> Dernières courses</h3></div>' +
                '<div id="recentCourses" style="padding:0 16px 16px;max-height:300px;overflow-y:auto;">' +
                    '<p style="text-align:center;color:#6C757D;padding:20px;">Aucune course aujourd\'hui</p>' +
                '</div>' +
            '</div>' +
            
            // ACTIONS RAPIDES
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px;">' +
                '<button class="action-card" style="background:#E74C3C;padding:16px;border:none;border-radius:12px;color:white;cursor:pointer;font-family:Inter,sans-serif;font-weight:600;" onclick="alert(\'Signalement envoyé\')">' +
                    '<i class="fas fa-exclamation-triangle"></i> Signaler un problème' +
                '</button>' +
                '<button class="action-card" style="background:#3498DB;padding:16px;border:none;border-radius:12px;color:white;cursor:pointer;font-family:Inter,sans-serif;font-weight:600;" onclick="alert(\'Assistance demandée\')">' +
                    '<i class="fas fa-headset"></i> Demander assistance' +
                '</button>' +
            '</div>' +
        '</div>';
    
    updateTime();
    setInterval(updateTime, 30000);
    loadDriverStats();
    setInterval(loadDriverStats, 60000);
}

function updateTime() {
    var now = new Date();
    var timeEl = document.getElementById('currentTime');
    var dateEl = document.getElementById('currentDate');
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (dateEl) dateEl.textContent = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

async function loadDriverStats() {
    try {
        var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
        var courses = await apiGet('/courses');
        var myCourses = courses.filter(function(c) { return c.driverId === user.driverId; });
        
        var today = new Date().toISOString().split('T')[0];
        var todayCourses = myCourses.filter(function(c) { return c.date && c.date.startsWith(today); });
        var caToday = todayCourses.reduce(function(s, c) { return s + (c.price || 0); }, 0);
        var commissionToday = todayCourses.reduce(function(s, c) { return s + (c.commission || 0); }, 0);
        
        document.getElementById('statCourses').textContent = todayCourses.length;
        document.getElementById('statCA').textContent = caToday.toLocaleString() + ' Ar';
        document.getElementById('statGain').textContent = (caToday - commissionToday).toLocaleString() + ' Ar';
        
        // Dernières courses
        var recentEl = document.getElementById('recentCourses');
        if (recentEl && todayCourses.length) {
            recentEl.innerHTML = todayCourses.reverse().map(function(c) {
                return '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #F1F5F9;">' +
                    '<div><strong>' + (c.price || 0).toLocaleString() + ' Ar</strong><br><span style="font-size:11px;color:#6C757D;">' + (c.distanceKm || 0) + ' km</span></div>' +
                    '<div style="text-align:right;"><span style="font-size:11px;">' + new Date(c.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + '</span><br><span style="font-size:10px;color:#27AE60;">Commission: ' + (c.commission || 0).toLocaleString() + ' Ar</span></div>' +
                '</div>';
            }).join('');
        }
    } catch(e) { console.error(e); }
}
