// ========================================
// DAGO ADMIN - DASHBOARD v10 FINAL
// ========================================

var API_URL = 'https://dagoos-api.onrender.com/api';
var LANDING_URL = 'https://dago-mobility.pages.dev';
var LOGIN_URL = 'index.html';
var currentPage = 'dashboard';
var refreshInterval;
var orgsData = [];
var driversData = [];
var token = localStorage.getItem('dagoos_token');
var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');

if (!token || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) { window.location.href = LOGIN_URL; }

document.getElementById('sidebarUser').textContent = '👑 ' + (user.name || user.email);
document.getElementById('sidebarAvatar').textContent = (user.name || 'A')[0].toUpperCase();

function logout() { localStorage.clear(); window.location.href = LANDING_URL; }
function setTheme(t) {
    document.body.classList.remove('dark');
    document.querySelectorAll('.sidebar-footer .theme-btns button').forEach(function(b) { b.classList.remove('active'); });
    if (t === 'dark') { document.body.classList.add('dark'); document.getElementById('theme-dark').classList.add('active'); }
    else if (t === 'light') { document.getElementById('theme-light').classList.add('active'); }
    else { document.getElementById('theme-system').classList.add('active'); }
    localStorage.setItem('dago_theme', t);
}

function showModal(title, content, callback) { document.getElementById("modalContent").innerHTML = "<h2>" + title + "</h2>" + content + "<div class=\"btn-row\"><button class=\"btn btn-secondary\" onclick=\"closeModal()\">Annuler</button><button class=\"btn btn-primary\" id=\"modalSaveBtn\">Enregistrer</button></div>"; document.getElementById("modalOverlay").classList.add("show"); if (callback) { document.getElementById("modalSaveBtn").onclick = callback; } }
    
    var btnRow = hasSave ? '<div class="btn-row"><button class="btn btn-secondary" onclick="closeModal()">Annuler</button><button class="btn btn-primary" id="modalSaveBtn">Enregistrer</button></div>' : '<div class="btn-row"><button class="btn btn-primary" onclick="closeModal()">Fermer</button></div>';
    document.getElementById('modalContent').innerHTML = '<h2>' + title + '</h2>' + content + btnRow;
    document.getElementById('modalOverlay').classList.add('show');
    setTimeout(function() { var btn = document.getElementById("modalSaveBtn"); if (btn && onSave) btn.onclick = onSave; }, 100); return true;
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('show'); }

// ===== NAVIGATION =====
document.querySelectorAll('.sidebar-nav a[data-page]').forEach(function(link) {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.sidebar-nav a').forEach(function(l) { l.classList.remove('active'); });
        link.classList.add('active');
        currentPage = link.dataset.page;
        loadPage(currentPage);
    });
});

function loadPage(page) {
    if (refreshInterval) clearInterval(refreshInterval);
    var main = document.getElementById('mainInner');
    currentPage = page;
    switch(page) {
        case 'dashboard': main.innerHTML = getDashboardHTML(); loadDashboardStats(); refreshInterval = setInterval(loadDashboardStats, 30000); break;
        case 'fleets': main.innerHTML = getTableHTML('flottes', 'Flottes', true); loadFleets(); break;
        case 'coops': main.innerHTML = getTableHTML('coops', 'Cooperatives', true); loadCoops(); break;
        case 'drivers': main.innerHTML = getTableHTML('drivers', 'Chauffeurs', false); loadDrivers(); break;
        case 'messages': main.innerHTML = getMessagesHTML(); loadMessages(); refreshInterval = setInterval(loadMessages, 30000); break;
        case 'logs': main.innerHTML = getTableHTML('logs', 'Logs', false); loadLogs(); break;
        case 'payments': main.innerHTML = '<div class="topbar"><h1>Paiements</h1></div><div class="card" style="text-align:center;padding:60px;">Bientot disponible</div>'; break;
        case 'settings': main.innerHTML = getSettingsHTML(); setTimeout(function() { loadPlans(); }, 300); break;
    }
}

function getTableHTML(type, title, showAdd) {
    var cols = (type === 'flottes' || type === 'coops') ? '<th>Nom</th><th>Code</th><th>Email</th><th>Chauffeurs</th><th>Plan</th><th>Statut</th><th>Actions</th>' : '<th>Date</th><th>Utilisateur</th><th>Action</th><th>Details</th>';
    if (type === 'drivers') cols = '<th>Code</th><th>Nom</th><th>Organisation</th><th>Statut</th><th>Actions</th>';
    var addBtn = showAdd ? '<button class="btn btn-primary btn-sm" onclick="addOrg(\'' + (type === 'flottes' ? 'FLEET_MANAGER' : 'COOPERATIVE') + '\')"><i class="fas fa-plus"></i> Ajouter</button>' : '';
    return '<div class="topbar"><h1>' + title + '</h1><div style="display:flex;gap:8px;">' + addBtn + '<button class="btn btn-sm" style="background:var(--border);" onclick="exportCSV(\'' + type + '\')"><i class="fas fa-download"></i> CSV</button></div></div><div class="card"><table><thead><tr>' + cols + '</tr></thead><tbody id="' + type + 'Table"></tbody></table></div>';
}

function getMessagesHTML() {
    return '<div class="topbar"><h1>Messages</h1><button class="btn btn-primary btn-sm" onclick="newMessage()"><i class="fas fa-plus"></i> Nouveau message</button></div><div class="card"><table><thead><tr><th>De</th><th>Sujet</th><th>Message</th><th>Type</th><th>Date</th><th>Actions</th></tr></thead><tbody id="messagesTable"></tbody></table></div>';
}

// ===== DASHBOARD =====
function getDashboardHTML() {
    return '<div class="topbar"><div><h1>Tableau de bord</h1><p id="currentDate" style="color:var(--text2);font-size:13px;"></p></div><div style="display:flex;align-items:center;gap:12px;"><span id="apiStatus" style="font-size:12px;padding:4px 10px;border-radius:50px;"></span><button onclick="loadDashboardStats()" style="padding:8px;background:var(--border);border:none;border-radius:8px;cursor:pointer;"><i class="fas fa-sync-alt"></i></button><span id="lastRefresh" style="font-size:11px;color:var(--text2);"></span></div></div><div class="stats-grid" id="statsGrid"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;"><div class="card"><div class="card-header"><h3>Activites</h3></div><div style="padding:0 18px 14px;max-height:280px;overflow-y:auto;" id="recentActivities"></div></div><div class="card"><div class="card-header"><h3>Inscriptions</h3></div><div style="padding:0 18px 14px;max-height:280px;overflow-y:auto;" id="recentUsers"></div></div></div>';
}

async function loadDashboardStats() {
    var now = new Date();
    var el = function(id) { return document.getElementById(id); };
    if (el('currentDate')) el('currentDate').textContent = now.toLocaleDateString('fr', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (el('lastRefresh')) el('lastRefresh').textContent = 'Mis a jour a ' + now.toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' });
    try {
        var res = await Promise.all([
            fetch(API_URL + '/users', { headers: { Authorization: 'Bearer ' + token } }),
            fetch(API_URL + '/organizations', { headers: { Authorization: 'Bearer ' + token } }),
            fetch(API_URL + '/drivers', { headers: { Authorization: 'Bearer ' + token } })
        ]);
        var usersData = res[0].ok ? await res[0].json() : [];
        orgsData = res[1].ok ? await res[1].json() : [];
        driversData = res[2].ok ? await res[2].json() : [];
        var fleets = orgsData.filter(function(o) { return o.type === 'FLEET_MANAGER'; }).length;
        var coops = orgsData.filter(function(o) { return o.type === 'COOPERATIVE'; }).length;
        if (el('statsGrid')) el('statsGrid').innerHTML = '<div class="stat-card"><div class="stat-icon blue"><i class="fas fa-dollar-sign"></i></div><div class="stat-info"><div class="stat-number">0 Ar</div><div class="stat-label">Revenus</div></div></div><div class="stat-card"><div class="stat-icon green"><i class="fas fa-shopping-cart"></i></div><div class="stat-info"><div class="stat-number">0</div><div class="stat-label">Courses</div></div></div><div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-users"></i></div><div class="stat-info"><div class="stat-number">' + driversData.length + '</div><div class="stat-label">Chauffeurs</div></div></div><div class="stat-card"><div class="stat-icon red"><i class="fas fa-building"></i></div><div class="stat-info"><div class="stat-number">' + fleets + ' / ' + coops + '</div><div class="stat-label">Flottes & Coops</div></div></div>';
        ['fleetCount','coopCount','driverCount'].forEach(function(id) { var e = el(id); if (e) e.textContent = id === 'driverCount' ? driversData.length : (id === 'fleetCount' ? fleets : coops); });
        if (el('apiStatus')) { el('apiStatus').innerHTML = 'API Online'; el('apiStatus').style.background = '#D1FAE5'; el('apiStatus').style.color = '#065F46'; }
    } catch (e) { if (el('apiStatus')) { el('apiStatus').innerHTML = 'API Offline'; el('apiStatus').style.background = '#FEE2E2'; el('apiStatus').style.color = '#991B1B'; } }
}

// ===== ORGS =====
async function loadFleets() { loadOrgs('flottes', 'FLEET_MANAGER'); }
async function loadCoops() { loadOrgs('coops', 'COOPERATIVE'); }
async function loadOrgs(type, orgType) {
    try {
        var res = await Promise.all([
            fetch(API_URL + '/organizations', { headers: { Authorization: 'Bearer ' + token } }),
            fetch(API_URL + '/drivers', { headers: { Authorization: 'Bearer ' + token } })
        ]);
        orgsData = res[0].ok ? await res[0].json() : [];
        driversData = res[1].ok ? await res[1].json() : [];
        var items = orgsData.filter(function(o) { return o.type === orgType; });
        var html = '';
        items.forEach(function(o) {
            var count = driversData.filter(function(d) { return d.organization && d.organization.code === o.code; }).length;
            var statusBadge = o.status === 'active' ? 'badge-success' : o.status === 'pending' ? 'badge-warning' : 'badge-danger';
            var actions = '<button class="btn-sm btn-view" onclick="viewOrg(\'' + o.id + '\')"><i class="fas fa-eye"></i></button>';
            actions += '<button class="btn-sm btn-edit" onclick="editOrg(\'' + o.id + '\')"><i class="fas fa-edit"></i></button>';
            if (o.status === 'pending') {
                actions += '<button class="btn-sm btn-success" onclick="validateOrg(\'' + o.id + '\')" title="Valider"><i class="fas fa-check"></i></button>';
                actions += '<button class="btn-sm btn-suspend" onclick="rejectOrg(\'' + o.id + '\')" title="Refuser"><i class="fas fa-times"></i></button>';
            } else if (o.status === 'active') {
                actions += '<button class="btn-sm btn-suspend" onclick="toggleOrgStatus(\'' + o.id + '\',\'active\')"><i class="fas fa-ban"></i></button>';
            } else if (o.status === 'suspended') {
                actions += '<button class="btn-sm btn-success" onclick="toggleOrgStatus(\'' + o.id + '\',\'suspended\')"><i class="fas fa-check"></i></button>';
            }
            html += '<tr><td><img src="' + (o.logo || 'assets/logo/b-trans.png') + '" class="logo-cell" style="vertical-align:middle;margin-right:8px;"><strong>' + o.name + '</strong></td><td><code>' + (orgType === 'FLEET_MANAGER' ? 'FL-' : 'CO-') + o.code + '</code></td><td>' + (o.email || 'N/A') + '</td><td>' + count + '</td><td><span class="badge badge-info">' + (o.plan || 'Freemium') + '</span></td><td><span class="badge ' + statusBadge + '">' + o.status + '</span></td><td class="action-btns">' + actions + '</td></tr>';
        });
        document.getElementById(type + 'Table').innerHTML = html || '<tr><td colspan="7">Aucune donnee</td></tr>';
    } catch (e) { console.error(e); }
}

async function loadDrivers() {
    var res = await fetch(API_URL + '/drivers', { headers: { Authorization: 'Bearer ' + token } });
    driversData = res.ok ? await res.json() : [];
    var html = '';
    driversData.forEach(function(d) { html += '<tr><td><code>' + d.driverCode + '</code></td><td>' + (d.user ? d.user.name : 'N/A') + '</td><td>' + (d.organization ? d.organization.name : 'N/A') + '</td><td>' + d.status + '</td><td><button class="btn-sm btn-view" onclick="viewDriver(\'' + d.id + '\')"><i class="fas fa-eye"></i></button></td></tr>'; });
    document.getElementById('driversTable').innerHTML = html || '<tr><td colspan="5">Aucun chauffeur</td></tr>';
}

// ===== ACTIONS =====
function viewOrg(id) { var o = orgsData.find(function(x) { return x.id === id; }); if (!o) return; showModal(o.name, '<p><strong>Code:</strong> ' + o.code + '</p><p><strong>Email:</strong> ' + (o.email || 'N/A') + '</p><p><strong>Plan:</strong> ' + (o.plan || 'Freemium') + '</p><p><strong>Statut:</strong> ' + o.status + '</p>'); }
function editOrg(id) {
    var o = orgsData.find(function(x) { return x.id === id; }); if (!o) return;
    var h = '<div class="form-group"><label>Nom</label><input id="editName" value="' + o.name + '"></div><div class="form-group"><label>Email</label><input id="editEmail" value="' + (o.email || '') + '"></div><div class="form-group"><label>Plan</label><select id="editPlan">';
    ['Freemium','Basic','Standard','Premium'].forEach(function(p) { h += '<option ' + (o.plan === p ? 'selected' : '') + '>' + p + '</option>'; });
    h += '</select></div>';
    var saveBtn = showModal("Modifier " + o.name, h, function() {
        fetch(API_URL + "/organizations/" + id, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ name: document.getElementById("editName").value, email: document.getElementById("editEmail").value, plan: document.getElementById("editPlan").value }) }).then(function() { closeModal(); loadPage(currentPage); });
    });
    if (saveBtn) saveBtn.onclick = function() {
        fetch(API_URL + '/organizations/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ name: document.getElementById('editName').value, email: document.getElementById('editEmail').value, plan: document.getElementById('editPlan').value }) }).then(function() { closeModal(); loadPage(currentPage); });
    };
}
function validateOrg(id) { if (confirm('Valider ?')) { fetch(API_URL + '/organizations/' + id + '/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ status: 'active' }) }).then(function() { loadPage(currentPage); }); } }
function rejectOrg(id) { if (confirm('Refuser ?')) { fetch(API_URL + '/organizations/' + id + '/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ status: 'rejected' }) }).then(function() { loadPage(currentPage); }); } }
function toggleOrgStatus(id, s) { var ns = s === 'active' ? 'suspended' : 'active'; if (confirm('Changer en ' + ns + ' ?')) { fetch(API_URL + '/organizations/' + id + '/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ status: ns }) }).then(function() { loadPage(currentPage); }); } }
function addOrg(type) {
    var h = '<div class="form-group"><label>Nom</label><input id="addName"></div><div class="form-group"><label>Email</label><input id="addEmail"></div>';
    var saveBtn = showModal("Modifier " + o.name, h, function() {
        fetch(API_URL + "/organizations/" + id, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ name: document.getElementById("editName").value, email: document.getElementById("editEmail").value, plan: document.getElementById("editPlan").value }) }).then(function() { closeModal(); loadPage(currentPage); });
    });
    if (saveBtn) saveBtn.onclick = function() { var n = document.getElementById('addName').value; if (!n) return alert('Nom requis'); fetch(API_URL + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: n, email: document.getElementById('addEmail').value, password: '123456', role: type }) }).then(function() { closeModal(); loadPage(currentPage); }); };
}
function viewDriver(id) { var d = driversData.find(function(x) { return x.id === id; }); if (!d) return; showModal(d.user ? d.user.name : d.driverCode, '<p><strong>Code:</strong> ' + d.driverCode + '</p><p><strong>Organisation:</strong> ' + (d.organization ? d.organization.name : 'N/A') + '</p><p><strong>Statut:</strong> ' + d.status + '</p>'); }

// ===== MESSAGES =====
async function loadMessages() {
    try {
        var res = await fetch(API_URL + '/messages', { headers: { Authorization: 'Bearer ' + token } });
        var msgs = res.ok ? await res.json() : [];
        var html = '';
        msgs.forEach(function(m) { html += '<tr><td>' + (m.organization ? m.organization.name : 'Admin') + '</td><td>' + m.subject + '</td><td>' + (m.content || '').substring(0, 60) + '</td><td>' + m.type + '</td><td>' + new Date(m.createdAt).toLocaleString('fr') + '</td><td>' + (m.reply ? 'Repondu' : '<button class="btn-sm btn-primary" onclick="replyMessage(\'' + m.id + '\')">Repondre</button>') + '</td></tr>'; });
        document.getElementById('messagesTable').innerHTML = html || '<tr><td colspan="6">Aucun message</td></tr>';
    } catch (e) {}
}
function newMessage() {
    var h = '<div class="form-group"><label>Destinataire</label><select id="msgOrg">';
    orgsData.forEach(function(o) { h += '<option value="' + o.id + '">' + o.name + '</option>'; });
    h += '</select></div><div class="form-group"><label>Sujet</label><input id="msgSubject"></div><div class="form-group"><label>Message</label><textarea id="msgContent" rows="4" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></textarea></div>';
    var saveBtn = showModal("Modifier " + o.name, h, function() {
        fetch(API_URL + "/organizations/" + id, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ name: document.getElementById("editName").value, email: document.getElementById("editEmail").value, plan: document.getElementById("editPlan").value }) }).then(function() { closeModal(); loadPage(currentPage); });
    });
    if (saveBtn) saveBtn.onclick = function() {
        fetch(API_URL + '/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ organizationId: document.getElementById('msgOrg').value, subject: document.getElementById('msgSubject').value, content: document.getElementById('msgContent').value }) }).then(function() { closeModal(); loadMessages(); });
    };
}
function replyMessage(id) { var r = prompt('Reponse :'); if (r) { fetch(API_URL + '/messages/' + id + '/reply', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ reply: r }) }).then(function() { loadMessages(); }); } }

// ===== LOGS =====
async function loadLogs() {
    try { var res = await fetch(API_URL + '/logs', { headers: { Authorization: 'Bearer ' + token } }); var logs = res.ok ? await res.json() : []; var html = ''; logs.slice(0, 50).forEach(function(l) { html += '<tr><td>' + new Date(l.createdAt).toLocaleString('fr') + '</td><td>' + (l.userId || 'Systeme') + '</td><td>' + l.action + '</td><td>' + (l.details || '') + '</td></tr>'; }); document.getElementById('logsTable').innerHTML = html || '<tr><td colspan="4">Aucun log</td></tr>'; } catch (e) {}
}

// ===== EXPORT =====
function exportCSV(type) { var items = type === 'flottes' ? orgsData.filter(function(o) { return o.type === 'FLEET_MANAGER'; }) : orgsData.filter(function(o) { return o.type === 'COOPERATIVE'; }); var csv = 'Nom,Code,Email,Plan,Statut\n'; items.forEach(function(o) { csv += '"' + o.name + '","' + o.code + '","' + (o.email || '') + '","' + (o.plan || '') + '","' + o.status + '"\n'; }); var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })); a.download = type + '.csv'; a.click(); }

// ===== SETTINGS =====
var allPlansData = [];
var currentSettingsTab = 'FLOTTE';

function getSettingsHTML() {
    var h = '<div class="topbar"><h1>Parametres</h1></div>';
    h += '<div style="display:flex;gap:0;margin-bottom:24px;background:var(--card);border-radius:14px;overflow:hidden;">';
    h += '<button class="settings-tab active" id="tab-FLOTTE" onclick="switchTabSettings(\'FLOTTE\')" style="flex:1;padding:16px;border:none;cursor:pointer;font-weight:600;">Plans Flotte</button>';
    h += '<button class="settings-tab" id="tab-COOP" onclick="switchTabSettings(\'COOP\')" style="flex:1;padding:16px;border:none;cursor:pointer;font-weight:600;">Plans Coop</button>';
    h += '<button class="settings-tab" id="tab-LANDING" onclick="switchTabSettings(\'LANDING\')" style="flex:1;padding:16px;border:none;cursor:pointer;font-weight:600;">📄 Contenu Landing</button>';
    h += '</div><div id="plans-content" style="padding:20px;">Chargement...</div>';
    h += '<button onclick="saveAllPlans()" style="width:100%;padding:16px;background:#1A5276;color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;margin-top:24px;"><i class="fas fa-save"></i> Enregistrer</button>';
    return h;
}

function switchTabSettings(type) {
    if (type === "LANDING") { loadLandingEditor(); return; }
    currentSettingsTab = type;
    document.querySelectorAll('.settings-tab').forEach(function(b) { b.classList.remove('active'); });
    document.getElementById('tab-' + type).classList.add('active');
    loadPlans();
}

async function loadPlans() {
    try {
        var res = await fetch(API_URL + '/plans');
        allPlansData = res.ok ? await res.json() : [];
        var plans = allPlansData.filter(function(p) { return p.type === (currentSettingsTab === 'FLOTTE' ? 'FLEET_MANAGER' : 'COOPERATIVE'); });
        var h = '';
        plans.forEach(function(p) {
            h += '<div style="display:flex;align-items:center;gap:10px;padding:12px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;flex-wrap:wrap;">';
            h += '<strong style="width:80px;">' + p.name + '</strong>' + (p.name === 'Premium' ? ' <span style="font-size:10px;background:#F1C40F;color:#1A1A2E;padding:2px 6px;border-radius:50px;">🌐 Page perso incluse</span>' : '');
            h += '<input type="number" value="' + p.price + '" data-id="' + p.id + '" data-field="price" style="width:80px;padding:6px;border:1px solid var(--border);border-radius:6px;text-align:center;"> Ar';
            h += '<input type="number" value="' + p.vehiclesMax + '" data-id="' + p.id + '" data-field="vehiclesMax" style="width:50px;padding:6px;border:1px solid var(--border);border-radius:6px;text-align:center;"> vehicules';
            h += '<input type="number" value="' + p.driversMax + '" data-id="' + p.id + '" data-field="driversMax" style="width:50px;padding:6px;border:1px solid var(--border);border-radius:6px;text-align:center;"> chauffeurs';
            h += '</div>';
        });
        document.getElementById('plans-content').innerHTML = '<div class="card" style="padding:20px;"><h3>Plans ' + (currentSettingsTab === 'FLOTTE' ? 'Flotte' : 'Coop') + '</h3>' + (h || '<p>Aucun plan</p>') + '</div>';
    document.getElementById("plans-content").innerHTML += '<div class="card" style="padding:24px;margin-top:24px;"><h3>🌐 General</h3><div style="margin-top:16px;"><label>💱 Monnaie</label><select id="monnaie" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-top:4px;"><option>Ar (Ariary)</option><option>EUR</option><option>USD</option></select></div><div style="margin-top:16px;"><label>🌐 Langue</label><select id="langue" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;margin-top:4px;"><option>🇫🇷 Francais</option><option>🇲🇬 Malagasy</option><option>🇬🇧 English</option></select></div><div style="margin-top:20px;display:flex;align-items:center;justify-content:space-between;"><div><strong>🚧 Mode maintenance</strong><br><span style="color:var(--text2);font-size:13px;">Bloquer acces plateforme</span></div><label style="position:relative;display:inline-block;width:48px;height:28px;"><input type="checkbox" id="maintenanceMode" style="opacity:0;width:0;height:0;"><span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#E9ECEF;border-radius:50px;transition:0.3s;"></span></label></div></div>';
    } catch (e) {
        document.getElementById('plans-content').innerHTML = '<p>Erreur de chargement: ' + e.message + '</p>';
    }
}

function saveAllPlans() {
    var inputs = document.querySelectorAll('#plans-content input');
    inputs.forEach(function(inp) {
        var id = inp.dataset.id;
        var field = inp.dataset.field;
        var plan = allPlansData.find(function(p) { return p.id === id; });
        if (plan) plan[field] = parseInt(inp.value) || 0;
    });
    fetch(API_URL + '/plans', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ plans: allPlansData }) }).then(function() { alert('Plans sauvegardes !'); }).catch(function() { alert('Erreur'); });
}

// ===== INIT =====

// ===== LANDING EDITOR =====
async function loadLandingEditor() {
    try {
        var res = await fetch(API_URL + '/landing-content');
        var sections = res.ok ? await res.json() : [];
        var h = '<div class="card" style="padding:24px;"><h3>📄 Contenu de la landing page</h3><p style="color:var(--text2);">Modifiez les textes sur dago-mobility.pages.dev</p>';
        var defaultSections = ['hero', 'apps', 'features', 'about', 'cta', 'footer'];
        defaultSections.forEach(function(sec) {
            var data = sections.find(function(s) { return s.section === sec; }) || {};
            h += '<div style="margin-top:20px;border:1px solid var(--border);border-radius:10px;padding:16px;">';
            h += '<h4 style="text-transform:uppercase;font-size:12px;color:var(--text2);margin-bottom:10px;">' + sec + '</h4>';
            h += '<div class="form-group"><label>Titre</label><input value="' + (data.title || '') + '" data-section="' + sec + '" data-field="title" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
            h += '<div class="form-group"><label>Sous-titre</label><input value="' + (data.subtitle || '') + '" data-section="' + sec + '" data-field="subtitle" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
            h += '<div class="form-group"><label>Texte</label><textarea data-section="' + sec + '" data-field="body" rows="3" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;">' + (data.body || '') + '</textarea></div>';
            h += '</div>';
        });
        h += '<button onclick="saveLandingContent()" style="width:100%;padding:14px;background:#1A5276;color:white;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;margin-top:20px;"><i class="fas fa-save"></i> Enregistrer le contenu</button></div>';
        document.getElementById('plans-content').innerHTML = h;
    } catch (e) { document.getElementById('plans-content').innerHTML = '<p>Erreur: ' + e.message + '</p>'; }
}

function saveLandingContent() {
    var inputs = document.querySelectorAll('#plans-content input, #plans-content textarea');
    var sections = [];
    var sectionMap = {};
    inputs.forEach(function(inp) {
        var sec = inp.dataset.section;
        if (!sectionMap[sec]) { sectionMap[sec] = { section: sec, title: '', subtitle: '', body: '' }; }
        sectionMap[sec][inp.dataset.field] = inp.value;
    });
    for (var key in sectionMap) { sections.push(sectionMap[key]); }
    fetch(API_URL + '/landing-content', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ sections: sections }) }).then(function() { alert('✅ Contenu sauvegarde !'); }).catch(function() { alert('Erreur'); });
}

// ===== INIT =====
loadPage('dashboard');
