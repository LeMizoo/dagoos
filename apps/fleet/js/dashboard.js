var API_URL = 'https://dagoos-api.onrender.com/api';
var LANDING_URL = 'https://dago-mobility.pages.dev';
var token = localStorage.getItem('dagoos_token');
var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
var orgData = null;
var driversData = [];

if (!token || user.role !== 'FLEET_MANAGER') { window.location.href = 'index.html'; }

document.getElementById('sidebarUser').textContent = '🚛 ' + (user.name || user.email);

function logout() { localStorage.clear(); window.location.href = LANDING_URL; }

function showModal(title, content) {
    document.getElementById('modalContent').innerHTML = '<h2>' + title + '</h2>' + content + '<div class="btn-row"><button class="btn btn-secondary" onclick="closeModal()">Fermer</button></div>';
    document.getElementById('modalOverlay').classList.add('show');
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('show'); }

// ===== NAVIGATION =====
document.querySelectorAll('.sidebar-nav a[data-page]').forEach(function(link) {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.sidebar-nav a').forEach(function(l) { l.classList.remove('active'); });
        link.classList.add('active');
        loadPage(link.dataset.page);
    });
});

function loadPage(page) {
    var main = document.getElementById('mainContent');
    switch(page) {
        case 'dashboard': main.innerHTML = getDashboardHTML(); loadStats(); break;
        case 'drivers': main.innerHTML = getDriversHTML(); loadDrivers(); break;
        case 'vehicles': main.innerHTML = '<div class="topbar"><h1>🏍️ Véhicules</h1></div><div class="card" style="text-align:center;padding:60px;">🚗 Gestion des véhicules - Bientôt disponible</div>'; break;
        case 'messages': main.innerHTML = '<div class="topbar"><h1>💬 Messages</h1></div><div class="card" style="text-align:center;padding:60px;">📨 Messagerie - Bientôt disponible</div>'; break;
        case 'settings': main.innerHTML = getSettingsHTML(); loadOrgInfo(); break;
    }
}

// ===== DASHBOARD =====
function getDashboardHTML() {
    return '<div class="topbar"><div><h1>📊 Tableau de bord</h1><p style="color:#6C757D;font-size:13px;">Bienvenue, ' + (user.name || '') + '</p></div><div class="user-info"><span style="font-size:13px;">' + (user.name || '') + '</span><div class="user-avatar">' + (user.name || 'F')[0].toUpperCase() + '</div></div></div>' +
        '<div class="stats-grid">' +
            '<div class="stat-card"><div class="stat-icon blue"><i class="fas fa-users"></i></div><div class="stat-info"><div class="number" id="statDrivers">0</div><div class="label">Chauffeurs</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon green"><i class="fas fa-motorcycle"></i></div><div class="stat-info"><div class="number">0</div><div class="label">Véhicules</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-route"></i></div><div class="stat-info"><div class="number">0</div><div class="label">Courses aujourd\'hui</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red"><i class="fas fa-dollar-sign"></i></div><div class="stat-info"><div class="number">0 Ar</div><div class="label">Revenus du jour</div></div></div>' +
        '</div>' +
        '<div class="card"><div class="card-header"><h3>🛵 Derniers chauffeurs</h3><button class="btn btn-primary btn-sm" onclick="loadPage(\'drivers\')">Voir tout</button></div><table><thead><tr><th>Code</th><th>Nom</th><th>Statut</th></tr></thead><tbody id="recentDrivers"><tr><td colspan="3" style="text-align:center;color:#6C757D;">Chargement...</td></tr></tbody></table></div>';
}

async function loadStats() {
    try {
        var res = await fetch(API_URL + '/drivers', { headers: { Authorization: 'Bearer ' + token } });
        driversData = res.ok ? await res.json() : [];
        // Filtrer par organisation (via le code)
        var myDrivers = driversData.filter(function(d) { return d.organization && d.organization.code === orgCode(); });
        document.getElementById('statDrivers').textContent = myDrivers.length;
        document.getElementById('driverCount').textContent = myDrivers.length;
        document.getElementById('recentDrivers').innerHTML = myDrivers.slice(0, 5).map(function(d) {
            return '<tr><td><code>' + d.driverCode + '</code></td><td>' + (d.user ? d.user.name : 'N/A') + '</td><td><span class="badge ' + (d.status === 'active' ? 'badge-success' : 'badge-warning') + '">' + d.status + '</span></td></tr>';
        }).join('') || '<tr><td colspan="3" style="text-align:center;">Aucun chauffeur</td></tr>';
    } catch (e) { console.error(e); }
}

function orgCode() {
    var org = JSON.parse(localStorage.getItem('dagoos_org') || '{}');
    return org.code || '';
}

// ===== DRIVERS =====
function getDriversHTML() {
    return '<div class="topbar"><h1>🛵 Chauffeurs</h1><button class="btn btn-primary" onclick="showAddDriver()"><i class="fas fa-plus"></i> Ajouter un chauffeur</button></div>' +
        '<div class="card"><table><thead><tr><th>Code</th><th>Nom</th><th>Email</th><th>Statut</th></tr></thead><tbody id="driversTable"><tr><td colspan="4">Chargement...</td></tr></tbody></table></div>';
}

async function loadDrivers() {
    var myDrivers = driversData.filter(function(d) { return d.organization && d.organization.code === orgCode(); });
    document.getElementById('driversTable').innerHTML = myDrivers.length ? myDrivers.map(function(d) {
        return '<tr><td><code>' + d.driverCode + '</code></td><td>' + (d.user ? d.user.name : 'N/A') + '</td><td>' + (d.user ? d.user.email : 'N/A') + '</td><td><span class="badge ' + (d.status === 'active' ? 'badge-success' : 'badge-warning') + '">' + d.status + '</span></td></tr>';
    }).join('') : '<tr><td colspan="4">Aucun chauffeur</td></tr>';
}

function showAddDriver() {
    var h = '<div class="form-group"><label>Nom</label><input id="addDriverName"></div><div class="form-group"><label>Numéro chauffeur</label><input id="addDriverNum" placeholder="ex: 003"></div><div class="form-group"><label>PIN (4 chiffres)</label><input type="password" id="addDriverPin" maxlength="4"></div>';
    showModal('Ajouter un chauffeur', h);
}

// ===== SETTINGS =====
function getSettingsHTML() {
    return '<div class="topbar"><h1>⚙️ Paramètres</h1></div>' +
        '<div class="card" style="padding:24px;"><h3>Profil de la flotte</h3><div id="orgInfo">Chargement...</div></div>';
}

async function loadOrgInfo() {
    try {
        var res = await fetch(API_URL + '/organizations', { headers: { Authorization: 'Bearer ' + token } });
        var orgs = res.ok ? await res.json() : [];
        var org = orgs.find(function(o) { return o.code === orgCode(); });
        if (org) {
            document.getElementById('orgInfo').innerHTML = 
                '<p><strong>Nom:</strong> ' + org.name + '</p>' +
                '<p><strong>Code:</strong> ' + org.code + '</p>' +
                '<p><strong>Plan:</strong> ' + (org.plan || 'Freemium') + '</p>' +
                '<p><strong>Statut:</strong> ' + org.status + '</p>' +
                (org.plan === 'Premium' ? '<p style="color:#F1C40F;">🌐 <strong>Page vitrine:</strong> <a href="https://dago-fleet.pages.dev/' + (org.slug || org.code.toLowerCase()) + '" target="_blank">dago-fleet.pages.dev/' + (org.slug || org.code.toLowerCase()) + '</a></p>' : '');
        }
    } catch (e) {}
}

loadPage('dashboard');
