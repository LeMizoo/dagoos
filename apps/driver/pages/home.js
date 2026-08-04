// ========================================
// DRIVER - DASHBOARD HOME COMPLET
// ========================================

var currentDriver = null;
var currentVehicle = null;
var currentOrg = null;
var expenses = [];
var refreshInterval = null;

async function init_home() {
    var main = document.getElementById('mainContent');
    var user = JSON.parse(localStorage.getItem("dagoos_user") || "{}");
    var token = localStorage.getItem('dagoos_token');
    var driverId = user.driverId;

    // Charger les infos du chauffeur depuis l'API
    try {
        // Utiliser les routes publiques pour éviter les problèmes d'auth
        var driverData = await apiGet('/public/driver/' + driverId);
        if (driverData && driverData.id) {
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
        } else {
            // Fallback: utiliser les données locales
            currentDriver = user;
        }
    } catch(e) { 
        console.error('Erreur chargement infos chauffeur', e);
        currentDriver = user;
    }

    var plate = currentVehicle ? (currentVehicle.plate || currentVehicle.registration || '') : '';
    var orgName = currentOrg ? currentOrg.name : (user.organization || 'Flotte');
    var logo = DAGOOS_CONFIG.logoUrl;

    // HEADER
    var headerHTML = 
        '<div style="background:#1E293B;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;border-bottom:1px solid #DAA520;">' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
                '<img src="' + logo + '" style="width:32px;height:32px;object-fit:contain;border-radius:8px;">' +
                '<div>' +
                    '<div style="font-size:14px;font-weight:700;color:#DAA520;">' + (user.name || 'Chauffeur') + '</div>' +
                    (plate ? '<div style="font-size:10px;color:#94A3B8;">🏍️ ' + plate + '</div>' : '') +
                    '<div style="font-size:10px;color:#94A3B8;">' +
                        '<span id="statusBadge" style="color:#22C55E;">En service</span> - ' + (user.driverCode || '') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<button onclick="logout()" style="background:rgba(239,68,68,0.15);border:none;width:32px;height:32px;border-radius:50%;color:#F87171;cursor:pointer;font-size:16px;">⏻</button>' +
        '</div>';

    // CONTENU PRINCIPAL
    var contentHTML = 
        '<div style="padding:12px;max-width:500px;margin:0 auto;padding-bottom:80px;">' +
            
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
            '<button onclick="loadPage(\'courses\')" style="width:100%;padding:14px;background:#F1C40F;color:#1A1A2E;border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;margin-bottom:14px;">➕ Nouvelle course</button>' +

            // STATUT - AVEC BOUTONS
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:10px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;font-size:13px;">📊 Statut</h3>' +
                '<div style="display:flex;gap:8px;">' +
                    '<button onclick="changeStatus(\'en_service\')" style="flex:1;padding:10px;background:#22C55E;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">▶ Démarrer</button>' +
                    '<button onclick="changeStatus(\'pause\')" style="flex:1;padding:10px;background:#F59E0B;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">⏸ Pause</button>' +
                    '<button onclick="changeStatus(\'termine\')" style="flex:1;padding:10px;background:#EF4444;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">⏹ Fin</button>' +
                '</div>' +
                '<div style="margin-top:8px;text-align:center;color:#94A3B8;font-size:11px;">Statut actuel : <span id="currentStatus" style="color:#22C55E;">En service</span></div>' +
            '</div>' +

            // DÉPENSES
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:10px;">' +
                '<h3 style="color:#DAA520;margin-bottom:10px;font-size:13px;">💰 Dépenses du jour</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px;">' +
                    '<button onclick="addExpense(\'carburant\')" style="padding:10px 6px;background:#1A1A2E;color:#DAA520;border:1px solid #DAA520;border-radius:8px;cursor:pointer;font-size:11px;">⛽<br>Carburant</button>' +
                    '<button onclick="addExpense(\'entretien\')" style="padding:10px 6px;background:#1A1A2E;color:#DAA520;border:1px solid #DAA520;border-radius:8px;cursor:pointer;font-size:11px;">🔧<br>Entretien</button>' +
                    '<button onclick="addExpense(\'pneu\')" style="padding:10px 6px;background:#1A1A2E;color:#DAA520;border:1px solid #DAA520;border-radius:8px;cursor:pointer;font-size:11px;">🛞<br>Pneus</button>' +
                    '<button onclick="addExpense(\'autre\')" style="padding:10px 6px;background:#1A1A2E;color:#DAA520;border:1px solid #DAA520;border-radius:8px;cursor:pointer;font-size:11px;">📝<br>Autre</button>' +
                '</div>' +
                '<div id="expensesList" style="max-height:150px;overflow-y:auto;font-size:11px;"></div>' +
                '<div id="expensesTotal" style="margin-top:8px;text-align:right;font-weight:700;color:#EF4444;font-size:12px;"></div>' +
            '</div>' +

            // ASSIGNATION
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:20px;">' +
                '<h3 style="color:#DAA520;margin-bottom:8px;font-size:13px;">🔗 Assignation</h3>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">' +
                    '<div><span style="color:#94A3B8;">Véhicule</span><br><span style="font-weight:600;color:#fff;" id="assignedVehicle">' + (plate || 'Aucun') + '</span></div>' +
                    '<div><span style="color:#94A3B8;">Organisation</span><br><span style="font-weight:600;color:#fff;" id="assignedOrg">' + orgName + '</span></div>' +
                '</div>' +
            '</div>' +
        '</div>';

    main.innerHTML = headerHTML + contentHTML;

    // Charger les stats
    loadStats(driverId);
    loadExpenses();

    // Rafraîchir toutes les 30s
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(function() { 
        loadStats(driverId); 
        loadExpenses();
    }, 30000);
}

// ========================================
// FONCTIONS STATISTIQUES
// ========================================

async function loadStats(driverId) {
    try {
        var today = new Date().toISOString().split('T')[0];
        
        // Utiliser les routes publiques
        var courses = await apiGet('/public/trips/' + driverId);
        var coursesArray = Array.isArray(courses) ? courses : [];
        
        // Courses d'aujourd'hui
        var todayCourses = coursesArray.filter(function(c) { 
            return c.createdAt && c.createdAt.startsWith(today); 
        });
        
        // Calculs
        var caJour = todayCourses.reduce(function(s, c) { return s + (c.amount || c.price || 0); }, 0);
        var gainJour = Math.round(caJour * 0.7);
        var caSem = coursesArray.reduce(function(s, c) { return s + (c.amount || c.price || 0); }, 0);
        var gainSem = Math.round(caSem * 0.7);

        // Mise à jour des éléments
        var el = document.getElementById('statCoursesJour');
        if (el) el.textContent = todayCourses.length;
        
        el = document.getElementById('statCAJour');
        if (el) el.textContent = caJour.toLocaleString() + ' Ar';
        
        el = document.getElementById('statGainJour');
        if (el) el.textContent = gainJour.toLocaleString() + ' Ar';
        
        el = document.getElementById('statCASem');
        if (el) el.textContent = caSem.toLocaleString() + ' Ar';
        
        el = document.getElementById('statGainSem');
        if (el) el.textContent = gainSem.toLocaleString() + ' Ar';
        
    } catch(e) { 
        console.error('Erreur chargement stats:', e); 
    }
}

// ========================================
// FONCTIONS DÉPENSES
// ========================================

function addExpense(type) {
    var amount = prompt('Montant (' + type + ') en Ar :');
    if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
        alert('Veuillez entrer un montant valide');
        return;
    }
    
    var desc = prompt('Description (optionnelle) :');
    if (desc === null) return;
    if (!desc || desc.trim() === '') desc = type;
    
    var expense = { 
        type: type, 
        amount: parseInt(amount), 
        desc: desc.trim(), 
        time: new Date().toLocaleTimeString() 
    };
    
    expenses.push(expense);
    renderExpenses();
    
    // Sauvegarder en localStorage
    try {
        localStorage.setItem('driver_expenses', JSON.stringify(expenses));
    } catch(e) {}
    
    // Envoyer à l'API si possible
    try {
        apiPost('/driver/expenses', {
            type: type,
            amount: parseInt(amount),
            description: desc.trim()
        }).catch(function(e) { console.error('Erreur envoi dépense:', e); });
    } catch(e) {}
}

function renderExpenses() {
    var list = document.getElementById('expensesList');
    var totalEl = document.getElementById('expensesTotal');
    
    if (!list) return;
    
    if (expenses.length === 0) {
        list.innerHTML = '<div style="color:#94A3B8;text-align:center;padding:10px;">Aucune dépense enregistrée</div>';
        if (totalEl) totalEl.textContent = '';
        return;
    }
    
    var html = '';
    var sum = 0;
    var typeLabels = {
        carburant: '⛽ Carburant',
        entretien: '🔧 Entretien',
        pneu: '🛞 Pneus',
        autre: '📝 Autre'
    };
    
    // Afficher les 10 dernières dépenses
    var recentExpenses = expenses.slice(-10).reverse();
    recentExpenses.forEach(function(e) {
        var label = typeLabels[e.type] || e.type;
        html += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #333;">' +
            '<span style="color:#94A3B8;font-size:11px;">' + label + ' - ' + e.desc + '</span>' +
            '<span style="color:#F87171;font-weight:600;">' + e.amount.toLocaleString() + ' Ar</span></div>';
        sum += e.amount;
    });
    
    list.innerHTML = html;
    if (totalEl) {
        totalEl.textContent = sum > 0 ? 'Total : ' + sum.toLocaleString() + ' Ar' : '';
    }
}

function loadExpenses() {
    try {
        var saved = localStorage.getItem('driver_expenses');
        if (saved) {
            var parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                expenses = parsed;
                renderExpenses();
            }
        }
    } catch(e) {}
}

// ========================================
// FONCTIONS STATUT
// ========================================

function changeStatus(status) {
    var labels = { 
        en_service: 'En service', 
        pause: 'En pause', 
        termine: 'Terminé' 
    };
    var colors = { 
        en_service: '#22C55E', 
        pause: '#F59E0B', 
        termine: '#EF4444' 
    };
    
    var statusLabel = labels[status] || status;
    var statusColor = colors[status] || '#fff';
    
    var currentStatusEl = document.getElementById('currentStatus');
    var statusBadgeEl = document.getElementById('statusBadge');
    
    if (currentStatusEl) {
        currentStatusEl.textContent = statusLabel;
        currentStatusEl.style.color = statusColor;
    }
    if (statusBadgeEl) {
        statusBadgeEl.textContent = statusLabel;
        statusBadgeEl.style.color = statusColor;
    }
    
    // Envoyer à l'API
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    if (user && user.driverId) {
        apiPost('/driver/status', { 
            driverId: user.driverId, 
            status: status 
        }).catch(function(e) { 
            console.error('Erreur mise à jour statut:', e); 
        });
    }
}

// ========================================
// FONCTIONS D'AUTH
// ========================================

function logout() {
    localStorage.removeItem('dagoos_token');
    localStorage.removeItem('dagoos_user');
    window.location.replace(DAGOOS_CONFIG.landingUrl || '/index.html');
}

// ========================================
// EXPOSITION DES FONCTIONS
// ========================================

window.init_home = init_home;
window.addExpense = addExpense;
window.changeStatus = changeStatus;
window.logout = logout;
window.loadStats = loadStats;
window.loadExpenses = loadExpenses;
window.renderExpenses = renderExpenses;

console.log('✅ Driver Dashboard chargé avec succès');
console.log('📊 Fonctionnalités disponibles:');
console.log('   - Statistiques jour/semaine');
console.log('   - Statut (Démarrer/Pause/Fin)');
console.log('   - Dépenses (Carburant/Entretien/Pneus/Autre)');
console.log('   - Assignation véhicule/organisation');
console.log('   - Nouvelle course');