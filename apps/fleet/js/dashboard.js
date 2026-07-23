var API_URL = 'https://dagoos-api.onrender.com/api';
var token = localStorage.getItem('dagoos_token');
var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
var orgData = null;
var driversData = [];
var currentPage = 'dashboard';

if (!token || user.role !== 'FLEET_MANAGER') { window.location.href = 'index.html'; }

document.getElementById('sidebarUser').textContent = '🚛 ' + (user.name || user.email);

function logout() { localStorage.clear(); window.location.href = 'index.html'; }

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
        currentPage = link.dataset.page;
        loadPage(currentPage);
    });
});

function loadPage(page) {
    var main = document.getElementById('mainContent');
    currentPage = page;
    switch(page) {
        case 'dashboard': main.innerHTML = getDashboardHTML(); loadDashboardData(); break;
        case 'drivers': main.innerHTML = getDriversHTML(); loadDrivers(); break;
        case 'vehicles': main.innerHTML = getVehiclesHTML(); break;
        case 'settings': main.innerHTML = getSettingsHTML(); loadOrgInfo(); break;
    }
}

// ===== DASHBOARD =====
function getDashboardHTML() {
    var initials = (user.name || 'F')[0].toUpperCase();
    return '<div class="topbar"><div><h1>👋 Bienvenue, ' + (user.name || '') + '</h1><p style="color:#6C757D;font-size:13px;" id="orgName">Chargement...</p><p id="orgStatus" style="font-size:12px;"></p></div><div class="user-info"><span style="font-size:13px;">' + (user.name || '') + '</span><div class="user-avatar">' + initials + '</div></div></div>' +
        '<div class="stats-grid">' +
            '<div class="stat-card" onclick="loadPage(\'vehicles\')" style="cursor:pointer;"><div class="stat-icon blue"><i class="fas fa-motorcycle"></i></div><div class="stat-info"><div class="number" id="statVehicles">0</div><div class="label">Véhicules</div></div></div>' +
            '<div class="stat-card" onclick="loadPage(\'drivers\')" style="cursor:pointer;"><div class="stat-icon green"><i class="fas fa-users"></i></div><div class="stat-info"><div class="number" id="statDrivers">0</div><div class="label">Chauffeurs</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-route"></i></div><div class="stat-info"><div class="number">0</div><div class="label">Courses aujourd\'hui</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red"><i class="fas fa-dollar-sign"></i></div><div class="stat-info"><div class="number">0 Ar</div><div class="label">Revenus du jour</div></div></div>' +
        '</div>' +
        '<div class="grid-2">' +
            '<button onclick="loadPage(\'vehicles\')" class="action-card" style="background:#1A5276;">' +
                '<i class="fas fa-plus" style="font-size:24px;margin-bottom:8px;"></i>' +
                '<span style="font-weight:600;font-size:16px;">Ajouter un véhicule</span>' +
                '<span style="font-size:12px;opacity:0.8;">🏍️ Moto · 🚗 Voiture · 🚌 Bus</span>' +
            '</button>' +
            '<button onclick="loadPage(\'drivers\')" class="action-card" style="background:#27AE60;">' +
                '<i class="fas fa-users" style="font-size:24px;margin-bottom:8px;"></i>' +
                '<span style="font-weight:600;font-size:16px;">Gérer les chauffeurs</span>' +
                '<span style="font-size:12px;opacity:0.8;">Ajouter, modifier, assigner</span>' +
            '</button>' +
        '</div>' +
        '<div class="card"><div class="card-header"><h3>🛵 Derniers chauffeurs</h3><button class="btn btn-primary btn-sm" onclick="loadPage(\'drivers\')">Voir tout <i class="fas fa-arrow-right"></i></button></div><table><thead><tr><th>Code</th><th>Nom</th><th>Statut</th></tr></thead><tbody id="recentDrivers"><tr><td colspan="3" style="text-align:center;color:#6C757D;">Chargement...</td></tr></tbody></table></div>';
}

function orgCode() {
    var org = JSON.parse(localStorage.getItem('dagoos_org') || '{}');
    return org.code || '';
}

async function loadDashboardData() {
    try {
        var res = await fetch(API_URL + '/organizations', { headers: { Authorization: 'Bearer ' + token } });
        var orgs = res.ok ? await res.json() : [];
        var org = orgs.find(function(o) { return o.email === user.email; });
        if (org) {
            document.getElementById('orgName').textContent = '🏢 ' + org.name;
            var statusHTML = '';
            if (org.status === 'pending') statusHTML = '<span style="background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:50px;font-size:11px;">⏳ En attente de validation</span>';
            else if (org.status === 'active') statusHTML = '<span style="background:#D1FAE5;color:#065F46;padding:2px 8px;border-radius:50px;font-size:11px;">✅ Actif</span>';
            else if (org.status === 'suspended') statusHTML = '<span style="background:#FEE2E2;color:#991B1B;padding:2px 8px;border-radius:50px;font-size:11px;">🚫 Suspendu</span>';
            document.getElementById('orgStatus').innerHTML = statusHTML;
        }
        
        var drvRes = await fetch(API_URL + '/drivers', { headers: { Authorization: 'Bearer ' + token } });
        driversData = drvRes.ok ? await drvRes.json() : [];
        var myDrivers = driversData.filter(function(d) { return d.organization && d.organization.email === user.email; });
        document.getElementById('statDrivers').textContent = myDrivers.length;
        document.getElementById('driverCount').textContent = myDrivers.length;
        document.getElementById('recentDrivers').innerHTML = myDrivers.slice(0, 5).map(function(d) {
            return '<tr><td><code>' + d.driverCode + '</code></td><td>' + (d.user ? d.user.name : 'N/A') + '</td><td><span class="badge ' + (d.status === 'active' ? 'badge-success' : 'badge-warning') + '">' + d.status + '</span></td></tr>';
        }).join('') || '<tr><td colspan="3" style="text-align:center;">Aucun chauffeur</td></tr>';
    } catch (e) { console.error(e); }
}

// ===== DRIVERS =====
function getDriversHTML() {
    return '<div class="topbar"><h1>🛵 Chauffeurs</h1><button class="btn btn-primary" onclick="showAddDriver()"><i class="fas fa-plus"></i> Ajouter un chauffeur</button></div>' +
        '<div class="card"><table><thead><tr><th>Code</th><th>Nom</th><th>Email</th><th>Statut</th></tr></thead><tbody id="driversTable"><tr><td colspan="4">Chargement...</td></tr></tbody></table></div>';
}
async function loadDrivers() {
    var myDrivers = driversData.filter(function(d) { return d.organization d.organization && d.organization.code === orgCode()d.organization && d.organization.code === orgCode() d.organization.email === user.email; });
    document.getElementById('driversTable').innerHTML = myDrivers.length ? myDrivers.map(function(d) {
        return '<tr><td><code>' + d.driverCode + '</code></td><td>' + (d.user ? d.user.name : 'N/A') + '</td><td>' + (d.user ? d.user.email : 'N/A') + '</td><td><span class="badge ' + (d.status === 'active' ? 'badge-success' : 'badge-warning') + '">' + d.status + '</span></td></tr>';
    }).join('') : '<tr><td colspan="4">Aucun chauffeur</td></tr>';
}

// ===== VEHICLES =====
function getVehiclesHTML() {
    return '<div class="topbar"><h1>🏍️ Véhicules</h1><button class="btn btn-primary"><i class="fas fa-plus"></i> Ajouter un véhicule</button></div>' +
        '<div class="card" style="text-align:center;padding:60px;">' +
            '<i class="fas fa-motorcycle" style="font-size:48px;color:#CCC;margin-bottom:16px;"></i>' +
            '<h3 style="color:#6C757D;">Aucun véhicule</h3>' +
            '<p style="color:#AAA;margin-bottom:16px;">Ajoutez votre premier véhicule</p>' +
            '<button class="btn btn-primary"><i class="fas fa-plus"></i> Ajouter un véhicule</button>' +
        '</div>';
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
        var org = orgs.find(function(o) { return o.email === user.email; });
        if (org) {
            document.getElementById('orgInfo').innerHTML = 
                '<div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">' +
                    '<img src="' + (org.logo || 'https://dago-mobility.pages.dev/assets/logo/b-trans.png') + '" style="width:56px;height:56px;border-radius:14px;object-fit:cover;">' +
                    '<div><strong style="font-size:18px;">' + org.name + '</strong><br><span style="color:#6C757D;">Code: ' + org.code + '</span></div>' +
                '</div>' +
                '<p><strong>Plan:</strong> ' + (org.plan || 'Freemium') + '</p>' +
                '<p><strong>Statut:</strong> ' + org.status + '</p>' +
                '<p><strong>Email:</strong> ' + (org.email || 'N/A') + '</p>' +
                '<p><strong>Téléphone:</strong> ' + (org.phone || 'N/A') + '</p>' +
                (org.plan === 'Premium' ? '<p style="color:#F1C40F;margin-top:12px;">🌐 <strong>Page vitrine:</strong> <a href="https://dago-fleet.pages.dev/' + (org.slug || org.code.toLowerCase()) + '" target="_blank">dago-fleet.pages.dev/' + (org.slug || org.code.toLowerCase()) + '</a></p>' : '');
        }
    } catch (e) {}
}

function showAddDriver() {
    var h = '<div class="form-group"><label>Nom</label><input id="addDriverName"></div><div class="form-group"><label>Numéro chauffeur (ex: 003)</label><input id="addDriverNum"></div><div class="form-group"><label>PIN (4 chiffres)</label><input type="password" id="addDriverPin" maxlength="4"></div>';
    showModal('Ajouter un chauffeur', h);
}

loadPage('dashboard');
