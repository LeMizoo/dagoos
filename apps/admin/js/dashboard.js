// ========================================
// DAGO ADMIN - DASHBOARD v8 FINAL
// ========================================

var API_URL = 'https://dagoos-api.onrender.com/api';
var LANDING_URL = 'https://dago-mobility.pages.dev';
var LOGIN_URL = 'index.html';
var currentPage = 'dashboard';
var refreshInterval;
var orgsData = [], driversData = [], usersData = [];
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

function showModal(title, content, hasSave) {
    var btnRow = hasSave ? '<div class="btn-row"><button class="btn btn-secondary" onclick="closeModal()">Annuler</button><button class="btn btn-primary" id="modalSaveBtn">Enregistrer</button></div>' : '<div class="btn-row"><button class="btn btn-primary" onclick="closeModal()">Fermer</button></div>';
    document.getElementById('modalContent').innerHTML = '<h2>' + title + '</h2>' + content + btnRow;
    document.getElementById('modalOverlay').classList.add('show');
    return document.getElementById('modalSaveBtn');
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
        case 'payments': main.innerHTML = '<div class="topbar"><h1>Paiements</h1></div><div class="card" style="text-align:center;padding:60px;"><i class="fas fa-credit-card" style="font-size:48px;color:#CCC;"></i><h3>Bientot disponible</h3></div>'; break;
        case 'settings': main.innerHTML = getSettingsHTML(); break;
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
        var res = await Promise.all([fetch(API_URL + '/users', { headers: { Authorization: 'Bearer ' + token } }), fetch(API_URL + '/organizations', { headers: { Authorization: 'Bearer ' + token } }), fetch(API_URL + '/drivers', { headers: { Authorization: 'Bearer ' + token } })]);
        usersData = res[0].ok ? await res[0].json() : [];
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
        var res = await Promise.all([fetch(API_URL + '/organizations', { headers: { Authorization: 'Bearer ' + token } }), fetch(API_URL + '/drivers', { headers: { Authorization: 'Bearer ' + token } })]);
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
function viewOrg(id) {
    var org = orgsData.find(function(o) { return o.id === id; }); if (!org) return;
    showModal(org.name, '<p><strong>Code:</strong> ' + org.code + '</p><p><strong>Email:</strong> ' + (org.email || 'N/A') + '</p><p><strong>Plan:</strong> ' + (org.plan || 'Freemium') + '</p><p><strong>Statut:</strong> ' + org.status + '</p>');
}
function editOrg(id) {
    var org = orgsData.find(function(o) { return o.id === id; }); if (!org) return;
    var h = '<div class="form-group"><label>Nom</label><input id="editName" value="' + org.name + '"></div><div class="form-group"><label>Email</label><input id="editEmail" value="' + (org.email || '') + '"></div><div class="form-group"><label>Plan</label><select id="editPlan">';
    ['Freemium','Basic','Standard','Premium'].forEach(function(p) { h += '<option ' + (org.plan === p ? 'selected' : '') + '>' + p + '</option>'; });
    h += '</select></div>';
    var saveBtn = showModal('Modifier ' + org.name, h, true);
    if (saveBtn) saveBtn.onclick = function() {
        var name = document.getElementById('editName').value;
        var email = document.getElementById('editEmail').value;
        var plan = document.getElementById('editPlan').value;
        fetch(API_URL + '/organizations/' + id, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ name: name, email: email, plan: plan }) }).then(function() { closeModal(); loadPage(currentPage); });
    };
}
function validateOrg(id) {
    if (confirm('Valider cette organisation ?')) {
        fetch(API_URL + '/organizations/' + id + '/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ status: 'active' }) }).then(function() { loadPage(currentPage); });
    }
}
function rejectOrg(id) {
    if (confirm('Refuser cette organisation ?')) {
        fetch(API_URL + '/organizations/' + id + '/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ status: 'rejected' }) }).then(function() { loadPage(currentPage); });
    }
}
function toggleOrgStatus(id, status) {
    var newStatus = status === 'active' ? 'suspended' : 'active';
    if (confirm('Changer en ' + newStatus + ' ?')) {
        fetch(API_URL + '/organizations/' + id + '/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ status: newStatus }) }).then(function() { loadPage(currentPage); });
    }
}
function addOrg(type) {
    var h = '<div class="form-group"><label>Nom</label><input id="addName"></div><div class="form-group"><label>Email</label><input id="addEmail"></div>';
    var saveBtn = showModal('Ajouter ' + (type === 'FLEET_MANAGER' ? 'Flotte' : 'Cooperative'), h, true);
    if (saveBtn) saveBtn.onclick = function() {
        var n = document.getElementById('addName').value; if (!n) return alert('Nom requis');
        var email = document.getElementById('addEmail').value;
        fetch(API_URL + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: n, email: email, password: '123456', role: type }) }).then(function() { closeModal(); loadPage(currentPage); });
    };
}
function viewDriver(id) {
    var d = driversData.find(function(d) { return d.id === id; }); if (!d) return;
    showModal(d.user ? d.user.name : d.driverCode, '<p><strong>Code:</strong> ' + d.driverCode + '</p><p><strong>Organisation:</strong> ' + (d.organization ? d.organization.name : 'N/A') + '</p><p><strong>Statut:</strong> ' + d.status + '</p>');
}

// ===== MESSAGES =====
async function loadMessages() {
    try {
        var res = await fetch(API_URL + '/messages', { headers: { Authorization: 'Bearer ' + token } });
        var messages = res.ok ? await res.json() : [];
        var html = '';
        messages.forEach(function(m) {
            html += '<tr style="' + (!m.read ? 'background:#FEF3C7;' : '') + '"><td><strong>' + (m.organization ? m.organization.name : 'Admin') + '</strong></td><td>' + m.subject + '</td><td>' + (m.content || '').substring(0, 60) + '</td><td><span class="badge badge-' + (m.type === 'urgent' ? 'danger' : 'info') + '">' + m.type + '</span></td><td style="font-size:11px;">' + new Date(m.createdAt).toLocaleString('fr') + '</td><td class="action-btns">' + (m.reply ? '<span class="badge badge-success">Repondu</span>' : '<button class="btn-sm btn-primary" onclick="replyMessage(\'' + m.id + '\')"><i class="fas fa-reply"></i></button>') + '</td></tr>';
        });
        document.getElementById('messagesTable').innerHTML = html || '<tr><td colspan="6">Aucun message</td></tr>';
    } catch (e) { console.error(e); }
}
function newMessage() {
    var h = '<div class="form-group"><label>Destinataire</label><select id="msgOrg">';
    orgsData.forEach(function(o) { h += '<option value="' + o.id + '">' + o.name + '</option>'; });
    h += '</select></div><div class="form-group"><label>Sujet</label><input id="msgSubject"></div><div class="form-group"><label>Message</label><textarea id="msgContent" rows="4" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></textarea></div>';
    var saveBtn = showModal('Nouveau message', h, true);
    if (saveBtn) saveBtn.onclick = async function() {
        var orgId = document.getElementById('msgOrg').value;
        var subject = document.getElementById('msgSubject').value;
        var content = document.getElementById('msgContent').value;
        if (!subject || !content) return alert('Sujet et message requis');
        await fetch(API_URL + '/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ organizationId: orgId, subject: subject, content: content }) });
        closeModal(); loadMessages();
    };
}
async function replyMessage(id) {
    var reply = prompt('Votre reponse :');
    if (!reply) return;
    await fetch(API_URL + '/messages/' + id + '/reply', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ reply: reply }) });
    loadMessages();
}

// ===== LOGS =====
async function loadLogs() {
    try {
        var res = await fetch(API_URL + '/logs', { headers: { Authorization: 'Bearer ' + token } });
        var logs = res.ok ? await res.json() : [];
        var html = '';
        logs.slice(0, 50).forEach(function(l) { html += '<tr><td>' + new Date(l.createdAt).toLocaleString('fr') + '</td><td>' + (l.userId || 'Systeme') + '</td><td>' + l.action + '</td><td>' + (l.details || '') + '</td></tr>'; });
        document.getElementById('logsTable').innerHTML = html || '<tr><td colspan="4">Aucun log</td></tr>';
    } catch (e) {}
}

// ===== EXPORT =====
function exportCSV(type) {
    var items = type === 'flottes' ? orgsData.filter(function(o) { return o.type === 'FLEET_MANAGER'; }) : orgsData.filter(function(o) { return o.type === 'COOPERATIVE'; });
    var csv = 'Nom,Code,Email,Plan,Statut\n';
    items.forEach(function(o) { csv += '"' + o.name + '","' + o.code + '","' + (o.email || '') + '","' + (o.plan || '') + '","' + o.status + '"\n'; });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = type + '.csv'; a.click();
}

// ===== SETTINGS =====
function getSettingsHTML() {
    return '<div class="topbar"><h1>Parametres</h1></div>
        <div style="display:flex;gap:0;margin-bottom:24px;background:var(--card);border-radius:14px;overflow:hidden;">
            <button class="settings-tab active" onclick="switchSettingsTab("FLOTTE")" style="flex:1;padding:16px;border:none;cursor:pointer;font-weight:600;">Plans Flotte</button>
            <button class="settings-tab" onclick="switchSettingsTab("COOP")" style="flex:1;padding:16px;border:none;cursor:pointer;font-weight:600;">Plans Coop</button>
        </div>
        <div id="plans-content"></div>
        <button onclick="savePlans()" style="width:100%;padding:16px;background:#1A5276;color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;margin-top:24px;"><i class="fas fa-save"></i> Enregistrer</button>';
}

var currentSettingsTab = "FLOTTE";
var plansData = [];

function switchSettingsTab(type) {
    currentSettingsTab = type;
    document.querySelectorAll(".settings-tab").forEach(function(b) { b.classList.remove("active"); });
    event.target.classList.add("active");
    loadPlansForSettings(type);
}

async function loadPlansForSettings(type) {
    try {
        var res = await fetch(API_URL + "/plans");
        plansData = res.ok ? await res.json() : getDefaultPlans();
        var plans = plansData.filter(function(p) { return p.type === type; });
        var html = "<div class="card" style="padding:24px;"><h3>Plans mensuels</h3>";
        plans.forEach(function(p, i) {
            html += "<div style="display:flex;align-items:center;gap:16px;padding:16px;border:1px solid var(--border);border-radius:12px;margin-top:12px;flex-wrap:wrap;">
                <div style="width:100px;font-weight:700;">" + p.name + "</div>
                <div><input type="number" value="" + p.price + "" onchange="updatePlanField(" + i + ",\"price\",this.value)" style="width:80px;padding:8px;border:1px solid var(--border);border-radius:8px;text-align:center;font-weight:700;"> <span>Ar/mois</span></div>
                <div style="display:flex;gap:12px;">
                    <span><input type="number" value="" + p.vehiclesMax + "" onchange="updatePlanField(" + i + ",\"vehiclesMax\",this.value)" style="width:50px;padding:6px;border:1px solid var(--border);border-radius:6px;text-align:center;"> vehicules</span>
                    <span><input type="number" value="" + p.driversMax + "" onchange="updatePlanField(" + i + ",\"driversMax\",this.value)" style="width:50px;padding:6px;border:1px solid var(--border);border-radius:6px;text-align:center;"> chauffeurs</span>
                </div>
                <span class="badge badge-success">Actif</span>
            </div>";
        });
        html += "</div>";
        document.getElementById("plans-content").innerHTML = html;
    } catch (e) { document.getElementById("plans-content").innerHTML = "<p>Erreur de chargement</p>"; }
}

function updatePlanField(index, field, value) {
    var typePlans = plansData.filter(function(p) { return p.type === currentSettingsTab; });
    if (typePlans[index]) typePlans[index][field] = parseInt(value) || 0;
}

function savePlans() {
    fetch(API_URL + "/plans", { method: "PUT", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify({ plans: plansData }) })
        .then(function() { alert("Plans sauvegardes !"); })
        .catch(function() { alert("Erreur lors de la sauvegarde"); });
}

function getDefaultPlans() {
    return [
        { type: "FLEET_MANAGER", name: "Freemium", price: 0, vehiclesMax: 1, driversMax: 1 },
        { type: "FLEET_MANAGER", name: "Basic", price: 15000, vehiclesMax: 5, driversMax: 10 },
        { type: "FLEET_MANAGER", name: "Standard", price: 35000, vehiclesMax: 20, driversMax: 50 },
        { type: "FLEET_MANAGER", name: "Premium", price: 75000, vehiclesMax: 100, driversMax: 200 },
        { type: "COOPERATIVE", name: "Freemium", price: 0, vehiclesMax: 1, driversMax: 2 },
        { type: "COOPERATIVE", name: "Basic", price: 20000, vehiclesMax: 5, driversMax: 15 },
        { type: "COOPERATIVE", name: "Standard", price: 45000, vehiclesMax: 20, driversMax: 60 },
        { type: "COOPERATIVE", name: "Premium", price: 90000, vehiclesMax: 100, driversMax: 300 }
    ];
}

loadPage("settings");
    document.querySelectorAll('.settings-tab').forEach(function(b) { b.classList.remove('active'); });
    event.target.classList.add('active');
    document.getElementById('plans-content').innerHTML = '<p>Plans ' + t + ' - Modification en cours de developpement</p>';
}

// ===== INIT =====
loadPage('dashboard');
