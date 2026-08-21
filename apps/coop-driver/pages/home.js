// ========================================
// DRIVER - DASHBOARD HOME ENRICHI
// ========================================
var currentDriver = null;
var currentVehicle = null;
var currentOrg = null;
var expenses = [];

var estBloque = false;
var isOnline = navigator.onLine;
var refreshInterval = null;

async function init_home() {
    var main = document.getElementById('mainContent');
    var user = JSON.parse(localStorage.getItem("dagoo_driver_user") || "{}");
    var token = localStorage.getItem('dagoo_driver_token');
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
        currentDriver = await apiGet('/drivers/me');
        window.currentDriver = currentDriver;
        
        // Détecter le type d'organisation
        var orgType = currentDriver?.organization?.type || 'FLEET_MANAGER';
        var isCoop = true; // Toujours Coop dans cette application
        
        // Charger le départ du jour et le manifest
        try {
            var departData = await apiGet('/departs/mine').catch(() => ({ depart: null }));
            window.currentDepart = departData.depart || null;
            window.currentVehicle = departData.vehicle || null;
            window.currentPassagers = departData.passagers || [];
            window.currentFinance = departData.finance || null;
        } catch(e) {
            window.currentDepart = null;
            window.currentVehicle = null;
            window.currentPassagers = [];
            window.currentFinance = null;
        }
        
        // Stocker dans le contexte global
        window.DAGOOS_DRIVER_CONTEXT = {
          orgType: orgType,
          isCoop: isCoop,
          orgName: currentDriver?.organization?.name || user.organization || '',
          orgSlug: currentDriver?.organization?.slug || '',
        };

        if (currentDriver && currentDriver.vehicleId) {
            var vehicles = await apiGet('/vehicles');
            if (Array.isArray(vehicles)) {
                currentVehicle = vehicles.find(function(v) {
                    return v.id === currentDriver.vehicleId;
                });
                window.currentVehicle = currentVehicle;
            }
        }

        if (currentDriver && currentDriver.organizationId) {
            currentOrg = {
                id: currentDriver.organizationId,
                name: currentDriver.organization?.name || user.organization || 'Organisation',
                code: currentDriver.organizationCode || ''
            };
        } else if (user.organization) {
            currentOrg = { id: '', name: user.organization, code: '' };
        }
    } catch(e) { console.error(e); }

    var plate = currentVehicle ? currentVehicle.plate : '';
    var orgName = currentOrg ? currentOrg.name : (user.organization || 'Flotte');
    var logo = DAGOOS_CONFIG.logoUrl;

    // Déterminer le statut
    var driverStatus = currentDriver && currentDriver.status ? currentDriver.status : 'OFFLINE';
    var isAvailable = driverStatus === 'AVAILABLE' || driverStatus === 'active';
    var isOnBreak = driverStatus === 'ON_BREAK' || driverStatus === 'pause';
    var statutPresence = isAvailable ? 'present' : isOnBreak ? 'pause' : 'absent';
    var statusLabel = isAvailable ? 'En service' : isOnBreak ? 'En pause' : 'Absent';
    var statusColor = isAvailable ? '#22C55E' : isOnBreak ? '#F59E0B' : '#E74C3C';

    main.innerHTML = 
        // HEADER
        '<div style="background:#064E3B;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;border-bottom:1px solid #10B981;">' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
                '<img src="' + logo + '" style="width:36px;height:36px;object-fit:contain;border-radius:8px;">' +
                '<div>' +
                    '<div style="font-size:14px;font-weight:700;color:#10B981;">' + (user.name || 'Chauffeur') + '</div>' +
                    '<div style="font-size:10px;color:#94A3B8;display:flex;gap:6px;align-items:center;flex-wrap:wrap;">' +
                        '<span style="padding:2px 6px;border-radius:20px;font-size:9px;background:#2a2a2a;color:#22C55E;">🏢 Coopérative</span>' +
                        '<span style="padding:2px 6px;border-radius:20px;font-size:9px;background:' + statusColor + ';color:#fff;">' + statusLabel + '</span>' +
                        (plate ? '<span style="padding:2px 6px;border-radius:20px;font-size:9px;background:#2a2a2a;color:#10B981;">🏍️ ' + plate + '</span>' : '<span style="padding:2px 6px;border-radius:20px;font-size:9px;background:#E74C3C;color:#fff;">⚠️ Sans véhicule</span>') +
                        '<span style="color:#94A3B8;">' + (user.driverCode || '') + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div style="display:flex;gap:4px;">' +
                '<button onclick="goToProfil()" style="background:rgba(255,255,255,0.1);border:none;width:32px;height:32px;border-radius:50%;color:#10B981;cursor:pointer;font-size:14px;">👤</button>' +
                '<button onclick="logout()" style="background:rgba(239,68,68,0.15);border:none;width:32px;height:32px;border-radius:50%;color:#F87171;cursor:pointer;font-size:16px;">⏻</button>' +
            '</div>' +
        '</div>' +

        '<div style="padding:14px;max-width:600px;margin:auto;">' +

            // DÉPART DU JOUR
            (window.currentDepart ? 
                '<div class="card" style="background:#064E3B;border-radius:12px;padding:14px;margin-bottom:10px;border:1px solid #10B981;">' +
                    '<h3 style="color:#10B981;margin-bottom:10px;font-size:13px;">📍 DÉPART DU JOUR</h3>' +
                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">' +
                        '<div><span style="color:#94A3B8;">Départ</span><br><span style="color:#fff;font-weight:600;">' + (window.currentDepart.pointDepart || '') + '</span></div>' +
                        '<div><span style="color:#94A3B8;">Destination</span><br><span style="color:#fff;font-weight:600;">' + (window.currentDepart.destination || '') + '</span></div>' +
                        '<div><span style="color:#94A3B8;">Heure</span><br><span style="color:#fff;font-weight:600;">' + (window.currentDepart.heure || '') + '</span></div>' +
                        '<div><span style="color:#94A3B8;">Véhicule</span><br><span style="color:#fff;font-weight:600;">' + (window.currentVehicle?.plate || 'N/A') + '</span></div>' +
                        '<div><span style="color:#94A3B8;">Tarif fixe</span><br><span style="color:#10B981;font-weight:700;">' + (window.currentDepart.prix || 0) + ' Ar</span></div>' +
                        '<div><span style="color:#94A3B8;">Occupation</span><br><span style="color:#fff;font-weight:600;">' + (window.currentFinance?.passagersTotal || 0) + '/' + (window.currentDepart.placesTotal || 0) + ' places</span></div>' +
                    '</div>' +
                    '<div style="margin-top:10px;text-align:center;">' +
                        '<span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;' + 
                            (window.currentDepart.statut === 'PUBLISHED' ? 'background:#F59E0B;color:#0A1F18;' : 
                             window.currentDepart.statut === 'EMBARQUEMENT' ? 'background:#10B981;color:#0A1F18;' : 
                             'background:#EF4444;color:#fff;') + '">' + window.currentDepart.statut + '</span>' +
                    '</div>' +
                    '<div style="display:flex;gap:8px;margin-top:10px;">' +
                        (window.currentDepart.statut === 'PUBLISHED' ? 
                            '<button onclick="startEmbarquement()" style="flex:1;padding:10px;background:#10B981;color:#0A1F18;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:12px;">🚀 Commencer l\'embarquement</button>' : '') +
                        (window.currentDepart.statut === 'EMBARQUEMENT' ? 
                            '<button onclick="terminerDepart()" style="flex:1;padding:10px;background:#EF4444;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:12px;">✅ Clôturer le départ</button>' : '') +
                    '</div>' +
                '</div>' : 
                '<div class="card" style="background:#064E3B;border-radius:12px;padding:14px;margin-bottom:10px;text-align:center;">' +
                    '<p style="color:#94A3B8;font-size:13px;">Aucun départ assigné aujourd\'hui</p>' +
                '</div>') +

            // MANIFEST PASSAGERS
            (window.currentPassagers && window.currentPassagers.length > 0 ? 
                '<div class="card" style="background:#064E3B;border-radius:12px;padding:14px;margin-bottom:10px;">' +
                    '<h3 style="color:#10B981;margin-bottom:10px;font-size:13px;">📋 MANIFEST PASSAGERS (' + window.currentPassagers.length + ')</h3>' +
                    window.currentPassagers.map(function(p) {
                        var statutColor = p.statut === 'CONFIRMED' ? '#22C55E' : p.statut === 'PENDING' ? '#F59E0B' : '#EF4444';
                        var statutLabel = p.statut === 'CONFIRMED' ? 'PAYÉ' : p.statut === 'PENDING' ? 'EN ATTENTE' : 'NON PAYÉ';
                        var actionBtn = '';
                        if (p.statut === 'PENDING') {
                            actionBtn = '<button onclick="marquerPaye(\'' + p.id + '\')" style="margin-left:6px;padding:4px 8px;background:#10B981;color:#0A1F18;border:none;border-radius:6px;cursor:pointer;font-size:10px;font-weight:700;">💰 Marquer payé</button>';
                        }
                        return '<div style="background:#0A1F18;border-radius:8px;padding:10px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">' +
                            '<div>' +
                                '<div style="color:#fff;font-weight:600;font-size:12px;">' + p.passagerNom + '</div>' +
                                '<div style="color:#94A3B8;font-size:10px;">Place ' + p.place + ' · ' + (p.telephone || '') + '</div>' +
                            '</div>' +
                            '<div style="display:flex;align-items:center;">' +
                                '<span style="padding:3px 8px;border-radius:20px;font-size:10px;font-weight:700;background:' + statutColor + ';color:#0A1F18;">' + statutLabel + '</span>' +
                                actionBtn +
                            '</div>' +
                        '</div>';
                    }).join('') +
                '</div>' : '') +

            // RÉCAPITULATIF FINANCIER
            (window.currentFinance ? 
                '<div class="card" style="background:#064E3B;border-radius:12px;padding:14px;margin-bottom:10px;">' +
                    '<h3 style="color:#10B981;margin-bottom:10px;font-size:13px;">💰 RÉCAPITULATIF FINANCIER</h3>' +
                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">' +
                        '<div style="background:#0A1F18;border-radius:8px;padding:8px;"><span style="color:#94A3B8;">Passagers payés</span><br><span style="color:#fff;font-weight:700;font-size:16px;">' + window.currentFinance.passagersPayes + '/' + window.currentFinance.passagersTotal + '</span></div>' +
                        '<div style="background:#0A1F18;border-radius:8px;padding:8px;"><span style="color:#94A3B8;">Recette</span><br><span style="color:#22C55E;font-weight:700;font-size:16px;">' + window.currentFinance.recette + ' Ar</span></div>' +
                        '<div style="background:#0A1F18;border-radius:8px;padding:8px;"><span style="color:#94A3B8;">Versement Coop (80%)</span><br><span style="color:#F59E0B;font-weight:700;">' + window.currentFinance.versementCoop + ' Ar</span></div>' +
                        '<div style="background:#0A1F18;border-radius:8px;padding:8px;"><span style="color:#94A3B8;">Commission (20%)</span><br><span style="color:#10B981;font-weight:700;">' + window.currentFinance.commissionChauffeur + ' Ar</span></div>' +
                    '</div>' +
                '</div>' : '') +

            // DÉPENSES
            '<div class="card" style="background:#064E3B;border-radius:12px;padding:14px;margin-bottom:10px;">' +
                '<h3 style="color:#10B981;margin-bottom:10px;font-size:13px;">💰 Dépenses du jour</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px;">' +
                    '<button onclick="addCarburant()" style="padding:10px 4px;background:#0A1F18;color:#10B981;border:1px solid #10B981;border-radius:8px;cursor:pointer;font-size:10px;">⛽ Carburant</button>' +
                    '<button onclick="addEntretien()" style="padding:10px 4px;background:#0A1F18;color:#10B981;border:1px solid #10B981;border-radius:8px;cursor:pointer;font-size:10px;">🔧 Entretien</button>' +
                    '<button onclick="addPneu()" style="padding:10px 4px;background:#0A1F18;color:#10B981;border:1px solid #10B981;border-radius:8px;cursor:pointer;font-size:10px;">🛞 Pneus</button>' +
                    '<button onclick="addAutre()" style="padding:10px 4px;background:#0A1F18;color:#10B981;border:1px solid #10B981;border-radius:8px;cursor:pointer;font-size:10px;">📝 Autre</button>' +
                '</div>' +
                '<div id="expensesList" style="max-height:120px;overflow-y:auto;font-size:11px;"></div>' +
                '<div id="expensesTotal" style="margin-top:8px;text-align:right;font-weight:700;color:#EF4444;font-size:12px;"></div>' +
            '</div>' +

            // ASSIGNATION
            '<div class="card" style="background:#064E3B;border-radius:12px;padding:14px;margin-bottom:10px;">' +
                '<h3 style="color:#10B981;margin-bottom:8px;font-size:13px;">🔗 Assignation</h3>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">' +
                    '<div><span style="color:#94A3B8;">Véhicule</span><br><span style="font-weight:600;color:#fff;" id="assignedVehicle">' + (plate || 'Aucun') + '</span></div>' +
                    '<div><span style="color:#94A3B8;">Organisation</span><br><span style="font-weight:600;color:#fff;">' + orgName + '</span></div>' +
                '</div>' +
            '</div>' +
        '</div>';};

async function accepterCourse(notificationId) {
  var user = JSON.parse(localStorage.getItem('dagoo_driver_user') || '{}');
  if (!user.driverId) { alert('Chauffeur non identifié'); return; }
  
  try {
    // Marquer la notification comme lue
    await fetch(DAGOOS_CONFIG.apiUrl + '/notifications/' + notificationId + '/read', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('dagoo_driver_token'), 'Content-Type': 'application/json' },
    });
    
    // Stocker localement la course acceptée
    var coursesAcceptees = JSON.parse(localStorage.getItem('dagoo_courses_acceptees') || '[]');
    coursesAcceptees.push({
      notificationId,
      date: new Date().toISOString(),
      statut: 'ACCEPTED'
    });
    localStorage.setItem('dagoo_courses_acceptees', JSON.stringify(coursesAcceptees));
    
    alert('✅ Course acceptée !');
    loadPage('courses');
  } catch (e) {
    alert('Erreur lors de l\'acceptation');
  }
}

async function refuserCourse(notificationId) {
  try {
    await fetch(DAGOOS_CONFIG.apiUrl + '/notifications/' + notificationId + '/read', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + localStorage.getItem('dagoo_driver_token'), 'Content-Type': 'application/json' },
    });
    alert('Course refusée');
    loadPage('home');
  } catch (e) {
    alert('Erreur lors du refus');
  }
}

async function proposerVersement() {
    var user = JSON.parse(localStorage.getItem('dagoo_driver_user') || '{}');
    try {
        var courses = await apiGet('/finances/courses?driverId=' + user.driverId);
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


// Fonction pour changer le statut du départ

// Fonctions wrapper pour les boutons
function startEmbarquement() { transitionDepart('start_embarquement'); }
function terminerDepart() { transitionDepart('terminer'); }
function goToProfil() { loadPage('profil'); }
function addCarburant() { addExpense('carburant'); }
function addEntretien() { addExpense('entretien'); }
function addPneu() { addExpense('pneu'); }
function addAutre() { addExpense('autre'); }

async function transitionDepart(action) {
    if (!window.currentDepart) return;
    
    const btn = event?.target;
    if (btn) btn.disabled = true;
    
    try {
        const result = await apiPost('/departs/' + window.currentDepart.id + '/transition', { action });
        if (result.ok) {
            alert('✅ ' + result.message);
            // Recharger les données
            await loadHomeData();
            await init_home();
        } else {
            alert('❌ ' + (result.error || 'Erreur transition'));
        }
    } catch(e) {
        alert('❌ Erreur : ' + e.message);
    }
    
    if (btn) btn.disabled = false;
}


// Fonction pour marquer un passager comme payé
async function marquerPaye(reservationId) {
    if (!reservationId) return;
    
    if (!confirm('Confirmer le paiement de ce passager ?')) return;
    
    try {
        const result = await apiFetch('/reservations/' + reservationId, {
            method: 'PUT',
            body: { statut: 'CONFIRMED' }
        });
        
        if (result && result.id) {
            // Recharger les données du Home
            await loadHomeData();
            init_home();
        } else {
            alert('❌ Erreur lors de la confirmation');
        }
    } catch(e) {
        alert('❌ Erreur : ' + e.message);
    }
}

// Fonction pour recharger les données du Home
async function loadHomeData() {
    try {
        var departData = await apiGet('/departs/mine').catch(() => ({ depart: null }));
        window.currentDepart = departData.depart || null;
        window.currentVehicle = departData.vehicle || null;
        window.currentPassagers = departData.passagers || [];
        window.currentFinance = departData.finance || null;
    } catch(e) {
        window.currentDepart = null;
        window.currentVehicle = null;
        window.currentPassagers = [];
        window.currentFinance = null;
    }
}

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
window.marquerPaye = marquerPaye;
window.addExpense = addExpense;

// Chargement des infos du véhicule
async function loadDriverVehicleInfo() {
  var vehicleBadge = document.getElementById('vehicleStatusBadge');
  var vehicleNameEl = document.getElementById('assignedVehicleName');

  try {
    var data = await apiFetch('/drivers/me');
    
    if (data && data.vehicle) {
      if (vehicleBadge) {
        vehicleBadge.textContent = '🛵 ' + (data.vehicle.plate || 'Moto assignée');
        vehicleBadge.className = 'badge badge-success';
      }
      if (vehicleNameEl) {
        vehicleNameEl.textContent = data.vehicle.plate || data.vehicle.model || 'Moto';
      }
    } else {
      if (vehicleBadge) {
        vehicleBadge.textContent = '⚠️ Sans moto';
        vehicleBadge.className = 'badge badge-danger';
      }
    }
  } catch (err) {
    console.warn('Impossible de charger les données du véhicule:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadDriverVehicleInfo);
