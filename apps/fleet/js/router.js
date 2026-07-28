var API_URL = DAGOOS_CONFIG.apiUrl;
function apiGet(e) { return fetch(API_URL+e,{headers:{Authorization:"Bearer "+localStorage.getItem("dagoos_token")}}).then(function(r){return r.json()}); }
function apiPost(e,d) { return fetch(API_URL+e,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("dagoos_token")},body:JSON.stringify(d)}).then(function(r){return r.json()}); }
function apiPut(e,d) { return fetch(API_URL+e,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("dagoos_token")},body:JSON.stringify(d)}).then(function(r){return r.json()}); }
function apiPatch(e,d) { return fetch(API_URL+e,{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+localStorage.getItem("dagoos_token")},body:JSON.stringify(d)}).then(function(r){return r.json()}); }

var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
if (!localStorage.getItem('dagoos_token') || user.role !== 'FLEET_MANAGER') { window.location.href = 'index.html'; }

document.getElementById('sidebarUser').textContent = '🚛 ' + (user.name || user.email);
    apiGet("/organizations").then(function(orgs) { var org = orgs.find(function(o) { return o.email === user.email; }); if (org) { document.getElementById("sidebarFleetName").innerHTML = org.name; if (org.logo) { document.getElementById("sidebarLogo").src = org.logo; } } });

function logout() { localStorage.clear(); window.location.replace('index.html'; }

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
    link.addEventListener('click', function(e) { e.preventDefault(); loadPage(link.dataset.page);
            // Fermer le sidebar en mobile
            document.getElementById("sidebar").classList.remove("open");
            document.getElementById("sidebarOverlay").classList.remove("show"); });
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

function showAddVehicle() {
    var h = '<div class="form-group"><label>Immatriculation *</label><input id="addPlate" required></div>';
    h += '<div class="form-group"><label>Marque / Modèle</label><input id="addModel" placeholder="YAMAHA Cygnus"></div>';
    h += '<div class="form-group"><label>Année</label><input type="number" id="addYear" value="2024"></div>';
    h += '<div class="form-group"><label>Couleur</label><input id="addColor"></div>';
    h += '<div class="form-group"><label>Km actuels</label><input type="number" id="addKm" value="0"></div>';
    h += '<div class="form-group"><label>Prochaine vidange (km)</label><input type="number" id="addVidange" value="3000"></div>';
    h += '<div class="form-group"><label>Date fin assurance</label><input type="date" id="addAssurance"></div>';
    showModal('Nouvelle véhicule', h, function() {
        var plate = document.getElementById('addPlate').value;
        if (!plate) return alert('Immatriculation requise');
        apiPost('/vehicles', {
            plate: plate,
            model: document.getElementById('addModel').value,
            year: parseInt(document.getElementById('addYear').value) || 2024,
            color: document.getElementById('addColor').value,
            currentKm: parseInt(document.getElementById('addKm').value) || 0,
            nextMaintenanceKm: parseInt(document.getElementById('addVidange').value) || 3000,
            insuranceDate: document.getElementById('addAssurance').value
        }).then(function() { closeModal(); loadPage('vehicles'); });
    });
}

function editVehicle(id) {
    apiGet('/vehicles').then(function(vehicles) {
        var v = vehicles.find(function(x) { return x.id === id; });
        if (!v) return;
        var h = '<div class="form-group"><label>Km actuels</label><input type="number" id="editKm" value="' + (v.currentKm || 0) + '"></div>';
        h += '<div class="form-group"><label>Prochaine vidange (km)</label><input type="number" id="editVidange" value="' + (v.nextMaintenanceKm || 3000) + '"></div>';
        h += '<div class="form-group"><label>Date fin assurance</label><input type="date" id="editAssurance" value="' + (v.insuranceDate || '') + '"></div>';
        h += '<div class="form-group"><label>Statut</label><select id="editStatus"><option ' + (v.status === 'active' ? 'selected' : '') + '>active</option><option ' + (v.status === 'maintenance' ? 'selected' : '') + '>maintenance</option></select></div>';
        showModal('Modifier ' + v.plate, h, function() {
            apiPut('/vehicles/' + id, {
                currentKm: parseInt(document.getElementById('editKm').value) || 0,
                nextMaintenanceKm: parseInt(document.getElementById('editVidange').value) || 3000,
                insuranceDate: document.getElementById('editAssurance').value,
                status: document.getElementById('editStatus').value
            }).then(function() { closeModal(); loadPage('vehicles'); });
        });
    });
}
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('sidebarOverlay').classList.toggle('show'); }
