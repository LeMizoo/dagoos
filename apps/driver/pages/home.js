// ========================================
// DRIVER - DASHBOARD HOME ENRICHI
// ========================================
var currentDriver = null;
var currentVehicle = null;
var currentOrg = null;
var expenses = [];
var statutPresence = 'absent';
var estBloque = false;
var isOnline = navigator.onLine;
var refreshInterval = null;

async function init_home() {
    var main = document.getElementById('mainContent');
    var user = JSON.parse(localStorage.getItem("dagoos_user") || "{}");
    var token = localStorage.getItem('dagoos_token');
    var driverId = user.driverId;

    // Charger les tarifs/types de l'organisation
    var courseTypes = [
      { value: 'course', label: '🚖 Course normale' },
      { value: 'ady_varotra', label: '🛺 Ady Varotra' },
      { value: 'location', label: '📅 Location journalière' },
    ];
    try {
      if (currentDriver && currentDriver.organizationId) {
        var tarifsRes = await apiGet('/tarifs/' + currentDriver.organizationId);
        if (tarifsRes && tarifsRes.vehiculeTarifs) {
          var vt = typeof tarifsRes.vehiculeTarifs === 'string' ? JSON.parse(tarifsRes.vehiculeTarifs) : tarifsRes.vehiculeTarifs;
          courseTypes = Object.keys(vt).map(function(k) {
            return { value: k, label: vt[k].label || k };
          });
        }
      }
    } catch(e) { console.log('Types par défaut'); }

    // Charger infos chauffeur
    try {
        var drivers = await apiGet('/drivers');
        if (Array.isArray(drivers)) {
            currentDriver = drivers.find(function(d) { return d.id === driverId; });
            if (currentDriver && currentDriver.vehicleId) {
                var vehicles = await apiGet('/vehicles');
                if (Array.isArray(vehicles)) {
                    currentVehicle = vehicles.find(function(v) { return v.id === currentDriver.vehicleId; });
                }
            }
            if (currentDriver && currentDriver.organizationId) {
                var orgs = await apiGet('/organizations');
                if (Array.isArray(orgs)) {
                    currentOrg = orgs.find(function(o) { return o.id === currentDriver.organizationId; });
                }
            }
        }
    } catch(e) { console.error(e); }

    var plate = currentVehicle ? currentVehicle.plate : '';
    var orgName = currentOrg ? currentOrg.name : (user.organization || 'Flotte');
    var logo = DAGOOS_CONFIG.logoUrl;

    // Déterminer le statut
    var statusLabel = currentDriver && currentDriver.status === 'active' ? 'En service' : 'Absent';
    var statusColor = currentDriver && currentDriver.status === 'active' ? '#22C55E' : '#E74C3C';

    main.innerHTML = 
        // HEADER
        '<div style="background:#1E293B;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;border-bottom:1px solid #DAA520;">' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
                '<img src="' + logo + '" style="width:36px;height:36px;object-fit:contain;border-radius:8px;">' +
                '<div>' +
                    '<div style="font-size:14px;font-weight:700;color:#DAA520;">' + (user.name || 'Chauffeur') + '</div>' +
                    '<div style="font-size:10px;color:#94A3B8;display:flex;gap:6px;align-items:center;flex-wrap:wrap;">' +
                        '<span style="padding:2px 6px;border-radius:20px;font-size:9px;background:' + statusColor + ';color:#fff;">' + statusLabel + '</span>' +
                        (plate ? '<span style="padding:2px 6px;border-radius:20px;font-size:9px;background:#2a2a2a;color:#DAA520;">🏍️ ' + plate + '</span>' : '<span style="padding:2px 6px;border-radius:20px;font-size:9px;background:#E74C3C;color:#fff;">⚠️ Sans moto</span>') +
                        '<span style="color:#94A3B8;">' + (user.driverCode || '') + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div style="display:flex;gap:4px;">' +
                '<button onclick="loadPage(\'profil\')" style="background:rgba(255,255,255,0.1);border:none;width:32px;height:32px;border-radius:50%;color:#DAA520;cursor:pointer;font-size:14px;">👤</button>' +
                '<button onclick="logout()" style="background:rgba(239,68,68,0.15);border:none;width:32px;height:32px;border-radius:50%;color:#F87171;cursor:pointer;font-size:16px;">⏻</button>' +
            '</div>' +
        '</div>' +

        // CONTENU
        '<div style="padding:12px;max-width:500px;margin:0 auto;padding-bottom:80px;">' +
            
            // ALERTE COMPTE BLOQUÉ
            (estBloque ? '<div style="background:#E74C3C;color:#fff;padding:10px;border-radius:10px;text-align:center;margin-bottom:10px;animation:pulse 1.5s infinite;">🔒 Compte bloqué - Régularisez vos versements</div>' : '') +

            // BOUTONS STATUT
            '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
                '<button onclick="changeStatus(\'present\')" style="flex:1;padding:12px 6px;background:#22C55E;color:#fff;border:none;border-radius:14px;cursor:pointer;font-weight:700;font-size:12px;" ' + (estBloque ? 'disabled' : '') + '>▶ Début</button>' +
                '<button onclick="changeStatus(\'pause\')" style="flex:1;padding:12px 6px;background:#F59E0B;color:#000;border:none;border-radius:14px;cursor:pointer;font-weight:700;font-size:12px;" ' + (estBloque || statutPresence !== 'present' ? 'disabled' : '') + '>⏸ Pause</button>' +
                '<button onclick="changeStatus(\'termine\')" style="flex:1;padding:12px 6px;background:#E74C3C;color:#fff;border:none;border-radius:14px;cursor:pointer;font-weight:700;font-size:12px;" ' + (estBloque || statutPresence === 'absent' || statutPresence === 'termine' ? 'disabled' : '') + '>⏹ Fin</button>' +
            '</div>' +

            // STATS DU JOUR
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:10px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;font-size:13px;">📅 Aujourd\'hui</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;">' +
                    '<div style="background:#252525;border-radius:10px;padding:8px;"><div style="font-size:18px;font-weight:800;color:#fff;" id="statCoursesJour">0</div><div style="font-size:9px;color:#888;">Courses</div></div>' +
                    '<div style="background:#252525;border-radius:10px;padding:8px;"><div style="font-size:18px;font-weight:800;color:#22C55E;" id="statCAJour">0</div><div style="font-size:9px;color:#888;">CA (Ar)</div></div>' +
                    '<div style="background:#252525;border-radius:10px;padding:8px;"><div style="font-size:18px;font-weight:800;color:#3B82F6;" id="statCommissionJour">0</div><div style="font-size:9px;color:#888;">Com. (Ar)</div></div>' +
                    '<div style="background:#252525;border-radius:10px;padding:8px;"><div style="font-size:18px;font-weight:800;color:#8B5CF6;" id="statNetJour">0</div><div style="font-size:9px;color:#888;">Net (Ar)</div></div>' +
                '</div>' +
            '</div>' +

            // STATS SEMAINE
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:10px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;font-size:13px;">📆 Cette semaine</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;text-align:center;">' +
                    '<div style="background:#252525;border-radius:10px;padding:8px;"><div style="font-size:16px;font-weight:800;color:#fff;" id="statCoursesSem">0</div><div style="font-size:9px;color:#888;">Courses</div></div>' +
                    '<div style="background:#252525;border-radius:10px;padding:8px;"><div style="font-size:16px;font-weight:800;color:#22C55E;" id="statCASem">0</div><div style="font-size:9px;color:#888;">CA (Ar)</div></div>' +
                    '<div style="background:#252525;border-radius:10px;padding:8px;"><div style="font-size:16px;font-weight:800;color:#3B82F6;" id="statCommissionSem">0</div><div style="font-size:9px;color:#888;">Com. (Ar)</div></div>' +
                    '<div style="background:#252525;border-radius:10px;padding:8px;"><div style="font-size:16px;font-weight:800;color:#8B5CF6;" id="statNetSem">0</div><div style="font-size:9px;color:#888;">Net (Ar)</div></div>' +
                '</div>' +
            '</div>' +

            // NOUVELLE COURSE RAPIDE
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:10px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;font-size:13px;">➕ Nouvelle course</h3>' +
                '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
                    '<select id="typeCourse" onchange="updateCourseForm()" style="flex:1;padding:8px;background:#252525;border:1px solid #333;border-radius:8px;color:#fff;font-size:12px;">' +
                        '<option value="course">🚖 Course normale</option>' +
                        '<option value="ady_varotra">🛺 Ady Varotra</option>' +
                        '<option value="location">📅 Location journalière</option>' +
                    '</select>' +
                '</div>' +
                '<div id="courseForm">' +
                    '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
                        '<input type="number" id="kmDepart" placeholder="Km départ" step="0.1" oninput="calcCourse()" style="flex:1;padding:8px;background:#252525;border:1px solid #333;border-radius:8px;color:#fff;font-size:12px;">' +
                        '<input type="number" id="kmArrivee" placeholder="Km arrivée" step="0.1" oninput="calcCourse()" style="flex:1;padding:8px;background:#252525;border:1px solid #333;border-radius:8px;color:#fff;font-size:12px;">' +
                    '</div>' +
                    '<div style="text-align:center;color:#94A3B8;font-size:11px;margin-bottom:8px;">📏 Distance : <span id="distanceCalc">0</span> km | 💰 Prix : <span id="prixCalc" style="color:#DAA520;font-weight:700;">0 Ar</span></div>' +
                    '<div style="font-size:10px;color:#888;text-align:center;margin-bottom:8px;">💰 Vous gardez 20% · 📤 Vous versez 80%</div>' +
                '</div>' +
                '<button onclick="enregistrerCourse()" ' + (estBloque || statutPresence !== 'present' || !currentVehicle ? 'disabled' : '') + ' style="width:100%;padding:12px;background:#F1C40F;color:#1A1A2E;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-size:14px;">✅ Enregistrer la course</button>' +
                '<div id="courseMsg" style="margin-top:8px;text-align:center;font-size:11px;"></div>' +
            '</div>' +

            // DÉPENSES
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:10px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;font-size:13px;">💰 Dépenses du jour</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px;">' +
                    '<button onclick="addExpense(\'carburant\')" style="padding:10px 4px;background:#1A1A2E;color:#DAA520;border:1px solid #DAA520;border-radius:8px;cursor:pointer;font-size:10px;">⛽ Carburant</button>' +
                    '<button onclick="addExpense(\'entretien\')" style="padding:10px 4px;background:#1A1A2E;color:#DAA520;border:1px solid #DAA520;border-radius:8px;cursor:pointer;font-size:10px;">🔧 Entretien</button>' +
                    '<button onclick="addExpense(\'pneu\')" style="padding:10px 4px;background:#1A1A2E;color:#DAA520;border:1px solid #DAA520;border-radius:8px;cursor:pointer;font-size:10px;">🛞 Pneus</button>' +
                    '<button onclick="addExpense(\'autre\')" style="padding:10px 4px;background:#1A1A2E;color:#DAA520;border:1px solid #DAA520;border-radius:8px;cursor:pointer;font-size:10px;">📝 Autre</button>' +
                '</div>' +
                '<div id="expensesList" style="max-height:120px;overflow-y:auto;font-size:11px;"></div>' +
                '<div id="expensesTotal" style="margin-top:8px;text-align:right;font-weight:700;color:#EF4444;font-size:12px;"></div>' +
            '</div>' +

            // ASSIGNATION
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:10px;">' +
                '<h3 style="color:#DAA520;margin-bottom:8px;font-size:13px;">🔗 Assignation</h3>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">' +
                    '<div><span style="color:#94A3B8;">Véhicule</span><br><span style="font-weight:600;color:#fff;" id="assignedVehicle">' + (plate || 'Aucun') + '</span></div>' +
                    '<div><span style="color:#94A3B8;">Organisation</span><br><span style="font-weight:600;color:#fff;">' + orgName + '</span></div>' +
                '</div>' +
            '</div>' +
        '</div>';

    loadStats(driverId);
    loadExpenses();
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(function() { loadStats(driverId); }, 30000);
}

// ========== STATS ==========
async function loadStats(driverId) {
    try {
        var today = new Date().toISOString().split('T')[0];
        var courses = await apiGet('/courses?driverId=' + driverId);
        var arr = Array.isArray(courses) ? courses : [];
        var todayCourses = arr.filter(function(c) { return c.date && c.date.startsWith(today); });
        
        var caJour = todayCourses.reduce(function(s, c) { return s + (c.price || 0); }, 0);
        var comJour = Math.round(caJour * 0.20);
        var netJour = Math.round(caJour * 0.80);
        var caSem = arr.reduce(function(s, c) { return s + (c.price || 0); }, 0);
        var comSem = Math.round(caSem * 0.20);
        var netSem = Math.round(caSem * 0.80);

        setText('statCoursesJour', todayCourses.length);
        setText('statCAJour', caJour.toLocaleString());
        setText('statCommissionJour', comJour.toLocaleString());
        setText('statNetJour', netJour.toLocaleString());
        setText('statCoursesSem', arr.length);
        setText('statCASem', caSem.toLocaleString());
        setText('statCommissionSem', comSem.toLocaleString());
        setText('statNetSem', netSem.toLocaleString());
    } catch(e) { console.error('Stats:', e); }
}

function setText(id, val) { var el = document.getElementById(id); if (el) el.textContent = val; }

// ========== COURSE ==========
function calcCourse() {
    var d = parseFloat(document.getElementById('kmDepart')?.value) || 0;
    var a = parseFloat(document.getElementById('kmArrivee')?.value) || 0;
    if (a > d && d > 0) {
        var dist = a - d;
        var prix = Math.round(2000 + (dist * 500));
        setText('distanceCalc', dist.toFixed(1));
        setText('prixCalc', prix.toLocaleString() + ' Ar');
    }
}

function updateCourseForm() {
    var type = document.getElementById('typeCourse')?.value;
    var form = document.getElementById('courseForm');
    if (type === 'location') {
        if (form) form.innerHTML = '<div style="text-align:center;color:#DAA520;padding:10px;">📅 Tarif location : 13 500 Ar/jour</div>';
    } else if (type === 'ady_varotra') {
        if (form) form.innerHTML = '<input type="number" id="montantAdy" placeholder="Montant négocié (Ar)" style="width:100%;padding:8px;background:#252525;border:1px solid #333;border-radius:8px;color:#fff;font-size:12px;margin-bottom:8px;"><div style="font-size:10px;color:#888;text-align:center;">💰 Vous gardez 20% · 📤 Vous versez 80%</div>';
    } else {
        if (form) form.innerHTML = '<div style="display:flex;gap:8px;margin-bottom:8px;"><input type="number" id="kmDepart" placeholder="Km départ" step="0.1" oninput="calcCourse()" style="flex:1;padding:8px;background:#252525;border:1px solid #333;border-radius:8px;color:#fff;font-size:12px;"><input type="number" id="kmArrivee" placeholder="Km arrivée" step="0.1" oninput="calcCourse()" style="flex:1;padding:8px;background:#252525;border:1px solid #333;border-radius:8px;color:#fff;font-size:12px;"></div><div style="text-align:center;color:#94A3B8;font-size:11px;margin-bottom:8px;">📏 Distance : <span id="distanceCalc">0</span> km | 💰 Prix : <span id="prixCalc" style="color:#DAA520;font-weight:700;">0 Ar</span></div><div style="font-size:10px;color:#888;text-align:center;margin-bottom:8px;">💰 Vous gardez 20% · 📤 Vous versez 80%</div>';
    }
}

async function enregistrerCourse() {
    var type = document.getElementById('typeCourse')?.value || 'course';
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var msg = document.getElementById('courseMsg');
    var token = localStorage.getItem('dagoos_token');
    var distance = 0, montant = 0;

    if (type === 'course') {
        var d = parseFloat(document.getElementById('kmDepart')?.value) || 0;
        var a = parseFloat(document.getElementById('kmArrivee')?.value) || 0;
        if (a <= d || d <= 0) { if (msg) msg.innerHTML = '<span style="color:#F87171;">Km invalides</span>'; return; }
        distance = a - d;
        montant = Math.round(2000 + (distance * 500));
    } else if (type === 'ady_varotra') {
        montant = parseFloat(document.getElementById('montantAdy')?.value) || 0;
        if (montant <= 0) { if (msg) msg.innerHTML = '<span style="color:#F87171;">Montant requis</span>'; return; }
    } else if (type === 'location') {
        montant = 13500;
    }

    if (!confirm('Confirmer la course ?\n' + (type === 'location' ? '📅 Location : ' : distance > 0 ? '📏 ' + distance.toFixed(1) + ' km - ' : '') + '💰 ' + montant.toLocaleString() + ' Ar\n💵 Vous gardez : ' + Math.round(montant * 0.20).toLocaleString() + ' Ar\n📤 Vous versez : ' + Math.round(montant * 0.80).toLocaleString() + ' Ar')) return;

    try {
        var r = await fetch(DAGOOS_CONFIG.apiUrl + '/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
            body: JSON.stringify({ driverId: user.driverId, vehicleId: currentVehicle?.id, type: type, distanceKm: distance, price: montant, commission: Math.round(montant * 0.80) })
        });
        if (r.ok) {
            if (msg) msg.innerHTML = '<span style="color:#22C55E;">✅ Course enregistrée !</span>';
            loadStats(user.driverId);
            // Vider les champs
            var kmD = document.getElementById('kmDepart'); if (kmD) kmD.value = '';
            var kmA = document.getElementById('kmArrivee'); if (kmA) kmA.value = '';
            var mAdy = document.getElementById('montantAdy'); if (mAdy) mAdy.value = '';
            setText('distanceCalc', '0');
            setText('prixCalc', '0 Ar');
        } else {
            var err = await r.json();
            if (msg) msg.innerHTML = '<span style="color:#F87171;">❌ ' + (err.error || 'Erreur') + '</span>';
        }
    } catch(e) {
        if (msg) msg.innerHTML = '<span style="color:#F87171;">❌ Erreur réseau</span>';
    }
}

// ========== STATUT ==========
async function changeStatus(status) {
    var labels = { present: 'En service', pause: 'En pause', termine: 'Terminé' };
    var colors = { present: '#22C55E', pause: '#F59E0B', termine: '#E74C3C' };
    statutPresence = status;
    
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    try {
        await fetch(DAGOOS_CONFIG.apiUrl + '/drivers/' + user.driverId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('dagoos_token') },
            body: JSON.stringify({ status: status === 'active' ? 'active' : status === 'pause' ? 'pause' : 'inactive' })
        });
    } catch(e) { console.error(e); }
    
    // Rafraîchir la page pour mettre à jour les boutons
    init_home();
    if (status === 'termine' && currentDriver) proposerVersement();
}

async function proposerVersement() {
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    try {
        var courses = await apiGet('/courses?driverId=' + user.driverId);
        var arr = Array.isArray(courses) ? courses : [];
        var today = new Date().toISOString().split('T')[0];
        var todayCourses = arr.filter(function(c) { return c.date && c.date.startsWith(today); });
        var caJour = todayCourses.reduce(function(s, c) { return s + (c.price || 0); }, 0);
        var netJour = Math.round(caJour * 0.80);
        
        if (netJour > 0 && confirm('🏁 Service terminé !\n\n📊 Gain net du jour : ' + netJour.toLocaleString() + ' Ar\n\nSouhaitez-vous demander un versement ?')) {
            var montant = prompt('Montant à verser (max ' + netJour.toLocaleString() + ' Ar) :', netJour);
            if (montant && parseInt(montant) > 0) {
                alert('✅ Demande de versement de ' + parseInt(montant).toLocaleString() + ' Ar envoyée.');
            }
        }
    } catch(e) { console.error(e); }
}

// ========== DÉPENSES ==========
function addExpense(type) {
    var amount = prompt('Montant (' + type + ') en Ar :');
    if (!amount || isNaN(amount)) return;
    var desc = prompt('Description :') || type;
    expenses.push({ type: type, amount: parseInt(amount), desc: desc, time: new Date().toLocaleTimeString() });
    try { localStorage.setItem('driver_expenses', JSON.stringify(expenses)); } catch(e) {}
    renderExpenses();
}

function renderExpenses() {
    var list = document.getElementById('expensesList');
    var total = document.getElementById('expensesTotal');
    if (!list) return;
    if (expenses.length === 0) {
        list.innerHTML = '<div style="color:#94A3B8;text-align:center;padding:10px;">Aucune dépense</div>';
        if (total) total.textContent = '';
        return;
    }
    var html = '', sum = 0;
    var recent = expenses.slice(-10).reverse();
    var labels = { carburant: '⛽', entretien: '🔧', pneu: '🛞', autre: '📝' };
    for (var i = 0; i < recent.length; i++) {
        var e = recent[i];
        html += '<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #333;">' +
            '<span style="color:#94A3B8;font-size:11px;">' + (labels[e.type] || '') + ' ' + e.desc + '</span>' +
            '<span style="color:#F87171;font-weight:600;">' + e.amount.toLocaleString() + ' Ar</span></div>';
        sum += e.amount;
    }
    list.innerHTML = html;
    if (total) total.textContent = 'Total : ' + sum.toLocaleString() + ' Ar';
}

function loadExpenses() {
    try {
        var saved = localStorage.getItem('driver_expenses');
        if (saved) { expenses = JSON.parse(saved); renderExpenses(); }
    } catch(e) {}
}

window.init_home = init_home;
window.addExpense = addExpense;
window.changeStatus = changeStatus;
window.enregistrerCourse = enregistrerCourse;
window.calcCourse = calcCourse;
window.updateCourseForm = updateCourseForm;
window.loadStats = loadStats;
