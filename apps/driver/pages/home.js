// ========================================
// DRIVER - DASHBOARD COMPLET
// ========================================

function init_home() {
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var main = document.getElementById('mainContent');
    currentStatus = localStorage.getItem('driverStatus') || 'HORS_SERVICE';
    
    main.innerHTML = 
        // HEADER
        '<div style="background:#1E293B;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;border-bottom:1px solid #DAA520;">' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
                '<img src="https://dago-mobility.pages.dev/assets/logo/b-trans.png" style="width:32px;height:32px;object-fit:contain;border-radius:8px;">' +
                '<div>' +
                    '<div style="font-size:14px;font-weight:700;color:#DAA520;">' + (user.name || 'Chauffeur') + '</div>' +
                    '<div style="font-size:10px;color:#94A3B8;display:flex;gap:4px;">' +
                        '<span id="statusBadge" style="padding:1px 6px;border-radius:8px;font-size:9px;"></span>' +
                        '<span>' + (user.driverCode || '') + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div style="display:flex;gap:4px;">' +
                '<button onclick="logout()" style="background:rgba(239,68,68,0.15);border:none;width:28px;height:28px;border-radius:50%;color:#F87171;cursor:pointer;font-size:14px;">⏻</button>' +
                '<span id="statusDot" style="font-size:10px;"></span><span id="onlineStatus" style="font-size:10px;color:#94A3B8;"></span>' +
            '</div>' +
        '</div>' +
        
        // STATS DU JOUR
        '<div style="padding:12px;max-width:500px;margin:0 auto;">' +
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:8px;">' +
                '<h3 style="font-size:13px;color:#DAA520;margin-bottom:10px;">📅 Aujourd\'hui</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;">' +
                    '<div><div style="font-size:18px;font-weight:800;color:#fff;" id="statCourses">0</div><div style="font-size:9px;color:#94A3B8;">Courses</div></div>' +
                    '<div><div style="font-size:18px;font-weight:800;color:#22C55E;" id="statCA">0 Ar</div><div style="font-size:9px;color:#94A3B8;">CA</div></div>' +
                    '<div><div style="font-size:18px;font-weight:800;color:#EF4444;" id="statCommission">0 Ar</div><div style="font-size:9px;color:#94A3B8;">Commission</div></div>' +
                    '<div><div style="font-size:18px;font-weight:800;color:#3B82F6;" id="statGain">0 Ar</div><div style="font-size:9px;color:#94A3B8;">Gain net</div></div>' +
                '</div>' +
            '</div>' +
            
            // BOUTONS SERVICE
            '<div style="display:flex;gap:6px;margin-bottom:8px;">' +
                '<button onclick="pointer(\'ARRIVEE\')" class="driver-btn" style="flex:1;padding:12px;background:#22C55E;color:white;border:none;border-radius:10px;font-weight:600;font-size:12px;cursor:pointer;">▶️ Début</button>' +
                '<button onclick="pointer(\'PAUSE\')" class="driver-btn" style="flex:1;padding:12px;background:#EAB308;color:#1A1A2E;border:none;border-radius:10px;font-weight:600;font-size:12px;cursor:pointer;">⏸️ Pause</button>' +
                '<button onclick="pointer(\'FIN\')" class="driver-btn" style="flex:1;padding:12px;background:#EF4444;color:white;border:none;border-radius:10px;font-weight:600;font-size:12px;cursor:pointer;">⏹️ Fin</button>' +
            '</div>' +
            
            // KM DÉPART
            '<div id="kmDepartDiv" style="background:rgba(218,165,32,0.1);border:1px solid #DAA520;border-radius:8px;padding:6px 10px;font-size:11px;text-align:center;color:#DAA520;margin-bottom:8px;display:none;"></div>' +
            
            // NOUVELLE COURSE
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:8px;">' +
                '<h3 style="font-size:13px;color:#DAA520;margin-bottom:8px;">➕ Nouvelle course</h3>' +
                '<select id="typeCourse" onchange="updateCourseForm()" style="width:100%;padding:10px;background:#0F172A;border:1px solid #334155;border-radius:8px;color:#fff;margin-bottom:6px;font-family:Inter,sans-serif;font-size:12px;">' +
                    '<option value="NORMALE">🏍️ Course (km)</option>' +
                    '<option value="ADY_VAROTRA">🛺 Ady Varotra</option>' +
                    '<option value="LOCATION_JOURNALIERE">📅 Location journée</option>' +
                    '<option value="FORFAIT">💵 Forfait</option>' +
                '</select>' +
                '<div id="courseForm"></div>' +
                '<button onclick="enregistrerCourse()" style="width:100%;padding:12px;background:#DAA520;color:#1A1A2E;border:none;border-radius:8px;font-weight:700;cursor:pointer;margin-top:6px;font-size:13px;">✅ Enregistrer</button>' +
            '</div>' +
            
            // DÉPENSES
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:8px;">' +
                '<h3 style="font-size:13px;color:#DAA520;margin-bottom:6px;">💸 Dépenses rapides</h3>' +
                '<div style="display:flex;gap:4px;flex-wrap:wrap;">' +
                    '<button onclick="addDepense(\'Carburant\')" style="padding:6px 10px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:20px;color:#F87171;font-size:10px;cursor:pointer;">⛽ Carburant</button>' +
                    '<button onclick="addDepense(\'Pneu\')" style="padding:6px 10px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:20px;color:#F87171;font-size:10px;cursor:pointer;">🛞 Pneu</button>' +
                    '<button onclick="addDepense(\'Réparation\')" style="padding:6px 10px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:20px;color:#F87171;font-size:10px;cursor:pointer;">🔨 Réparation</button>' +
                '</div>' +
            '</div>' +
            
            // SEMAINE
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:60px;">' +
                '<h3 style="font-size:13px;color:#DAA520;margin-bottom:10px;">📆 Cette semaine</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;">' +
                    '<div><div style="font-size:16px;font-weight:800;color:#fff;" id="statSemCourses">0</div><div style="font-size:9px;color:#94A3B8;">Courses</div></div>' +
                    '<div><div style="font-size:16px;font-weight:800;" id="statSemCA">0 Ar</div><div style="font-size:9px;color:#94A3B8;">CA</div></div>' +
                    '<div><div style="font-size:16px;font-weight:800;" id="statSemCommission">0 Ar</div><div style="font-size:9px;color:#94A3B8;">Comm.</div></div>' +
                    '<div><div style="font-size:16px;font-weight:800;" id="statSemGain">0 Ar</div><div style="font-size:9px;color:#94A3B8;">Gain</div></div>' +
                '</div>' +
            '</div>' +
        '</div>';
    
    updateTime();
    setInterval(updateTime, 30000);
    updateCourseForm();
    loadDriverStats();
    setInterval(loadDriverStats, 30000);
    updateStatusBar();
}

var currentStatus = 'HORS_SERVICE';
var kmDepart = localStorage.getItem('kmDepart') || '';

function updateTime() {
    var now = new Date();
    var onlineEl = document.getElementById("onlineStatus");
    if (onlineEl) onlineEl.textContent = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function updateStatusBar() {
    var badge = document.getElementById("statusBadge");
    var dot = document.getElementById("statusDot");
    var kmDiv = document.getElementById("kmDepartDiv");
    var statusInfo = {
        EN_SERVICE: { icon: "🟢", color: "#22C55E", bg: "rgba(34,197,94,0.2)", label: "En service" },
        EN_PAUSE: { icon: "🟡", color: "#EAB308", bg: "rgba(234,179,8,0.2)", label: "En pause" },
        HORS_SERVICE: { icon: "🔴", color: "#EF4444", bg: "rgba(239,68,68,0.2)", label: "Hors service" }
    };
    var s = statusInfo[currentStatus] || statusInfo.HORS_SERVICE;
    if (badge) { badge.textContent = s.label; badge.style.background = s.bg; badge.style.color = s.color; }
    if (dot) { dot.textContent = s.icon; dot.title = s.label; }
    if (kmDiv) {
        if (currentStatus === "EN_SERVICE" && kmDepart) {
            kmDiv.style.display = "block";
            kmDiv.innerHTML = "🏍️ KM départ: <strong>" + kmDepart + "</strong>";
        } else { kmDiv.style.display = "none"; }
    }
}

function updateCourseForm() {
    var type = document.getElementById('typeCourse').value;
    var form = document.getElementById('courseForm');
    if (type === 'NORMALE') {
        form.innerHTML = '<div style="display:flex;gap:4px;">' +
            '<input type="number" id="kmDepart" placeholder="Km départ" step="0.1" style="flex:1;padding:10px;background:#0F172A;border:1px solid #334155;border-radius:8px;color:#fff;font-size:12px;">' +
            '<input type="number" id="kmArrivee" placeholder="Km arrivée" step="0.1" style="flex:1;padding:10px;background:#0F172A;border:1px solid #334155;border-radius:8px;color:#fff;font-size:12px;">' +
            '</div><div id="distanceCalc" style="text-align:center;font-size:11px;margin-top:4px;color:#94A3B8;"></div>';
        document.getElementById('kmDepart').addEventListener('input', calcDistance);
        document.getElementById('kmArrivee').addEventListener('input', calcDistance);
    } else if (type === 'ADY_VAROTRA' || type === 'FORFAIT') {
        form.innerHTML = '<input type="number" id="montant" placeholder="Montant (Ar)" style="width:100%;padding:10px;background:#0F172A;border:1px solid #334155;border-radius:8px;color:#fff;font-size:12px;">';
    } else if (type === 'LOCATION_JOURNALIERE') {
        form.innerHTML = '<div style="text-align:center;padding:10px;background:rgba(34,197,94,0.1);border-radius:8px;font-size:18px;font-weight:700;color:#22C55E;">15 000 Ar</div>';
    }
}

function calcDistance() {
    var d = parseFloat(document.getElementById('kmDepart').value) || 0;
    var a = parseFloat(document.getElementById('kmArrivee').value) || 0;
    var dist = a - d;
    var calcEl = document.getElementById('distanceCalc');
    if (calcEl && dist > 0) {
        calcEl.innerHTML = '📏 ' + dist.toFixed(1) + ' km · 💰 ~' + (2000 + dist * 500).toLocaleString() + ' Ar';
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
            var weekAgo = new Date(Date.now() - 7*24*60*60*1000);
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
    } catch(e) {}
}

function pointer(type) {
    if (type === 'ARRIVEE') {
        if (currentStatus === 'EN_SERVICE') return;
        var km = prompt('🏍️ KM au compteur au départ:');
        if (!km) return;
        kmDepart = km;
        localStorage.setItem('kmDepart', km);
        currentStatus = 'EN_SERVICE';
        localStorage.setItem('driverStatus', 'EN_SERVICE');
    } else if (type === 'PAUSE') {
        currentStatus = currentStatus === 'EN_PAUSE' ? 'EN_SERVICE' : 'EN_PAUSE';
        localStorage.setItem('driverStatus', currentStatus);
    } else if (type === 'FIN') {
        if (!confirm('Terminer le service ? Distance parcourue depuis ' + kmDepart + ' km ?')) return;
        currentStatus = 'HORS_SERVICE';
        kmDepart = '';
        localStorage.removeItem('kmDepart');
        localStorage.removeItem('driverStatus');
    }
    updateStatusBar();
}


function addDepense(type) {
    var montant = prompt(type + ' (Ar):');
    if (!montant || parseFloat(montant) <= 0) return;
    alert('✅ ' + type + ' déclaré: ' + montant + ' Ar');
}


async function enregistrerCourse() {
    if (currentStatus !== 'EN_SERVICE') return alert('Vous devez être EN SERVICE');
    try {
        var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
        var drivers = await apiGet('/drivers');
        if (!Array.isArray(drivers)) throw new Error('Impossible de récupérer les chauffeurs');
        var driver = drivers.find(function(item) { return item.id === user.driverId || item.userId === user.id || item.driverCode === user.driverCode; });
        if (!driver) throw new Error('Fiche chauffeur introuvable');
        if (!driver.vehicleId) throw new Error('Aucun véhicule assigné. Contactez votre gestionnaire.');
        
        var type = document.getElementById('typeCourse').value;
        var data = { driverId: driver.id, vehicleId: driver.vehicleId, distanceKm: 0, price: 0, commission: 0 };
        
        if (type === 'NORMALE') {
            var d = parseFloat(document.getElementById('kmDepart').value) || 0;
            var a = parseFloat(document.getElementById('kmArrivee').value) || 0;
            if (a <= d) return alert('Km arrivée > Km départ');
            data.distanceKm = Number((a - d).toFixed(1));
            data.price = 2000 + data.distanceKm * 500;
        } else if (type === 'ADY_VAROTRA' || type === 'FORFAIT') {
            data.price = parseFloat(document.getElementById('montant').value) || 0;
            if (data.price <= 0) return alert('Montant requis');
        } else if (type === 'LOCATION_JOURNALIERE') {
            data.price = 15000;
        }
        data.commission = Math.round(data.price * 0.10);
        
        console.log('Création course:', data);
        var course = await apiPost('/courses', data);
        console.log('Course créée:', course);
        alert('✅ Course enregistrée !');
        
        var kmD = document.getElementById('kmDepart');
        var kmA = document.getElementById('kmArrivee');
        var montant = document.getElementById('montant');
        if (kmD) kmD.value = '';
        if (kmA) kmA.value = '';
        if (montant) montant.value = '';
        loadDriverStats();
    } catch (error) {
        console.error('Échec création course:', error);
        alert('❌ ' + error.message);
    }
}
