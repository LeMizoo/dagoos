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

    // Charger les infos du chauffeur depuis l'API publique
    try {
        var driverData = await apiGet('/public/driver/' + driverId);
        if (driverData) {
            currentDriver = driverData;
            
            // Récupérer le véhicule
            if (driverData.vehicleId) {
                var vehicles = await apiGet('/public/vehicles/' + driverId);
                if (Array.isArray(vehicles) && vehicles.length > 0) {
                    currentVehicle = vehicles[0];
                }
            }
            
            // Récupérer l'organisation
            if (driverData.organizationId) {
                var orgs = await apiGet('/public/organizations');
                if (Array.isArray(orgs)) {
                    currentOrg = orgs.find(function(o) { return o.id === driverData.organizationId; });
                }
            }
        }
    } catch(e) { 
        console.error('Erreur chargement infos chauffeur', e);
        // Utiliser les données locales en fallback
        currentDriver = user;
    }

    var vehiclePlate = currentVehicle ? currentVehicle.plate : (currentDriver ? currentDriver.plate : '');
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

            // Statut - avec les 3 boutons
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:20px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;">📊 Statut</h3>' +
                '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                    '<button id="statusStart" style="flex:1;padding:8px;background:#22C55E;color:white;border:none;border-radius:6px;cursor:pointer;">▶️ Démarrer</button>' +
                    '<button id="statusPause" style="flex:1;padding:8px;background:#F59E0B;color:white;border:none;border-radius:6px;cursor:pointer;">⏸ Pause</button>' +
                    '<button id="statusEnd" style="flex:1;padding:8px;background:#EF4444;color:white;border:none;border-radius:6px;cursor:pointer;">⏹ Terminer</button>' +
                '</div>' +
                '<div style="margin-top:8px;text-align:center;color:#94A3B8;font-size:12px;">Statut: <span id="currentStatusDisplay" style="color:#22C55E;">En service</span></div>' +
            '</div>' +

            // Dépenses
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:20px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;">💰 Dépenses</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">' +
                    '<button onclick="addExpense(\'carburant\')" style="padding:8px;background:#1A1A2E;color:#DAA520;border:1px solid #DAA520;border-radius:6px;cursor:pointer;">⛽ Carburant</button>' +
                    '<button onclick="addExpense(\'entretien\')" style="padding:8px;background:#1A1A2E;color:#DAA520;border:1px solid #DAA520;border-radius:6px;cursor:pointer;">🔧 Entretien</button>' +
                    '<button onclick="addExpense(\'pneu\')" style="padding:8px;background:#1A1A2E;color:#DAA520;border:1px solid #DAA520;border-radius:6px;cursor:pointer;">🛞 Pneus</button>' +
                    '<button onclick="addExpense(\'autre\')" style="padding:8px;background:#1A1A2E;color:#DAA520;border:1px solid #DAA520;border-radius:6px;cursor:pointer;">📝 Autre</button>' +
                '</div>' +
                '<div id="expensesList" style="margin-top:10px;max-height:100px;overflow-y:auto;"></div>' +
            '</div>' +

            // Assignation
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:20px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;">🔗 Assignation</h3>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
                    '<div><div style="color:#94A3B8;font-size:11px;">🚗 Véhicule</div><div style="font-weight:600;" id="assignedVehicle">' + (vehiclePlate || 'Aucun') + '</div></div>' +
                    '<div><div style="color:#94A3B8;font-size:11px;">👤 Chauffeur</div><div style="font-weight:600;" id="assignedDriver">' + (user.name || 'Aucun') + '</div></div>' +
                '</div>' +
            '</div>' +
        '</div>';

    main.innerHTML = headerHTML + statsHTML;

    // Charger les stats
    loadStats(driverId);

    // Gestion du statut
    document.getElementById('statusStart').addEventListener('click', function() { setStatus('en_service'); });
    document.getElementById('statusPause').addEventListener('click', function() { setStatus('pause'); });
    document.getElementById('statusEnd').addEventListener('click', function() { setStatus('termine'); });

    // Rafraîchir toutes les 30 secondes
    if (window._refreshInterval) clearInterval(window._refreshInterval);
    window._refreshInterval = setInterval(function() {
        loadStats(driverId);
    }, 30000);
}

// Fonction pour charger les statistiques
async function loadStats(driverId) {
    try {
        var today = new Date().toISOString().split('T')[0];
        var trips = await apiGet('/public/trips/' + driverId + '?date=' + today);
        
        if (Array.isArray(trips)) {
            var count = trips.length;
            var gross = trips.reduce(function(sum, t) { return sum + (t.amount || 0); }, 0);
            var net = gross * 0.7; // 30% commission
            
            document.getElementById('statCoursesJour').textContent = count;
            document.getElementById('statCAJour').textContent = gross + ' Ar';
            document.getElementById('statGainJour').textContent = net + ' Ar';
            document.getElementById('statCASem').textContent = (gross * 7) + ' Ar';
            document.getElementById('statGainSem').textContent = (net * 7) + ' Ar';
        }
    } catch(e) {
        console.error('Erreur chargement stats', e);
    }
}

// Fonction pour changer le statut
async function setStatus(status) {
    try {
        var result = await apiPost('/driver/status', { status: status });
        if (result.success) {
            document.getElementById('currentStatusDisplay').textContent = status;
            document.getElementById('statusBadge').textContent = status;
            alert('Statut mis à jour : ' + status);
        }
    } catch(e) {
        console.error('Erreur changement statut', e);
        alert('Erreur lors du changement de statut');
    }
}

// Fonction pour ajouter une dépense
function addExpense(type) {
    var amount = prompt('Montant de la dépense (Ar):');
    if (amount === null) return;
    
    var description = prompt('Description:');
    if (description === null) return;
    
    apiPost('/driver/expenses', {
        type: type,
        amount: parseFloat(amount),
        description: description
    }).then(function(result) {
        if (result.success) {
            alert('Dépense ajoutée !');
            // Rafraîchir les dépenses
        }
    }).catch(function(e) {
        console.error('Erreur ajout dépense', e);
        alert('Erreur lors de l\'ajout de la dépense');
    });
}

// Fonction pour enregistrer une nouvelle course
function enregistrerCourse() {
    // Ouvrir le formulaire de course
    loadPage('courses');
}

// Exposer les fonctions globalement
window.init_home = init_home;
window.addExpense = addExpense;
window.enregistrerCourse = enregistrerCourse;
window.setStatus = setStatus;
