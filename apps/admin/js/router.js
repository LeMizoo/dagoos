// ========================================
// DAGO ADMIN - ROUTER + API
// ========================================

var API_URL = 'https://dagoos-api.onrender.com/api';
var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
var token = localStorage.getItem('dagoos_token');

if (!token || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) { window.location.href = 'index.html'; }

document.getElementById('sidebarUser').textContent = (user.name || user.email);
document.getElementById('sidebarAvatar').textContent = (user.name || 'A')[0].toUpperCase();

function logout() { localStorage.clear(); window.location.href = 'https://dago-mobility.pages.dev'; }
function toggleSidebar() { document.getElementById("sidebar").classList.toggle("open"); document.getElementById("sidebarOverlay").classList.toggle("show"); }

function setTheme(t) {
    document.body.classList.remove('dark');
    document.querySelectorAll('.sidebar-footer .theme-btns button').forEach(function(b) { b.classList.remove('active'); });
    if (t === 'dark') { document.body.classList.add('dark'); document.getElementById('theme-dark').classList.add('active'); }
    else if (t === 'light') { document.getElementById('theme-light').classList.add('active'); }
    else { document.getElementById('theme-system').classList.add('active'); }
    localStorage.setItem('dago_theme', t);
}

// ===== API =====
function apiGet(endpoint) {
    return fetch(API_URL + endpoint, { headers: { Authorization: 'Bearer ' + token } })
        .then(function(r) { if (r.status === 401) { localStorage.clear(); window.location.href = 'index.html'; } return r.json(); });
}
function apiPost(endpoint, data) {
    return fetch(API_URL + endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(data) }).then(function(r) { return r.json(); });
}
function apiPut(endpoint, data) {
    return fetch(API_URL + endpoint, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(data) }).then(function(r) { return r.json(); });
}
function apiPatch(endpoint, data) {
    return fetch(API_URL + endpoint, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(data) }).then(function(r) { return r.json(); });
}

// ===== ROUTER =====
function loadPage(page) {
    var main = document.getElementById('mainInner');
    var script = document.createElement('script');
    script.src = 'pages/' + page + '.js';
    script.onload = function() {
        if (typeof window['init_' + page] === 'function') window['init_' + page]();
    };
    document.querySelectorAll('.sidebar-nav a[data-page]').forEach(function(l) { l.classList.remove('active'); });
    var link = document.querySelector('[data-page="' + page + '"]');
    if (link) link.classList.add('active');
    var oldScript = document.querySelector('script[data-page]');
    if (oldScript) oldScript.remove();
    script.setAttribute('data-page', page);
    main.innerHTML = '<p style="text-align:center;padding:40px;">Chargement...</p>';
    document.body.appendChild(script);
}

document.querySelectorAll('.sidebar-nav a[data-page]').forEach(function(link) {
    link.addEventListener('click', function(e) { e.preventDefault(); loadPage(link.dataset.page); });
});

// ===== MODALS =====
function closeModal() { document.getElementById('modalOverlay').classList.remove('show'); }
function showModal(title, content, callback) {
    var html = '<h2>' + title + '</h2>' + content;
    html += callback ? '<div class="btn-row"><button class="btn btn-secondary" onclick="closeModal()">Annuler</button><button class="btn btn-primary" id="modalSaveBtn">Enregistrer</button></div>' : '<div class="btn-row"><button class="btn btn-primary" onclick="closeModal()">Fermer</button></div>';
    document.getElementById('modalContent').innerHTML = html;
    document.getElementById('modalOverlay').classList.add('show');
    if (callback) document.getElementById('modalSaveBtn').onclick = callback;
}

// ===== ORG ACTIONS =====
function viewOrg(id) {
    apiGet('/organizations').then(function(orgs) {
        var o = orgs.find(function(x) { return x.id === id; }); if (!o) return;
        showModal(o.name, '<p><strong>Code:</strong> ' + o.code + '</p><p><strong>Email:</strong> ' + (o.email || 'N/A') + '</p><p><strong>Plan:</strong> ' + (o.plan || 'Freemium') + '</p><p><strong>Statut:</strong> ' + o.status + '</p>');
    });
}
function editOrg(id) {
    apiGet('/organizations').then(function(orgs) {
        var o = orgs.find(function(x) { return x.id === id; }); if (!o) return;
        var h = '<div class="form-group"><label>Nom</label><input id="editName" value="' + o.name + '"></div>';
        h += '<div class="form-group"><label>Email</label><input id="editEmail" value="' + (o.email || '') + '"></div>';
        h += '<div class="form-group"><label>Plan</label><select id="editPlan">';
        ['Freemium','Basic','Standard','Premium'].forEach(function(p) { h += '<option ' + (o.plan === p ? 'selected' : '') + '>' + p + '</option>'; });
        h += '</select></div>';
        showModal('Modifier ' + o.name, h, function() {
            apiPut('/organizations/' + id, { name: document.getElementById('editName').value, email: document.getElementById('editEmail').value, plan: document.getElementById('editPlan').value }).then(function() { closeModal(); loadPage('fleets'); });
        });
    });
}
function validateOrg(id) { if (confirm('Valider ?')) { apiPatch('/organizations/' + id + '/status', { status: 'active' }).then(function() { loadPage('fleets'); }); } }
function rejectOrg(id) { if (confirm('Refuser ?')) { apiPatch('/organizations/' + id + '/status', { status: 'rejected' }).then(function() { loadPage('fleets'); }); } }
function toggleOrgStatus(id, s) { var ns = s === 'active' ? 'suspended' : 'active'; if (confirm('Changer en ' + ns + ' ?')) { apiPatch('/organizations/' + id + '/status', { status: ns }).then(function() { loadPage('fleets'); }); } }
function addOrg(type) {
    var h = '<div class="form-group"><label>Nom</label><input id="addName"></div><div class="form-group"><label>Email</label><input id="addEmail"></div>';
    showModal('Ajouter ' + (type === 'FLEET_MANAGER' ? 'Flotte' : 'Coop'), h, function() {
        var n = document.getElementById('addName').value; if (!n) return alert('Nom requis');
        apiPost('/auth/register', { name: n, email: document.getElementById('addEmail').value, password: '123456', role: type }).then(function() { closeModal(); loadPage(type === 'FLEET_MANAGER' ? 'fleets' : 'coops'); });
    });
}

// ===== INIT =====
loadPage('home');

function loadPageScript(page) {
    var main = document.getElementById('mainInner');
    main.innerHTML = '<p style="text-align:center;padding:40px;">Chargement...</p>';
    var script = document.createElement('script');
    script.src = 'pages/' + page + '.js';
    script.setAttribute('data-page', page);
    script.onload = function() { if (typeof window['init_' + page.replace(/-/g, '_')] === 'function') window['init_' + page.replace(/-/g, '_')](); };
    document.body.appendChild(script);
}
