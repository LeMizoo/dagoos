// ========================================
// DAGO ADMIN - DASHBOARD v6
// ========================================

const API_URL = 'https://dagoos-api.onrender.com/api';
const LANDING_URL = 'https://dago-mobility.pages.dev';
const LOGIN_URL = 'index.html';

let currentPage = 'dashboard';
let refreshInterval;
let unreadCount = 0;
let orgsData = [], driversData = [], usersData = [];

// ===== AUTH =====
const token = localStorage.getItem('dagoos_token');
const user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
if (!token || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) { window.location.href = LOGIN_URL; }

document.getElementById('sidebarUser').textContent = '👑 ' + (user.name || user.email);
document.getElementById('sidebarAvatar').textContent = (user.name || 'A')[0].toUpperCase();

// ===== UTILS =====
function logout() { localStorage.clear(); window.location.href = LANDING_URL; }

function setTheme(t) {
    document.body.classList.remove('dark');
    document.querySelectorAll('.sidebar-footer .theme-btns button').forEach(b => b.classList.remove('active'));
    if (t === 'dark') { document.body.classList.add('dark'); document.getElementById('theme-dark').classList.add('active'); }
    else if (t === 'light') { document.getElementById('theme-light').classList.add('active'); }
    else { document.getElementById('theme-system').classList.add('active'); }
    localStorage.setItem('dago_theme', t);
}

function showModal(title, content) {
    document.getElementById('modalContent').innerHTML = '<h2>' + title + '</h2>' + content + '<div class="btn-row"><button class="btn btn-primary" onclick="closeModal()">Fermer</button></div>';
    document.getElementById('modalOverlay').classList.add('show');
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('show'); }

function getTableHTML(type, title) {
    var cols = '';
    if (type === 'flottes' || type === 'coops') cols = '<th>Nom</th><th>Code</th><th>Email</th><th>Chauffeurs</th><th>Plan</th><th>Statut</th><th>Actions</th>';
    else if (type === 'drivers') cols = '<th>Code</th><th>Nom</th><th>Organisation</th><th>Statut</th><th>Actions</th>';
    else if (type === 'logs') cols = '<th>Date</th><th>Utilisateur</th><th>Action</th><th>Details</th>';
    else if (type === 'messages') cols = '<th>De</th><th>Sujet</th><th>Message</th><th>Type</th><th>Date</th><th>Actions</th>';
    return '<div class="topbar"><h1>' + title + '</h1><div style="display:flex;gap:8px;">' +
        '<button class="btn btn-sm" style="background:var(--border);" onclick="exportCSV(\'' + type + '\')"><i class="fas fa-download"></i> CSV</button></div></div>' +
        '<div class="card"><table><thead><tr>' + cols + '</tr></thead><tbody id="' + type + 'Table"></tbody></table></div>';
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
        case 'fleets': main.innerHTML = getTableHTML('flottes', 'Flottes'); loadFleets(); break;
        case 'coops': main.innerHTML = getTableHTML('coops', 'Cooperatives'); loadCoops(); break;
        case 'drivers': main.innerHTML = getTableHTML('drivers', 'Chauffeurs'); loadDrivers(); break;
        case 'messages': main.innerHTML = getTableHTML('messages', 'Messages'); loadMessages(); refreshInterval = setInterval(loadMessages, 30000); break;
        case 'logs': main.innerHTML = getTableHTML('logs', 'Logs'); loadLogs(); break;
        case 'payments': main.innerHTML = '<div class="topbar"><h1>Paiements</h1></div><div class="card" style="text-align:center;padding:60px;"><i class="fas fa-credit-card" style="font-size:48px;color:#CCC;"></i><h3 style="color:var(--text2);">Bientot disponible</h3></div>'; break;
        case 'settings': main.innerHTML = getSettingsHTML(); break;
    }
}

// ===== DASHBOARD =====
function getDashboardHTML() {
    return '<div class="topbar"><div><h1>Tableau de bord</h1><p style="color:var(--text2);font-size:13px;" id="currentDate"></p></div>' +
        '<div style="display:flex;align-items:center;gap:12px;"><span id="apiStatus" style="font-size:12px;padding:4px 10px;border-radius:50px;"></span>' +
        '<button onclick="loadDashboardStats()" style="padding:8px;background:var(--border);border:none;border-radius:8px;cursor:pointer;"><i class="fas fa-sync-alt"></i></button>' +
        '<span style="font-size:11px;color:var(--text2);" id="lastRefresh"></span></div></div>' +
        '<div class="stats-grid" id="statsGrid"></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">' +
        '<div class="card"><div class="card-header"><h3>Activites</h3></div><div style="padding:0 18px 14px;max-height:280px;overflow-y:auto;" id="recentActivities"></div></div>' +
        '<div class="card"><div class="card-header"><h3>Inscriptions</h3></div><div style="padding:0 18px 14px;max-height:280px;overflow-y:auto;" id="recentUsers"></div></div></div>';
}

async function loadDashboardStats() {
    var now = new Date();
    var el = function(id) { return document.getElementById(id); };
    if (el('currentDate')) el('currentDate').textContent = now.toLocaleDateString('fr', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (el('lastRefresh')) el('lastRefresh').textContent = 'Mis a jour a ' + now.toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' });
    try {
        var results = await Promise.all([
            fetch(API_URL + '/users', { headers: { Authorization: 'Bearer ' + token } }),
            fetch(API_URL + '/organizations', { headers: { Authorization: 'Bearer ' + token } }),
            fetch(API_URL + '/drivers', { headers: { Authorization: 'Bearer ' + token } })
        ]);
        usersData = results[0].ok ? await results[0].json() : [];
        orgsData = results[1].ok ? await results[1].json() : [];
        driversData = results[2].ok ? await results[2].json() : [];
        var fleets = orgsData.filter(function(o) { return o.type === 'FLEET_MANAGER'; }).length;
        var coops = orgsData.filter(function(o) { return o.type === 'COOPERATIVE'; }).length;
        
        if (el('statsGrid')) el('statsGrid').innerHTML = 
            '<div class="stat-card"><div class="stat-icon blue"><i class="fas fa-dollar-sign"></i></div><div class="stat-info"><div class="stat-number">0 Ar</div><div class="stat-label">Revenus</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon green"><i class="fas fa-shopping-cart"></i></div><div class="stat-info"><div class="stat-number">0</div><div class="stat-label">Courses</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-users"></i></div><div class="stat-info"><div class="stat-number">' + driversData.length + '</div><div class="stat-label">Chauffeurs</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red"><i class="fas fa-building"></i></div><div class="stat-info"><div class="stat-number">' + fleets + ' / ' + coops + '</div><div class="stat-label">Flottes & Coops</div></div></div>';
        
        ['fleetCount','coopCount','driverCount'].forEach(function(id) { var e = el(id); if (e) e.textContent = id === 'driverCount' ? driversData.length : (id === 'fleetCount' ? fleets : coops); });
        if (el('apiStatus')) { el('apiStatus').innerHTML = 'API Online'; el('apiStatus').style.background = '#D1FAE5'; el('apiStatus').style.color = '#065F46'; }
        loadMessagesCount();
    } catch (e) { if (el('apiStatus')) { el('apiStatus').innerHTML = 'API Offline'; el('apiStatus').style.background = '#FEE2E2'; el('apiStatus').style.color = '#991B1B'; } }
}

// ===== FLOTTES / COOPS =====
async function loadFleets() { await loadOrgs('flottes', 'FLEET_MANAGER'); }
async function loadCoops() { await loadOrgs('coops', 'COOPERATIVE'); }

async function loadOrgs(type, orgType) {
    try {
        var results = await Promise.all([
            fetch(API_URL + '/organizations', { headers: { Authorization: 'Bearer ' + token } }),
            fetch(API_URL + '/drivers', { headers: { Authorization: 'Bearer ' + token } })
        ]);
        orgsData = results[0].ok ? await results[0].json() : [];
        driversData = results[1].ok ? await results[1].json() : [];
        var items = orgsData.filter(function(o) { return o.type === orgType; });
        var html = '';
        for (var i = 0; i < items.length; i++) {
            var o = items[i];
            var count = driversData.filter(function(d) { return d.organization && d.organization.code === o.code; }).length;
            html += '<tr><td><img src="' + (o.logo || 'assets/logo/b-trans.png') + '" class="logo-cell" style="vertical-align:middle;margin-right:8px;"><strong>' + o.name + '</strong></td>' +
                '<td><code>' + (orgType === 'FLEET_MANAGER' ? 'FL-' : 'CO-') + o.code + '</code></td><td>' + (o.email || 'N/A') + '</td><td>' + count + '</td>' +
                '<td><span class="badge badge-info">' + (o.plan || 'Freemium') + '</span></td>' +
                '<td><span class="badge ' + (o.status === 'active' ? 'badge-success' : 'badge-danger') + '">' + (o.status || 'actif') + '</span></td>' +
                '<td class="action-btns"><button class="btn-sm btn-view" onclick="viewOrg(\'' + o.id + '\')"><i class="fas fa-eye"></i></button></td></tr>';
        }
        document.getElementById(type + 'Table').innerHTML = html || '<tr><td colspan="7" style="text-align:center;color:var(--text2);">Aucune donnee</td></tr>';
    } catch (e) { console.error(e); }
}

async function loadDrivers() {
    try {
        var res = await fetch(API_URL + '/drivers', { headers: { Authorization: 'Bearer ' + token } });
        driversData = res.ok ? await res.json() : [];
        var html = '';
        for (var i = 0; i < driversData.length; i++) {
            var d = driversData[i];
            html += '<tr><td><code>' + d.driverCode + '</code></td><td><strong>' + (d.user ? d.user.name : 'N/A') + '</strong></td>' +
                '<td>' + (d.organization ? d.organization.name : 'N/A') + '</td>' +
                '<td><span class="badge ' + (d.status === 'active' ? 'badge-success' : 'badge-danger') + '">' + d.status + '</span></td>' +
                '<td class="action-btns"><button class="btn-sm btn-view" onclick="viewDriver(\'' + d.id + '\')"><i class="fas fa-eye"></i></button></td></tr>';
        }
        document.getElementById('driversTable').innerHTML = html || '<tr><td colspan="5" style="text-align:center;color:var(--text2);">Aucun chauffeur</td></tr>';
    } catch (e) { console.error(e); }
}

// ===== MESSAGES =====
async function loadMessagesCount() {
    try {
        var res = await fetch(API_URL + '/messages/unread-count', { headers: { Authorization: 'Bearer ' + token } });
        var data = res.ok ? await res.json() : { count: 0 };
        unreadCount = data.count;
        var badge = document.getElementById('msgCount');
        if (badge) { badge.style.display = unreadCount > 0 ? 'inline' : 'none'; badge.textContent = unreadCount; }
    } catch (e) {}
}

async function loadMessages() {
    try {
        var res = await fetch(API_URL + '/messages', { headers: { Authorization: 'Bearer ' + token } });
        var messages = res.ok ? await res.json() : [];
        var html = '';
        for (var i = 0; i < messages.length; i++) {
            var m = messages[i];
            html += '<tr style="' + (!m.read ? 'background:#FEF3C7;' : '') + '">' +
                '<td><strong>' + (m.organization ? m.organization.name : 'N/A') + '</strong></td>' +
                '<td>' + m.subject + '</td><td>' + (m.content || '').substring(0, 80) + '</td>' +
                '<td><span class="badge badge-' + (m.type === 'urgent' ? 'danger' : 'info') + '">' + m.type + '</span></td>' +
                '<td style="font-size:11px;">' + new Date(m.createdAt).toLocaleString('fr') + '</td>' +
                '<td class="action-btns">' + (!m.replied ? '<button class="btn-sm btn-primary" onclick="replyMessage(\'' + m.id + '\')"><i class="fas fa-reply"></i></button>' : '<span class="badge badge-success">Repondu</span>') + '</td></tr>';
        }
        document.getElementById('messagesTable').innerHTML = html || '<tr><td colspan="6" style="text-align:center;color:var(--text2);">Aucun message</td></tr>';
        loadMessagesCount();
    } catch (e) { console.error(e); }
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
        for (var i = 0; i < logs.length && i < 50; i++) {
            var l = logs[i];
            html += '<tr><td>' + new Date(l.createdAt).toLocaleString('fr') + '</td><td>' + (l.userId || 'Systeme') + '</td><td>' + l.action + '</td><td>' + (l.details || '') + '</td></tr>';
        }
        document.getElementById('logsTable').innerHTML = html || '<tr><td colspan="4" style="text-align:center;color:var(--text2);">Aucun log</td></tr>';
    } catch (e) { document.getElementById('logsTable').innerHTML = '<tr><td colspan="4">Logs bientot disponibles</td></tr>'; }
}

// ===== ACTIONS =====
function viewOrg(id) {
    var org = orgsData.find(function(o) { return o.id === id; }); if (!org) return;
    var drv = driversData.filter(function(d) { return d.organization && d.organization.code === org.code; });
    showModal(org.name, '<p><strong>Code:</strong> ' + org.code + '</p><p><strong>Email:</strong> ' + (org.email || 'N/A') + '</p><p><strong>Plan:</strong> ' + (org.plan || 'Freemium') + '</p><p><strong>Statut:</strong> ' + org.status + '</p><p><strong>Chauffeurs:</strong> ' + drv.length + '</p>');
}
function viewDriver(id) {
    var d = driversData.find(function(d) { return d.id === id; }); if (!d) return;
    showModal(d.user ? d.user.name : d.driverCode, '<p><strong>Code:</strong> ' + d.driverCode + '</p><p><strong>Organisation:</strong> ' + (d.organization ? d.organization.name : 'N/A') + '</p><p><strong>Statut:</strong> ' + d.status + '</p>');
}

// ===== EXPORT =====
function exportCSV(type) {
    var csv = 'Nom,Code,Email,Plan,Statut\n';
    var items = type === 'flottes' ? orgsData.filter(function(o) { return o.type === 'FLEET_MANAGER'; }) : orgsData.filter(function(o) { return o.type === 'COOPERATIVE'; });
    items.forEach(function(o) { csv += '"' + o.name + '","' + o.code + '","' + (o.email || '') + '","' + (o.plan || 'Freemium') + '","' + o.status + '"\n'; });
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = type + '_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
}

// ===== SETTINGS =====
function getSettingsHTML() {
    return '<div class="topbar"><h1>Parametres</h1></div>' +
        '<div style="display:flex;gap:0;margin-bottom:24px;background:var(--card);border-radius:14px;overflow:hidden;">' +
        '<button class="settings-tab active" onclick="switchSettingsTab(\'FLOTTE\')" style="flex:1;padding:16px;border:none;background:transparent;cursor:pointer;font-size:15px;font-weight:600;">Plans Flotte</button>' +
        '<button class="settings-tab" onclick="switchSettingsTab(\'COOP\')" style="flex:1;padding:16px;border:none;background:transparent;cursor:pointer;font-size:15px;font-weight:600;">Plans Coop</button></div>' +
        '<div id="plans-content"></div>' +
        '<button onclick="alert(\'Sauvegarde !\')" style="width:100%;padding:16px;background:#1A5276;color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;margin-top:24px;"><i class="fas fa-save"></i> Enregistrer</button>';
}

function switchSettingsTab(type) {
    document.querySelectorAll('.settings-tab').forEach(function(t) { t.classList.remove('active'); });
    event.target.classList.add('active');
    document.getElementById('plans-content').innerHTML = '<p>Chargement des plans ' + type + '...</p>';
}

// ===== INIT =====
loadPage('dashboard');
