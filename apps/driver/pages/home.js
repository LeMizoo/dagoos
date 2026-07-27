function init_home() {
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        // HEADER
        '<div style="background:linear-gradient(135deg,#F1C40F,#F39C12);color:#1A1A2E;padding:14px 16px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                '<div>' +
                    '<h1 style="font-size:16px;margin:0;">👋 ' + (user.name || 'Chauffeur') + '</h1>' +
                    '<p style="font-size:11px;opacity:0.8;margin:2px 0;">' + (user.driverCode || '') + ' · ' + (user.organization || '') + '</p>' +
                '</div>' +
                '<div style="text-align:right;">' +
                    '<div style="font-size:24px;font-weight:900;" id="currentTime"></div>' +
                    '<div style="font-size:10px;" id="currentDate"></div>' +
                '</div>' +
            '</div>' +
        '</div>' +
        
        // STATUT
        '<div id="statusBar" style="background:#1A1A2E;color:white;padding:8px 16px;font-size:12px;display:flex;justify-content:space-between;align-items:center;"></div>' +
        
        // BOUTONS SERVICE
        '<div style="display:flex;gap:6px;padding:10px 12px;background:white;">' +
            '<button onclick="pointer(\'ARRIVEE\')" class="driver-btn" style="flex:1;padding:12px;background:#27AE60;color:white;border:none;border-radius:10px;font-weight:600;cursor:pointer;">▶️ Début</button>' +
            '<button onclick="pointer(\'PAUSE\')" class="driver-btn" style="flex:1;padding:12px;background:#F39C12;color:white;border:none;border-radius:10px;font-weight:600;cursor:pointer;">⏸️ Pause</button>' +
            '<button onclick="pointer(\'FIN\')" class="driver-btn" style="flex:1;padding:12px;background:#E74C3C;color:white;border:none;border-radius:10px;font-weight:600;cursor:pointer;">⏹️ Fin</button>' +
        '</div>' +
        
        // KM DÉPART
        '<div id="kmDepartDiv" style="background:#FEF3C7;padding:8px 16px;font-size:12px;text-align:center;display:none;"></div>' +
        
        // STATS AUJOURD'HUI
        '<div style="padding:12px;">' +
            '<div class="card" style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
                '<h3 style="font-size:13px;margin-bottom:10px;">📅 Aujourd\'hui</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center;">' +
                    '<div><div style="font-size:18px;font-weight:800;" id="statCourses">0</div><div style="font-size:10px;color:#6C757D;">Courses</div></div>' +
                    '<div><div style="font-size:18px;font-weight:800;color:#27AE60;" id="statCA">0 Ar</div><div style="font-size:10px;color:#6C757D;">CA</div></div>' +
                    '<div><div style="font-size:18px;font-weight:800;color:#E74C3C;" id="statCommission">0 Ar</div><div style="font-size:10px;color:#6C757D;">Commission</div></div>' +
                    '<div><div style="font-size:18px;font-weight:800;color:#1A5276;" id="statGain">0 Ar</div><div style="font-size:10px;color:#6C757D;">Gain net</div></div>' +
                '</div>' +
            '</div>' +
            
            // NOUVELLE COURSE
            '<div class="card" style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
                '<h3 style="font-size:13px;margin-bottom:10px;">➕ Nouvelle course</h3>' +
                '<select id="typeCourse" onchange="updateCourseForm()" style="width:100%;padding:10px;border:1px solid #E9ECEF;border-radius:8px;margin-bottom:8px;font-family:Inter,sans-serif;">' +
                    '<option value="NORMALE">🏍️ Course (km)</option>' +
                    '<option value="ADY_VAROTRA">🛺 Ady Varotra</option>' +
                    '<option value="LOCATION_JOURNALIERE">📅 Location journée</option>' +
                    '<option value="FORFAIT">💵 Forfait</option>' +
                '</select>' +
                '<div id="courseForm"></div>' +
                '<button onclick="enregistrerCourse()" style="width:100%;padding:12px;background:#1A5276;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;margin-top:6px;">✅ Enregistrer</button>' +
            '</div>' +
            
            // DÉPENSES RAPIDES
            '<div class="card" style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
                '<h3 style="font-size:13px;margin-bottom:8px;">💸 Dépenses rapides</h3>' +
                '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                    '<button onclick="addDepense(\'Carburant\')" style="padding:8px 12px;background:#FEE2E2;border:none;border-radius:20px;color:#991B1B;font-size:11px;cursor:pointer;">⛽ Carburant</button>' +
                    '<button onclick="addDepense(\'Pneu\')" style="padding:8px 12px;background:#FEE2E2;border:none;border-radius:20px;color:#991B1B;font-size:11px;cursor:pointer;">🛞 Pneu</button>' +
                    '<button onclick="addDepense(\'Réparation\')" style="padding:8px 12px;background:#FEE2E2;border:none;border-radius:20px;color:#991B1B;font-size:11px;cursor:pointer;">🔨 Réparation</button>' +
                '</div>' +
            '</div>' +
            
            // SEMAINE
            '<div class="card" style="background:white;border-radius:12px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">' +
                '<h3 style="font-size:13px;margin-bottom:10px;">📆 Cette semaine</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center;">' +
                    '<div><div style="font-size:16px;font-weight:800;" id="statSemCourses">0</div><div style="font-size:10px;color:#6C757D;">Courses</div></div>' +
                    '<div><div style="font-size:16px;font-weight:800;" id="statSemCA">0 Ar</div><div style="font-size:10px;color:#6C757D;">CA</div></div>' +
                    '<div><div style="font-size:16px;font-weight:800;" id="statSemCommission">0 Ar</div><div style="font-size:10px;color:#6C757D;">Comm.</div></div>' +
                    '<div><div style="font-size:16px;font-weight:800;" id="statSemGain">0 Ar</div><div style="font-size:10px;color:#6C757D;">Gain</div></div>' +
                '</div>' +
            '</div>' +
        '</div>';
    
    updateTime();
    setInterval(updateTime, 30000);
    updateCourseForm();
    loadDriverStats();
    setInterval(loadDriverStats, 30000);
}

var currentStatus = 'HORS_SERVICE';
var kmDepart = localStorage.getItem('kmDepart') || '';

function updateTime() {
    var now = new Date();
    var timeEl = document.getElementById('currentTime');
    var dateEl = document.getElementById('currentDate');
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (dateEl) dateEl.textContent = now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function updateCourseForm() {
    var type = document.getElementById('typeCourse').value;
    var form = document.getElementById('courseForm');
    if (type === 'NORMALE') {
        form.innerHTML = '<div style="display:flex;gap:6px;">' +
            '<input type="number" id="kmDepart" placeholder="Km départ" step="0.1" style="flex:1;padding:10px;border:1px solid #E9ECEF;border-radius:8px;">' +
            '<input type="number" id="kmArrivee" placeholder="Km arrivée" step="0.1" style="flex:1;padding:10px;border:1px solid #E9ECEF;border-radius:8px;">' +
            '</div><div id="distanceCalc" style="text-align:center;font-size:12px;margin-top:4px;color:#6C757D;"></div>';
    } else if (type === 'ADY_VAROTRA' || type === 'FORFAIT') {
        form.innerHTML = '<input type="number" id="montant" placeholder="Montant (Ar)" style="width:100%;padding:10px;border:1px solid #E9ECEF;border-radius:8px;">';
    } else if (type === 'LOCATION_JOURNALIERE') {
        form.innerHTML = '<div style="text-align:center;padding:10px;background:#F1F5F9;border-radius:8px;font-size:18px;font-weight:700;color:#27AE60;">15 000 Ar</div>';
    }
    
    // Calcul distance en temps réel
    if (type === 'NORMALE') {
        document.getElementById('kmDepart').addEventListener('input', calcDistance);
        document.getElementById('kmArrivee').addEventListener('input', calcDistance);
    }
}

function calcDistance() {
    var d = parseFloat(document.getElementById('kmDepart').value) || 0;
    var a = parseFloat(document.getElementById('kmArrivee').value) || 0;
    var dist = a - d;
    var calcEl = document.getElementById('distanceCalc');
    if (calcEl && dist > 0) {
        var prix = 2000 + dist * 500;
        calcEl.innerHTML = '📏 ' + dist.toFixed(1) + ' km · 💰 ~' + prix.toLocaleString() + ' Ar';
    }
}

async function loadDriverStats() {
    try {
        var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
        var courses = await apiGet('/courses');
        var myCourses = courses.filter(function(c) { return c.driverId === user.driverId; });
        
        var today = new Date().toISOString().split('T')[0];
        var todayCourses = myCourses.filter(function(c) { return c.date && c.date.startsWith(today); });
        var weekCourses = myCourses.filter(function(c) {
            var d = new Date(c.date);
            var now = new Date();
            var weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            return d >= weekAgo;
        });
        
        var caToday = todayCourses.reduce(function(s, c) { return s + (c.price || 0); }, 0);
        var commToday = todayCourses.reduce(function(s, c) { return s + (c.commission || 0); }, 0);
        var caWeek = weekCourses.reduce(function(s, c) { return s + (c.price || 0); }, 0);
        var commWeek = weekCourses.reduce(function(s, c) { return s + (c.commission || 0); }, 0);
        
        document.getElementById('statCourses').textContent = todayCourses.length;
        document.getElementById('statCA').textContent = caToday.toLocaleString() + ' Ar';
        document.getElementById('statCommission').textContent = commToday.toLocaleString() + ' Ar';
        document.getElementById('statGain').textContent = (caToday - commToday).toLocaleString() + ' Ar';
        
        document.getElementById('statSemCourses').textContent = weekCourses.length;
        document.getElementById('statSemCA').textContent = caWeek.toLocaleString() + ' Ar';
        document.getElementById('statSemCommission').textContent = commWeek.toLocaleString() + ' Ar';
        document.getElementById('statSemGain').textContent = (caWeek - commWeek).toLocaleString() + ' Ar';
        
        // Statut
        updateStatusBar();
    } catch(e) { console.error(e); }
}

function updateStatusBar() {
    var bar = document.getElementById('statusBar');
    var colors = { EN_SERVICE: '#27AE60', EN_PAUSE: '#F39C12', HORS_SERVICE: '#6C757D' };
    var labels = { EN_SERVICE: '🟢 En service', EN_PAUSE: '🟠 En pause', HORS_SERVICE: '⚫ Hors service' };
    bar.innerHTML = '<span>' + (labels[currentStatus] || labels.HORS_SERVICE) + '</span>' +
        '<span style="font-size:10px;">' + (kmDepart ? '🏍️ Km départ: ' + kmDepart : '') + '</span>';
    bar.style.background = colors[currentStatus] || colors.HORS_SERVICE;
}

function pointer(type) {
    if (type === 'ARRIVEE') {
        if (currentStatus === 'EN_SERVICE') return;
        var km = prompt('🏍️ KM au compteur au départ:');
        if (!km) return;
        kmDepart = km;
        localStorage.setItem('kmDepart', km);
        currentStatus = 'EN_SERVICE';
        updateStatusBar();
        document.getElementById('kmDepartDiv').style.display = 'block';
        document.getElementById('kmDepartDiv').innerHTML = '🏍️ KM départ: <strong>' + kmDepart + '</strong>';
    } else if (type === 'PAUSE') {
        currentStatus = currentStatus === 'EN_PAUSE' ? 'EN_SERVICE' : 'EN_PAUSE';
        updateStatusBar();
    } else if (type === 'FIN') {
        if (!confirm('Terminer le service ?')) return;
        currentStatus = 'HORS_SERVICE';
        kmDepart = '';
        localStorage.removeItem('kmDepart');
        updateStatusBar();
        document.getElementById('kmDepartDiv').style.display = 'none';
    }
}

async function enregistrerCourse() {
    if (currentStatus !== 'EN_SERVICE') return alert('Vous devez être EN SERVICE');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var type = document.getElementById('typeCourse').value;
    var data = { driverId: user.driverId, type: type };
    
    if (type === 'NORMALE') {
        var d = parseFloat(document.getElementById('kmDepart').value) || 0;
        var a = parseFloat(document.getElementById('kmArrivee').value) || 0;
        if (a <= d) return alert('Km arrivée > Km départ');
        data.distanceKm = a - d;
        data.price = 2000 + data.distanceKm * 500;
    } else if (type === 'ADY_VAROTRA' || type === 'FORFAIT') {
        data.price = parseFloat(document.getElementById('montant').value) || 0;
        if (!data.price) return alert('Montant requis');
    } else if (type === 'LOCATION_JOURNALIERE') {
        data.price = 15000;
    }
    
    try {
        await apiPost('/courses', data);
        alert('✅ Course enregistrée !');
        loadDriverStats();
    } catch(e) { alert('❌ Erreur'); }
}

function addDepense(type) {
    var montant = prompt(type + ' (Ar):');
    if (!montant || parseFloat(montant) <= 0) return;
    alert('✅ ' + type + ' déclaré: ' + montant + ' Ar (simulation)');
}
