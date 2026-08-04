// ========================================
// DRIVER - DASHBOARD HOME
// ========================================
var currentDriver = null;
var currentVehicle = null;
var currentOrg = null;

async function init_home() {
    var main = document.getElementById('mainContent');
    var user = JSON.parse(localStorage.getItem("dagoos_user") || "{}");
    var token = localStorage.getItem('dagoos_token');
    var driverId = user.driverId;

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

    main.innerHTML = 
        // HEADER
        '<div style="background:#1E293B;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;">' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
                '<img src="' + logo + '" style="width:32px;height:32px;object-fit:contain;border-radius:8px;" onerror="this.src=\\'/b-trans.svg\\'">' +
                '<div>' +
                    '<div style="font-size:14px;font-weight:700;color:#DAA520;">' + (user.name || 'Chauffeur') + '</div>' +
                    (plate ? '<div style="font-size:10px;color:#94A3B8;">🏍️ ' + plate + '</div>' : '') +
                    '<div style="font-size:10px;color:#94A3B8;">' +
                        '<span id="statusBadge" style="color:#22C55E;">En service</span> - ' + (user.driverCode || '') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<button onclick="logout()" style="background:rgba(239,68,68,0.15);border:none;width:32px;height:32px;border-radius:50%;color:#F87171;cursor:pointer;font-size:16px;">⏻</button>' +
        '</div>' +

        // CONTENU
        '<div style="padding:12px;max-width:500px;margin:0 auto;">' +
            
            // STATS DU JOUR
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:10px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;font-size:13px;">📅 Aujourd\'hui</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;">' +
                    '<div><div style="font-size:20px;font-weight:800;color:#fff;" id="statCoursesJour">0</div><div style="font-size:10px;color:#94A3B8;">Courses</div></div>' +
                    '<div><div style="font-size:20px;font-weight:800;color:#22C55E;" id="statCAJour">0 Ar</div><div style="font-size:10px;color:#94A3B8;">CA brut</div></div>' +
                    '<div><div style="font-size:20px;font-weight:800;color:#3B82F6;" id="statGainJour">0 Ar</div><div style="font-size:10px;color:#94A3B8;">Gain net</div></div>' +
                '</div>' +
            '</div>' +

            // STATS SEMAINE
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:10px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;font-size:13px;">📆 Cette semaine</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;text-align:center;">' +
                    '<div><div style="font-size:18px;font-weight:800;color:#22C55E;" id="statCASem">0 Ar</div><div style="font-size:10px;color:#94A3B8;">CA brut</div></div>' +
                    '<div><div style="font-size:18px;font-weight:800;color:#3B82F6;" id="statGainSem">0 Ar</div><div style="font-size:10px;color:#94A3B8;">Gain net</div></div>' +
                '</div>' +
            '</div>' +

            // BOUTON NOUVELLE COURSE
            '<button onclick="loadPage(\\'courses\\')" style="width:100%;padding:14px;background:#F1C40F;color:#1A1A2E;border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;margin-bottom:14px;">➕ Nouvelle course</button>' +

            // STATUT
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:10px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;font-size:13px;">📊 Statut</h3>' +
                '<div style="display:flex;gap:8px;">' +
                    '<button onclick="changeStatus(\\'en_service\\')" style="flex:1;padding:10px;background:#22C55E;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">▶ Démarrer</button>' +
                    '<button onclick="changeStatus(\\'pause\\')" style="flex:1;padding:10px;background:#F59E0B;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">⏸ Pause</button>' +
                    '<button onclick="changeStatus(\\'termine\\')" style="flex:1;padding:10px;background:#EF4444;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">⏹ Fin</button>' +
                '</div>' +
                '<div style="margin-top:8px;text-align:center;color:#94A3B8;font-size:11px;">Statut actuel : <span id="currentStatus" style="color:#22C55E;">En service</span></div>' +
            '</div>' +

            // DÉPENSES
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:10px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;font-size:13px;">💰 Dépenses du jour</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px;">' +
                    '<button onclick="addExpense(\\'carburant\\')" style="padding:10px 6px;background:#1A1A2E;color:#DAA520;border:1px solid #DAA520;border-radius:8px;cursor:pointer;font-size:11px;">⛽<br>Carburant</button>' +
                    '<button onclick="addExpense(\\'entretien\\')" style="padding:10px 6px;background:#1A1A2E;color:#DAA520;border:1px solid #DAA520;border-radius:8px;cursor:pointer;font-size:11px;">🔧<br>Entretien</button>' +
                    '<button onclick="addExpense(\\'pneu\\')" style="padding:10px 6px;background:#1A1A2E;color:#DAA520;border:1px solid #DAA520;border-radius:8px;cursor:pointer;font-size:11px;">🛞<br>Pneus</button>' +
                    '<button onclick="addExpense(\\'autre\\')" style="padding:10px 6px;background:#1A1A2E;color:#DAA520;border:1px solid #DAA520;border-radius:8px;cursor:pointer;font-size:11px;">📝<br>Autre</button>' +
                '</div>' +
                '<div id="expensesList" style="max-height:150px;overflow-y:auto;font-size:11px;"></div>' +
                '<div id="expensesTotal" style="margin-top:8px;text-align:right;font-weight:700;color:#EF4444;font-size:12px;"></div>' +
            '</div>' +

            // ASSIGNATION
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:20px;">' +
                '<h3 style="color:#DAA520;margin-bottom:8px;font-size:13px;">🔗 Assignation</h3>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">' +
                    '<div><span style="color:#94A3B8;">Véhicule</span><br><span style="font-weight:600;color:#fff;">' + (plate || 'Aucun') + '</span></div>' +
                    '<div><span style="color:#94A3B8;">Organisation</span><br><span style="font-weight:600;color:#fff;">' + orgName + '</span></div>' +
                '</div>' +
            '</div>' +
        '</div>';

    // Charger les stats
    loadStats(driverId);
    // Rafraîchir toutes les 30s
    setInterval(function() { loadStats(driverId); }, 30000);
}

async function loadStats(driverId) {
    try {
        var today = new Date().toISOString().split('T')[0];
        var courses = await apiGet('/courses?driverId=' + driverId);
        var todayCourses = Array.isArray(courses) ? courses.filter(function(c) { return c.date && c.date.startsWith(today); }) : [];
        var weekCourses = Array.isArray(courses) ? courses : [];
        
        var caJour = todayCourses.reduce(function(s, c) { return s + (c.price || 0); }, 0);
        var gainJour = caJour * 0.7;
        var caSem = weekCourses.reduce(function(s, c) { return s + (c.price || 0); }, 0);
        var gainSem = caSem * 0.7;

        document.getElementById('statCoursesJour').textContent = todayCourses.length;
        document.getElementById('statCAJour').textContent = caJour.toLocaleString() + ' Ar';
        document.getElementById('statGainJour').textContent = gainJour.toLocaleString() + ' Ar';
        document.getElementById('statCASem').textContent = caSem.toLocaleString() + ' Ar';
        document.getElementById('statGainSem').textContent = gainSem.toLocaleString() + ' Ar';
    } catch(e) { console.error('Stats:', e); }
}

var expenses = [];
function addExpense(type) {
    var amount = prompt('Montant (' + type + ') en Ar :');
    if (!amount || isNaN(amount)) return;
    var desc = prompt('Description :');
    if (!desc) desc = type;
    
    expenses.push({ type: type, amount: parseInt(amount), desc: desc, time: new Date().toLocaleTimeString() });
    renderExpenses();
}

function renderExpenses() {
    var list = document.getElementById('expensesList');
    var total = document.getElementById('expensesTotal');
    var html = '';
    var sum = 0;
    expenses.forEach(function(e) {
        html += '<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #333;">' +
            '<span>' + e.type + ' - ' + e.desc + '</span>' +
            '<span style="color:#F87171;">' + e.amount.toLocaleString() + ' Ar</span></div>';
        sum += e.amount;
    });
    list.innerHTML = html || '<div style="color:#94A3B8;text-align:center;padding:10px;">Aucune dépense</div>';
    total.textContent = sum > 0 ? 'Total : ' + sum.toLocaleString() + ' Ar' : '';
}

function changeStatus(status) {
    var labels = { en_service: 'En service', pause: 'En pause', termine: 'Terminé' };
    var colors = { en_service: '#22C55E', pause: '#F59E0B', termine: '#EF4444' };
    document.getElementById('currentStatus').textContent = labels[status] || status;
    document.getElementById('currentStatus').style.color = colors[status] || '#fff';
    document.getElementById('statusBadge').textContent = labels[status] || status;
    document.getElementById('statusBadge').style.color = colors[status] || '#fff';
    
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    fetch(DAGOOS_CONFIG.apiUrl + '/drivers/' + user.driverId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('dagoos_token') },
        body: JSON.stringify({ status: status })
    }).catch(function(e) { console.error(e); });
}

window.init_home = init_home;
window.addExpense = addExpense;
window.changeStatus = changeStatus;
