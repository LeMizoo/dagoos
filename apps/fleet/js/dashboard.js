var API_URL = 'https://dagoos-api.onrender.com/api';
var token = localStorage.getItem('dagoos_token');
var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
var driversData = [];
var orgData = null;
var currentPage = 'dashboard';

if (!token || user.role !== 'FLEET_MANAGER') { window.location.href = 'index.html'; }

document.getElementById('sidebarUser').textContent = '🚛 ' + (user.name || user.email);

function logout() { localStorage.clear(); window.location.href = 'index.html'; }
function closeModal() { document.getElementById('modalOverlay').classList.remove('show'); }
function showModal(title, content, hasSave) {
    var btnRow = hasSave ? '<div class="btn-row"><button class="btn btn-secondary" onclick="closeModal()">Annuler</button><button class="btn btn-primary" id="modalSaveBtn">Enregistrer</button></div>' : '<div class="btn-row"><button class="btn btn-primary" onclick="closeModal()">Fermer</button></div>';
    document.getElementById('modalContent').innerHTML = '<h2>' + title + '</h2>' + content + btnRow;
    document.getElementById('modalOverlay').classList.add('show');
    return document.getElementById('modalSaveBtn');
}

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
    if (page === 'dashboard') { main.innerHTML = getDashboardHTML(); loadDashboardData(); }
    else if (page === 'drivers') { main.innerHTML = getDriversHTML(); loadDrivers(); }
    else if (page === 'vehicles') { main.innerHTML = getVehiclesHTML(); }
    else if (page === 'settings') { main.innerHTML = getSettingsHTML(); loadSettingsData(); }
}

// ===== DASHBOARD =====
function getDashboardHTML() {
    return '<div class="topbar"><div><h1>👋 Bienvenue, ' + (user.name || '') + '</h1><p style="color:#6C757D;" id="orgName">Chargement...</p></div><div class="user-info"><div class="user-avatar">' + (user.name || 'F')[0].toUpperCase() + '</div></div></div>' +
        '<div class="stats-grid">' +
            '<div class="stat-card"><div class="stat-icon blue"><i class="fas fa-motorcycle"></i></div><div class="stat-info"><div class="number">0</div><div class="label">Véhicules</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon green"><i class="fas fa-users"></i></div><div class="stat-info"><div class="number" id="statDrivers">0</div><div class="label">Chauffeurs</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-route"></i></div><div class="stat-info"><div class="number">0</div><div class="label">Courses</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon red"><i class="fas fa-dollar-sign"></i></div><div class="stat-info"><div class="number">0 Ar</div><div class="label">Revenus</div></div></div>' +
        '</div>' +
        '<div class="grid-2">' +
            '<button onclick="loadPage(\'vehicles\')" class="action-card" style="background:#1A5276;"><i class="fas fa-plus" style="font-size:24px;margin-bottom:8px;"></i><span style="font-weight:600;">Ajouter un véhicule</span></button>' +
            '<button onclick="loadPage(\'drivers\')" class="action-card" style="background:#27AE60;"><i class="fas fa-users" style="font-size:24px;margin-bottom:8px;"></i><span style="font-weight:600;">Gérer les chauffeurs</span></button>' +
        '</div>' +
        '<div class="card"><div class="card-header"><h3>🛵 Derniers chauffeurs</h3></div><table><tbody id="recentDrivers"><tr><td colspan="3">Chargement...</td></tr></tbody></table></div>';
}

async function loadDashboardData() {
    try {
        var res = await fetch(API_URL + '/organizations', { headers: { Authorization: 'Bearer ' + token } });
        var orgs = res.ok ? await res.json() : [];
        orgData = orgs.find(function(o) { return o.email === user.email; }) || null;
        if (orgData) document.getElementById('orgName').textContent = '🏢 ' + orgData.name;
        var drvRes = await fetch(API_URL + '/drivers', { headers: { Authorization: 'Bearer ' + token } });
        driversData = drvRes.ok ? await drvRes.json() : [];
        var myDrivers = driversData.filter(function(d) { return d.organization && d.organization.email === user.email; });
        document.getElementById('statDrivers').textContent = myDrivers.length;
        document.getElementById('driverCount').textContent = myDrivers.length;
        document.getElementById('recentDrivers').innerHTML = myDrivers.slice(0, 5).map(function(d) {
            return '<tr><td><code>' + d.driverCode + '</code></td><td>' + (d.user ? d.user.name : 'N/A') + '</td><td>' + d.status + '</td></tr>';
        }).join('') || '<tr><td colspan="3">Aucun chauffeur</td></tr>';
    } catch (e) { console.error(e); }
}

// ===== DRIVERS =====
function getDriversHTML() {
    return '<div class="topbar"><h1>🛵 Chauffeurs</h1><button class="btn btn-primary" onclick="showAddDriver()"><i class="fas fa-plus"></i> Ajouter</button></div><div class="card"><table><thead><tr><th>Code</th><th>Nom</th><th>Statut</th></tr></thead><tbody id="driversTable"></tbody></table></div>';
}
function loadDrivers() {
    var myDrivers = driversData.filter(function(d) { return d.organization && d.organization.email === user.email; });
    document.getElementById('driversTable').innerHTML = myDrivers.length ? myDrivers.map(function(d) {
        return '<tr><td><code>' + d.driverCode + '</code></td><td>' + (d.user ? d.user.name : 'N/A') + '</td><td>' + d.status + '</td></tr>';
    }).join('') : '<tr><td colspan="3">Aucun chauffeur</td></tr>';
}
function showAddDriver() {
    if (!orgData) return alert('Organisation non trouvée');
    var prefix = orgData.type === 'COOPERATIVE' ? 'CO-' : 'FL-';
    var h = '<div class="form-group"><label>Nom</label><input id="addDriverName"></div>';
    h += '<div class="form-group"><label>Numéro chauffeur</label><input id="addDriverNum" placeholder="ex: 003"></div>';
    h += '<div class="form-group"><label>PIN (4 chiffres)</label><input type="password" id="addDriverPin" maxlength="4"></div>';
    h += '<p style="font-size:11px;color:#6C757D;">Code complet : <strong>' + prefix + orgData.code + '</strong> + numéro</p>';
    var saveBtn = showModal('Ajouter un chauffeur', h, true);
    if (saveBtn) saveBtn.onclick = function() {
        var name = document.getElementById('addDriverName').value;
        var num = document.getElementById('addDriverNum').value;
        var pin = document.getElementById('addDriverPin').value;
        if (!name || !num || pin.length !== 4) return alert('Tous les champs requis');
        var code = prefix + orgData.code + num;
        fetch(API_URL + '/drivers', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ name: name, driverCode: code, pin: pin, organizationId: orgData.id }) }).then(function(r) { return r.json(); }).then(function() { closeModal(); loadDashboardData(); }).catch(function(e) { alert('Erreur'); });
    };
}

// ===== VEHICLES =====
function getVehiclesHTML() {
    return '<div class="topbar"><h1>🏍️ Véhicules</h1><button class="btn btn-primary"><i class="fas fa-plus"></i> Ajouter</button></div><div class="card" style="text-align:center;padding:60px;"><i class="fas fa-motorcycle" style="font-size:48px;color:#CCC;"></i><h3>Aucun véhicule</h3></div>';
}

// ===== SETTINGS =====
function getSettingsHTML() {
    return '<div class="topbar"><h1>⚙️ Paramètres</h1></div>' +
        '<div class="card" style="padding:24px;margin-bottom:20px;">' +
            '<h3 style="margin-bottom:16px;">🏢 Profil de la flotte</h3>' +
            '<div id="orgInfo">Chargement...</div>' +
        '</div>' +
        '<div class="card" style="padding:24px;">' +
            '<h3 style="margin-bottom:16px;">🌐 Page vitrine</h3>' +
            '<div id="vitrineInfo">Chargement...</div>' +
        '</div>';
}

async function loadSettingsData() {
    try {
        var res = await fetch(API_URL + '/organizations', { headers: { Authorization: 'Bearer ' + token } });
        var orgs = res.ok ? await res.json() : [];
        orgData = orgs.find(function(o) { return o.email === user.email; }) || null;
        
        if (!orgData) { document.getElementById('orgInfo').innerHTML = 'Erreur'; return; }
        
        // Profil
        document.getElementById('orgInfo').innerHTML = 
            '<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">' +
                '<img src="' + (orgData.logo || 'https://dago-mobility.pages.dev/assets/logo/b-trans.png') + '" style="width:64px;height:64px;border-radius:14px;object-fit:cover;">' +
                '<div><strong style="font-size:18px;">' + orgData.name + '</strong><br><span style="color:#6C757D;">Code: ' + orgData.code + ' | Plan: ' + (orgData.plan || 'Freemium') + '</span></div>' +
            '</div>' +
            '<div class="form-group"><label>Nom</label><input id="editName" value="' + orgData.name + '"></div>' +
            '<div class="form-group"><label>Email</label><input id="editEmail" value="' + (orgData.email || '') + '"></div>' +
            '<div class="form-group"><label>Téléphone</label><input id="editPhone" value="' + (orgData.phone || '') + '"></div>' +
            '<div class="form-group"><label>Description</label><textarea id="editDesc" rows="3" style="width:100%;padding:8px;border:1px solid #E9ECEF;border-radius:8px;font-family:Inter,sans-serif;">' + (orgData.description || '') + '</textarea></div>' +
            '<button class="btn btn-primary" onclick="saveProfile()"><i class="fas fa-save"></i> Enregistrer</button>';
        
        // Page vitrine
        var vitrineHTML = '';
        if (orgData.plan === 'Premium' || orgData.plan === 'Standard') {
            var vitrineUrl = 'https://dago-fleet.pages.dev/' + (orgData.slug || orgData.code.toLowerCase());
            vitrineHTML = 
                '<div style="background:#F1F5F9;border-radius:12px;padding:20px;text-align:center;">' +
                    '<p style="font-size:24px;margin-bottom:8px;">🌐</p>' +
                    '<h4>Votre page vitrine est active !</h4>' +
                    '<p style="color:#6C757D;margin:8px 0;">Partagez ce lien avec vos clients :</p>' +
                    '<a href="' + vitrineUrl + '" target="_blank" style="display:inline-block;background:#1A5276;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;margin:8px 0;">' + vitrineUrl + ' <i class="fas fa-external-link-alt"></i></a>' +
                    '<p style="font-size:11px;color:#6C757D;margin-top:8px;">Modifiez votre logo et description ci-dessus pour personnaliser votre page.</p>' +
                '</div>';
        } else {
            vitrineHTML = 
                '<div style="background:#FEF3C7;border-radius:12px;padding:20px;text-align:center;">' +
                    '<p style="font-size:24px;margin-bottom:8px;">🔒</p>' +
                    '<h4>Page vitrine disponible en Premium</h4>' +
                    '<p style="color:#92400E;margin:8px 0;">Passez au plan Standard ou Premium pour obtenir votre page vitrine personnalisée.</p>' +
                    '<p style="font-size:11px;color:#6C757D;">Contactez votre administrateur pour upgrader votre plan.</p>' +
                '</div>';
        }
        document.getElementById('vitrineInfo').innerHTML = vitrineHTML;
    } catch (e) { console.error(e); }
}

function saveProfile() {
    if (!orgData) return;
    var data = {
        name: document.getElementById('editName').value,
        email: document.getElementById('editEmail').value,
        phone: document.getElementById('editPhone').value,
        description: document.getElementById('editDesc').value
    };
    fetch(API_URL + '/organizations/' + orgData.id, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(data) }).then(function() { alert('✅ Profil mis à jour !'); loadSettingsData(); });
}

loadPage('dashboard');
