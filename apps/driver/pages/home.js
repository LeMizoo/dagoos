// ========================================
// DRIVER - DASHBOARD COMPLET
// ========================================

var currentDriver = null;
var currentVehicle = null;
var currentOrg = null;

async function init_home() {
    var main = document.getElementById('mainContent');
    var user = JSON.parse(localStorage.getItem("dagoos_user") || "{}");
    var driverId = user.driverId;

    // Charger les infos complètes du chauffeur (avec véhicule et organisation)
    try {
        var drivers = await apiGet('/drivers');
        if (Array.isArray(drivers)) {
            currentDriver = drivers.find(function(d) { return d.id === driverId; });
            if (currentDriver) {
                // Récupérer le véhicule
                if (currentDriver.vehicleId) {
                    var vehicles = await apiGet('/vehicles');
                    if (Array.isArray(vehicles)) {
                        currentVehicle = vehicles.find(function(v) { return v.id === currentDriver.vehicleId; });
                    }
                }
                // Récupérer l'organisation pour le logo
                if (currentDriver.organizationId) {
                    var orgs = await apiGet('/organizations');
                    if (Array.isArray(orgs)) {
                        currentOrg = orgs.find(function(o) { return o.id === currentDriver.organizationId; });
                    }
                }
            }
        }
    } catch(e) { console.error('Erreur chargement infos chauffeur', e); }

    var vehiclePlate = currentVehicle ? currentVehicle.plate : '';
    var orgLogo = (currentOrg && currentOrg.logo) ? currentOrg.logo : DAGOOS_CONFIG.logoUrl;
    var orgName = (currentOrg && currentOrg.name) ? currentOrg.name : (user.organization || 'Flotte');

    // HEADER
    var headerHTML = 
        '<div style="background:#1E293B;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;border-bottom:1px solid #DAA520;">' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
                '<img src="' + orgLogo + '" style="width:32px;height:32px;object-fit:contain;border-radius:8px;" onerror="this.src=\'' + DAGOOS_CONFIG.logoUrl + '\'">' +
                '<div>' +
                    '<div style="font-size:14px;font-weight:700;color:#DAA520;">' + (user.name || 'Chauffeur') + '</div>' +
                    (vehiclePlate ? '<div style="font-size:10px;color:#94A3B8;display:flex;gap:4px;"><span style="padding:1px 6px;border-radius:8px;font-size:9px;">🏍️ ' + vehiclePlate + '</span></div>' : '') +
                    '<div style="font-size:10px;color:#94A3B8;display:flex;gap:4px;">' +
                        '<span id="statusBadge" style="padding:1px 6px;border-radius:8px;font-size:9px;">En service</span>' +
                        '<span>' + (user.driverCode || '') + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div style="display:flex;gap:4px;">' +
                '<button onclick="logout()" style="background:rgba(239,68,68,0.15);border:none;width:28px;height:28px;border-radius:50%;color:#F87171;cursor:pointer;font-size:14px;">⏻</button>' +
                '<span id="statusDot" style="font-size:10px;"></span><span id="onlineStatus" style="font-size:10px;color:#94A3B8;"></span>' +
            '</div>' +
        '</div>';

    // STATS DU JOUR
    var statsHTML = 
        '<div style="padding:12px;max-width:500px;margin:0 auto;">' +
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:10px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;">📅 Aujourd\'hui</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;">' +
                    '<div><div style="font-size:20px;font-weight:800;color:#fff;" id="statCoursesJour">0</div><div style="font-size:10px;color:#94A3B8;">Courses</div></div>' +
                    '<div><div style="font-size:20px;font-weight:800;color:#22C55E;" id="statCAJour">0 Ar</div><div style="font-size:10px;color:#94A3B8;">CA brut</div></div>' +
                    '<div><div style="font-size:20px;font-weight:800;color:#3B82F6;" id="statGainJour">0 Ar</div><div style="font-size:10px;color:#94A3B8;">Gain net</div></div>' +
                '</div>' +
            '</div>' +
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:10px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;">📆 Semaine</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;text-align:center;">' +
                    '<div><div style="font-size:18px;font-weight:800;color:#22C55E;" id="statCASem">0 Ar</div><div style="font-size:10px;color:#94A3B8;">CA brut</div></div>' +
                    '<div><div style="font-size:18px;font-weight:800;color:#3B82F6;" id="statGainSem">0 Ar</div><div style="font-size:10px;color:#94A3B8;">Gain net</div></div>' +
                '</div>' +
            '</div>' +
            '<button id="newCourseBtn" style="width:100%;padding:12px;background:#F1C40F;color:#1A1A2E;border:none;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;margin-bottom:20px;" onclick="enregistrerCourse()">➕ Nouvelle course</button>' +
            
            // Statut
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:20px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;">📊 Statut</h3>' +
                '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                    '<button id="statusStart" style="flex:1;padding:8px;background:#22C55E;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;">▶️ Démarrer</button>' +
                    '<button id="statusPause" style="flex:1;padding:8px;background:#F59E0B;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;">⏸ Pause</button>' +
                    '<button id="statusEnd" style="flex:1;padding:8px;background:#EF4444;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;">⏹ Terminer</button>' +
                '</div>' +
                '<div style="margin-top:8px;text-align:center;color:#94A3B8;font-size:12px;">Statut: <span id="currentStatusDisplay" style="color:#22C55E;">En service</span></div>' +
            '</div>' +
            
            // Dépenses
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:20px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;">💰 Dépenses</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">' +
                    '<button onclick="addExpense(\'carburant\')" style="padding:8px;background:#1A1A2E;color:#DAA520;border:1px solid #DAA520;border-radius:6px;cursor:pointer;font-size:11px;">⛽ Carburant</button>' +
                    '<button onclick="addExpense(\'entretien\')" style="padding:8px;background:#1A1A2E;color:#DAA520;border:1px solid #DAA520;border-radius:6px;cursor:pointer;font-size:11px;">🔧 Entretien</button>' +
                    '<button onclick="addExpense(\'pneu\')" style="padding:8px;background:#1A1A2E;color:#DAA520;border:1px solid #DAA520;border-radius:6px;cursor:pointer;font-size:11px;">🛞 Pneus</button>' +
                    '<button onclick="addExpense(\'autre\')" style="padding:8px;background:#1A1A2E;color:#DAA520;border:1px solid #DAA520;border-radius:6px;cursor:pointer;font-size:11px;">📝 Autre</button>' +
                '</div>' +
                '<div id="expensesList" style="margin-top:10px;max-height:120px;overflow-y:auto;font-size:11px;color:#94A3B8;"></div>' +
            '</div>' +
        '</div>';

    main.innerHTML = headerHTML + statsHTML;

    // Event listeners statut
    document.getElementById('statusStart').addEventListener('click', function() { setStatus('en_service'); });
    document.getElementById('statusPause').addEventListener('click', function() { setStatus('pause'); });
    document.getElementById('statusEnd').addEventListener('click', function() { setStatus('termine'); });

    // Charger les stats
    loadDriverStats();
    setInterval(loadDriverStats, 30000);

    // Mettre à jour l'heure
    updateTime();
    setInterval(updateTime, 1000);
}

function updateTime() {
    var now = new Date();
    var time = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    var el = document.getElementById('onlineStatus');
    if (el) el.textContent = time;
}

async function loadDriverStats() {
    try {
        var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
        var driverId = user.driverId;
        if (!driverId) return;

        var courses = await apiGet('/courses');
        if (!Array.isArray(courses)) return;
        var myCourses = courses.filter(function(c) { return c.driverId === driverId; });

        // Aujourd'hui
        var today = new Date().toISOString().split('T')[0];
        var todayCourses = myCourses.filter(function(c) { return c.date && c.date.startsWith(today); });
        var todayCA = todayCourses.reduce(function(s, c) { return s + (c.price || 0); }, 0);
        var todayCommission = todayCourses.reduce(function(s, c) { return s + (c.commission || 0); }, 0);
        var todayNet = todayCA - todayCommission;

        document.getElementById('statCoursesJour').textContent = todayCourses.length;
        document.getElementById('statCAJour').textContent = todayCA.toLocaleString() + ' Ar';
        document.getElementById('statGainJour').textContent = todayNet.toLocaleString() + ' Ar';

        // Cette semaine (lun-dim)
        var now = new Date();
        var dayOfWeek = now.getDay(); // 0=dim, 1=lun...
        var monday = new Date(now);
        monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setHours(0,0,0,0);
        var weekCourses = myCourses.filter(function(c) {
            if (!c.date) return false;
            var d = new Date(c.date);
            return d >= monday;
        });
        var weekCA = weekCourses.reduce(function(s, c) { return s + (c.price || 0); }, 0);
        var weekCommission = weekCourses.reduce(function(s, c) { return s + (c.commission || 0); }, 0);
        var weekNet = weekCA - weekCommission;

        document.getElementById('statCASem').textContent = weekCA.toLocaleString() + ' Ar';
        document.getElementById('statGainSem').textContent = weekNet.toLocaleString() + ' Ar';

    } catch(e) { console.error('Erreur stats:', e); }
}

async function enregistrerCourse() {
    if (!currentDriver) {
        alert('Chargement du profil en cours...');
        return;
    }
    if (!currentDriver.vehicleId) throw new Error('Aucun véhicule assigné. Contactez votre gestionnaire.');

    // Simulation d'une course (à remplacer par une modale ou formulaire)
    var distance = prompt('Distance (km) :', '5');
    if (!distance) return;
    var price = Math.round(parseFloat(distance) * 500); // 500 Ar/km
    if (isNaN(price)) return alert('Distance invalide');

    try {
        var data = {
            driverId: currentDriver.id,
            vehicleId: currentDriver.vehicleId,
            distanceKm: parseFloat(distance),
            price: price,
            commission: Math.round(price * 0.1),
            date: new Date().toISOString()
        };

        await apiPost('/courses', data);
        alert('✅ Course enregistrée !');
        loadDriverStats();
    } catch(e) {
        alert('❌ Erreur : ' + e.message);
    }
}


// Fonctions statut et dépenses
function setStatus(status) {
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    fetch(DAGOOS_CONFIG.apiUrl + '/drivers/' + user.driverId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('dagoos_token') },
        body: JSON.stringify({ status: status })
    }).then(function(r) { return r.json(); }).then(function(data) {
        document.getElementById('currentStatusDisplay').textContent = status;
        document.getElementById('statusBadge').textContent = status;
    }).catch(function(e) { console.error(e); });
}

function addExpense(type) {
    var amount = prompt('Montant (Ar):');
    if (!amount) return;
    var desc = prompt('Description:');
    if (!desc) return;
    var list = document.getElementById('expensesList');
    var div = document.createElement('div');
    div.style.cssText = 'padding:4px 0;border-bottom:1px solid #333;display:flex;justify-content:space-between;';
    div.innerHTML = '<span>' + type + ': ' + desc + '</span><span style="color:#22C55E;">' + parseInt(amount).toLocaleString() + ' Ar</span>';
    list.appendChild(div);
}

window.setStatus = setStatus;
window.addExpense = addExpense;
window.enregistrerCourse = function() { loadPage('courses'); };
