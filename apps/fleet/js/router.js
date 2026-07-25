var API_URL = "https://dagoos-api.onrender.com/api";
function apiGet(e) { return fetch(API_URL+e,{headers:{Authorization:"Bearer "+localStorage.getItem("dagoos_token")}}).then(function(r){return r.json()}); }
function apiPost(e,d) { return fetch(API_URL+e,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("dagoos_token")},body:JSON.stringify(d)}).then(function(r){return r.json()}); }
function apiPut(e,d) { return fetch(API_URL+e,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("dagoos_token")},body:JSON.stringify(d)}).then(function(r){return r.json()}); }
function apiPatch(e,d) { return fetch(API_URL+e,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("dagoos_token")},body:JSON.stringify(d)}).then(function(r){return r.json()}); }

var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
if (!localStorage.getItem('dagoos_token') || user.role !== 'FLEET_MANAGER') { window.location.href = 'index.html'; }

document.getElementById('sidebarUser').textContent = '<i class="fas fa-truck"></i> ' + (user.name || user.email);

function logout() { localStorage.clear(); window.location.href = 'index.html'; }

function loadPage(page) {
    var main = document.getElementById('mainContent');
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

loadPage('home');

function closeModal() { document.getElementById('modalOverlay').classList.remove('show'); }
function showModal(title, content, callback) {
    var html = '<h2>' + title + '</h2>' + content;
    html += callback ? '<div class="btn-row"><button class="btn btn-secondary" onclick="closeModal()">Annuler</button><button class="btn btn-primary" id="modalSaveBtn">Enregistrer</button></div>' : '<div class="btn-row"><button class="btn btn-primary" onclick="closeModal()">Fermer</button></div>';
    document.getElementById('modalContent').innerHTML = html;
    document.getElementById('modalOverlay').classList.add('show');
    if (callback) document.getElementById('modalSaveBtn').onclick = callback;
}

function loadPageScript(page) {
    var main = document.getElementById('mainContent');
    main.innerHTML = '<p style="text-align:center;padding:40px;">Chargement...</p>';
    var script = document.createElement('script');
    script.src = 'pages/' + page + '.js';
    script.onload = function() { if (typeof window['init_' + page] === 'function') window['init_' + page](); };
    document.body.appendChild(script);
}
