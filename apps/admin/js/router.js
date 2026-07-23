// ========================================
// DAGO ADMIN - ROUTER
// ========================================

var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
if (!localStorage.getItem('dagoos_token') || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    window.location.href = 'index.html';
}

document.getElementById('sidebarUser').textContent = '👑 ' + (user.name || user.email);
document.getElementById('sidebarAvatar').textContent = (user.name || 'A')[0].toUpperCase();

function logout() { localStorage.clear(); window.location.href = 'https://dago-mobility.pages.dev'; }

function setTheme(t) {
    document.body.classList.remove('dark');
    document.querySelectorAll('.sidebar-footer .theme-btns button').forEach(function(b) { b.classList.remove('active'); });
    if (t === 'dark') { document.body.classList.add('dark'); document.getElementById('theme-dark').classList.add('active'); }
    else if (t === 'light') { document.getElementById('theme-light').classList.add('active'); }
    else { document.getElementById('theme-system').classList.add('active'); }
    localStorage.setItem('dago_theme', t);
}

function loadPage(page) {
    var main = document.getElementById('mainInner');
    var script = document.createElement('script');
    script.src = 'pages/' + page + '.js';
    script.onload = function() {
        if (typeof window['init_' + page] === 'function') {
            window['init_' + page]();
        }
    };
    document.querySelectorAll('.sidebar-nav a[data-page]').forEach(function(l) { l.classList.remove('active'); });
    var link = document.querySelector('[data-page="' + page + '"]');
    if (link) link.classList.add('active');
    
    // Nettoyer l'ancien script de page
    var oldScript = document.querySelector('script[data-page]');
    if (oldScript) oldScript.remove();
    script.setAttribute('data-page', page);
    main.innerHTML = '<p style="text-align:center;padding:40px;">Chargement...</p>';
    document.body.appendChild(script);
}

document.querySelectorAll('.sidebar-nav a[data-page]').forEach(function(link) {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        loadPage(link.dataset.page);
    });
});

loadPage('home');

// ===== FONCTIONS PARTAGEES =====
function closeModal() { document.getElementById('modalOverlay').classList.remove('show'); }

function showModal(title, content, callback) {
    var html = '<h2>' + title + '</h2>' + content;
    html += callback ? '<div class="btn-row"><button class="btn btn-secondary" onclick="closeModal()">Annuler</button><button class="btn btn-primary" id="modalSaveBtn">Enregistrer</button></div>' : '<div class="btn-row"><button class="btn btn-primary" onclick="closeModal()">Fermer</button></div>';
    document.getElementById('modalContent').innerHTML = html;
    document.getElementById('modalOverlay').classList.add('show');
    if (callback) document.getElementById('modalSaveBtn').onclick = callback;
}

function viewOrg(id) {
    apiGet('/organizations').then(function(orgs) {
        var o = orgs.find(function(x) { return x.id === id; });
        if (!o) return;
        showModal(o.name, '<p><strong>Code:</strong> ' + o.code + '</p><p><strong>Email:</strong> ' + (o.email || 'N/A') + '</p><p><strong>Plan:</strong> ' + (o.plan || 'Freemium') + '</p><p><strong>Statut:</strong> ' + o.status + '</p>');
    });
}

function editOrg(id) {
    apiGet('/organizations').then(function(orgs) {
        var o = orgs.find(function(x) { return x.id === id; });
        if (!o) return;
        var h = '<div class="form-group"><label>Nom</label><input id="editName" value="' + o.name + '"></div>';
        h += '<div class="form-group"><label>Email</label><input id="editEmail" value="' + (o.email || '') + '"></div>';
        h += '<div class="form-group"><label>Plan</label><select id="editPlan">';
        ['Freemium','Basic','Standard','Premium'].forEach(function(p) { h += '<option ' + (o.plan === p ? 'selected' : '') + '>' + p + '</option>'; });
        h += '</select></div>';
        showModal('Modifier ' + o.name, h, function() {
            apiPut('/organizations/' + id, {
                name: document.getElementById('editName').value,
                email: document.getElementById('editEmail').value,
                plan: document.getElementById('editPlan').value
            }).then(function() { closeModal(); loadPage('fleets'); });
        });
    });
}

function addOrg(type) {
    var h = '<div class="form-group"><label>Nom</label><input id="addName"></div><div class="form-group"><label>Email</label><input id="addEmail"></div>';
    showModal('Ajouter ' + (type === 'FLEET_MANAGER' ? 'Flotte' : 'Coopérative'), h, function() {
        var n = document.getElementById('addName').value;
        if (!n) return alert('Nom requis');
        apiPost('/auth/register', { name: n, email: document.getElementById('addEmail').value, password: '123456', role: type }).then(function() {
            closeModal();
            loadPage(type === 'FLEET_MANAGER' ? 'fleets' : 'coops');
        });
    });
}
