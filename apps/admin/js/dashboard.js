// ========================================
// DAGO ADMIN - DASHBOARD FINAL
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

document.getElementById('sidebarUser').textContent = '<i class="fas fa-crown"></i> ' + (user.name || user.email);
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

function closeModal() { document.getElementById('modalOverlay').classList.remove('show'); }

function showModal(title, content, callback) {
    var html = '<h2>' + title + '</h2>' + content;
    if (callback) {
        html += '<div class="btn-row"><button class="btn btn-secondary" onclick="closeModal()">Annuler</button><button class="btn btn-primary" id="modalSaveBtn">Enregistrer</button></div>';
    } else {
        html += '<div class="btn-row"><button class="btn btn-primary" onclick="closeModal()">Fermer</button></div>';
    }
    document.getElementById('modalContent').innerHTML = html;
    document.getElementById('modalOverlay').classList.add('show');
    if (callback) {
        document.getElementById('modalSaveBtn').onclick = function() {
            callback();
        };
    }
}

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
                actions += '<button class="btn-sm btn-success" onclick="validateOrg(\'' + o.id + '\')"><i class="fas fa-check"></i></button>';
                actions += '<button class="btn-sm btn-suspend" onclick="rejectOrg(\'' + o.id + '\')"><i class="fas fa-times"></i></button>';
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

// ===== EDIT ORG =====
function editOrg(id) {
    var o = orgsData.find(function(x) { return x.id === id; }); if (!o) return;
    var h = '<div class="form-group"><label>Nom</label><input id="editName" value="' + o.name + '"></div>';
    h += '<div class="form-group"><label>Email</label><input id="editEmail" value="' + (o.email || '') + '"></div>';
    h += '<div class="form-group"><label>Plan</label><select id="editPlan">';
    ['Freemium','Basic','Standard','Premium'].forEach(function(p) { h += '<option ' + (o.plan === p ? 'selected' : '') + '>' + p + '</option>'; });
    h += '</select></div>';
    showModal('Modifier ' + o.name, h, function() {
        fetch(API_URL + '/organizations/' + id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
            body: JSON.stringify({ name: document.getElementById('editName').value, email: document.getElementById('editEmail').value, plan: document.getElementById('editPlan').value })
        }).then(function() { closeModal(); loadPage(currentPage); });
    });
}

function viewOrg(id) { var o = orgsData.find(function(x) { return x.id === id; }); if (!o) return; showModal(o.name, '<p><strong>Code:</strong> ' + o.code + '</p><p><strong>Email:</strong> ' + (o.email || 'N/A') + '</p><p><strong>Plan:</strong> ' + (o.plan || 'Freemium') + '</p><p><strong>Statut:</strong> ' + o.status + '</p>'); }
function validateOrg(id) { if (confirm('Valider ?')) { fetch(API_URL + '/organizations/' + id + '/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ status: 'active' }) }).then(function() { loadPage(currentPage); }); } }
function rejectOrg(id) { if (confirm('Refuser ?')) { fetch(API_URL + '/organizations/' + id + '/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ status: 'rejected' }) }).then(function() { loadPage(currentPage); }); } }
function toggleOrgStatus(id, s) { var ns = s === 'active' ? 'suspended' : 'active'; if (confirm('Changer en ' + ns + ' ?')) { fetch(API_URL + '/organizations/' + id + '/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ status: ns }) }).then(function() { loadPage(currentPage); }); } }

// ===== EXPORT =====
function exportCSV(type) { var items = type === 'flottes' ? orgsData.filter(function(o) { return o.type === 'FLEET_MANAGER'; }) : orgsData.filter(function(o) { return o.type === 'COOPERATIVE'; }); var csv = 'Nom,Code,Email,Plan,Statut\n'; items.forEach(function(o) { csv += '"' + o.name + '","' + o.code + '","' + (o.email || '') + '","' + (o.plan || '') + '","' + o.status + '"\n'; }); var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })); a.download = type + '.csv'; a.click(); }

// ===== INIT =====
loadPage('dashboard');
