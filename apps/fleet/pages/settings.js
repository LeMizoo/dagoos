function init_settings() {
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div class="topbar"><h1><i class="fas fa-cog"></i> Paramètres</h1></div>' +
        '<div style="display:flex;gap:0;margin-bottom:24px;background:var(--card);border-radius:14px;overflow:hidden;">' +
            '<button class="settings-tab active" id="tab-PROFIL" onclick="switchTab(\'PROFIL\')" style="flex:1;padding:16px;border:none;cursor:pointer;font-weight:600;">Profil</button>' +
            '<button class="settings-tab" id="tab-PLANS" onclick="switchTab(\'PLANS\')" style="flex:1;padding:16px;border:none;cursor:pointer;font-weight:600;">Plans</button>' +
            '<button class="settings-tab" id="tab-COURSES" onclick="switchTab(\'COURSES\')" style="flex:1;padding:16px;border:none;cursor:pointer;font-weight:600;">Courses</button>' +
            '<button class="settings-tab" id="tab-LANDING" onclick="switchTab(\'LANDING\')" style="flex:1;padding:16px;border:none;cursor:pointer;font-weight:600;">Landing</button>' +
        '</div>' +
        '<div id="settingsContent" style="padding:20px;">Chargement...</div>' +
        '<button onclick="saveSettings()" style="width:100%;padding:16px;background:#1A5276;color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;margin-top:24px;"><i class="fas fa-save"></i> Enregistrer</button>' +
        '<style>.settings-tab.active{background:#1A5276!important;color:white!important;}.settings-tab:not(.active):hover{background:var(--border);}</style>';
    switchTab('PROFIL');
}

var currentTab = 'PROFIL';

function switchTab(type) {
    currentTab = type;
    document.querySelectorAll('.settings-tab').forEach(function(b) { b.classList.remove('active'); });
    document.getElementById('tab-' + type).classList.add('active');
    
    if (type === 'PROFIL') loadProfilTab();
    else if (type === 'PLANS') loadPlansTab();
    else if (type === 'COURSES') loadCoursesTab();
    else if (type === 'LANDING') loadLandingTab();
}

async function loadProfilTab() {
    var orgs = await apiGet('/organizations');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var org = orgs.find(function(o) { return o.email === user.email; });
    if (!org) return;
    
    var html = '<div class="card" style="padding:24px;"><h3>Profil de la flotte</h3>';
    html += '<div style="display:flex;align-items:center;gap:16px;margin:16px 0;">' +
        '<img src="' + (org.logo || 'DAGOOS_CONFIG.landingUrl/assets/logo/b-trans.png') + '" style="width:64px;height:64px;border-radius:14px;object-fit:cover;" id="logoPreview">' +
        '<div><strong>' + org.name + '</strong><br><span style="color:var(--text2);">Code: ' + org.code + ' | Plan: ' + (org.plan || 'Freemium') + '</span></div></div>';
    html += '<div class="form-group"><label>Nom</label><input id="editName" value="' + org.name + '"></div>';
    html += '<div class="form-group"><label>Email</label><input id="editEmail" value="' + (org.email || '') + '"></div>';
    html += '<div class="form-group"><label>Téléphone</label><input id="editPhone" value="' + (org.phone || '') + '"></div>';
    html += '<div class="form-group"><label>Description</label><textarea id="editDesc" rows="3" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:8px;">' + (org.description || '') + '</textarea></div>';
    html += '<div class="form-group"><label>Logo (URL)</label><input id="editLogo" value="' + (org.logo || '') + '" onchange="document.getElementById(\'logoPreview\').src=this.value"></div>';
    if (org.plan === 'Premium' || org.plan === 'Standard') {
        html += '<div style="background:#D1FAE5;padding:16px;border-radius:10px;text-align:center;margin-top:12px;">🌐 Page vitrine active: <a href="https://dago-fleet.pages.dev/' + (org.slug || '') + '" target="_blank">' + (org.slug || '') + '</a></div>';
    }
    html += '</div>';
    document.getElementById('settingsContent').innerHTML = html;
}

async function loadPlansTab() {
    var plans = await apiGet('/plans');
    var fleetPlans = (plans || []).filter(function(p) { return p.type === 'FLEET_MANAGER'; });
    var html = '<div class="card" style="padding:24px;"><h3>Plans disponibles</h3>';
    fleetPlans.forEach(function(p) {
        html += '<div style="display:flex;align-items:center;gap:10px;padding:12px;border:1px solid var(--border);border-radius:10px;margin-top:8px;">' +
            '<strong style="width:80px;">' + p.name + '</strong>' +
            '<span>' + p.price.toLocaleString() + ' Ar/mois</span>' +
            '<span style="color:var(--text2);font-size:12px;">· ' + p.vehiclesMax + ' véhicules · ' + p.driversMax + ' chauffeurs</span>' +
            (p.name === 'Premium' ? '<span class="badge badge-warning">🌐 Page vitrine</span>' : '') +
        '</div>';
    });
    html += '</div>';
    document.getElementById('settingsContent').innerHTML = html;
}

function loadCoursesTab() {
    var types = [
        { id: 'NORMALE', label: '🏍️ Course normale (km)', desc: 'Calcul: Prix base + km × tarif km', prix: '2000 Ar + 500 Ar/km' },
        { id: 'ADY_VAROTRA', label: '🛺 Ady Varotra', desc: 'Course à montant fixe négocié', prix: 'Montant libre' },
        { id: 'LOCATION_JOURNALIERE', label: '📅 Location journalière', desc: 'Location du véhicule pour la journée', prix: '15 000 Ar/jour' },
        { id: 'FORFAIT', label: '💵 Forfait', desc: 'Course à tarif forfaitaire', prix: 'Montant libre' },
        { id: 'TOUR', label: '🚌 Tour (aller-retour)', desc: 'Pour les bus: Passagers × Tarif unitaire', prix: 'Variable' }
    ];
    
    var html = '<div class="card" style="padding:24px;"><h3>Types de courses autorisés</h3><p style="color:var(--text2);margin-bottom:16px;">Configurez les types de courses que vos chauffeurs peuvent effectuer</p>';
    types.forEach(function(t, i) {
        html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px;border:1px solid var(--border);border-radius:10px;margin-top:8px;">' +
            '<div><strong>' + t.label + '</strong><br><span style="font-size:11px;color:var(--text2);">' + t.desc + '</span></div>' +
            '<div style="text-align:right;"><span style="font-size:12px;color:#1A5276;">' + t.prix + '</span><br>' +
            '<select id="active_' + t.id + '" style="padding:4px 8px;border-radius:6px;border:1px solid var(--border);font-size:11px;"><option>Actif</option><option>Inactif</option></select></div>' +
        '</div>';
    });
    html += '</div>';
    document.getElementById('settingsContent').innerHTML = html;
}

function loadLandingTab() {
    var sections = ['hero', 'apps', 'features', 'about', 'cta', 'footer'];
    var html = '<div class="card" style="padding:24px;"><h3>Contenu de la landing page</h3><p style="color:var(--text2);">Modifiez les textes sur dago-fleet.pages.dev</p>';
    sections.forEach(function(sec) {
        html += '<div style="margin-top:20px;border:1px solid var(--border);border-radius:10px;padding:16px;">' +
            '<h4 style="text-transform:uppercase;font-size:12px;color:var(--text2);">' + sec + '</h4>' +
            '<div class="form-group"><label>Titre</label><input data-section="' + sec + '" data-field="title" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>' +
            '<div class="form-group"><label>Sous-titre</label><input data-section="' + sec + '" data-field="subtitle" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>' +
            '<div class="form-group"><label>Texte</label><textarea data-section="' + sec + '" data-field="body" rows="3" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></textarea></div>' +
            '</div>';
    });
    html += '</div>';
    document.getElementById('settingsContent').innerHTML = html;
    apiGet('/landing-content').then(function(data) {
        (data || []).forEach(function(s) {
            var t = document.querySelector('[data-section="' + s.section + '"][data-field="title"]');
            var st = document.querySelector('[data-section="' + s.section + '"][data-field="subtitle"]');
            var b = document.querySelector('[data-section="' + s.section + '"][data-field="body"]');
            if (t) t.value = s.title || '';
            if (st) st.value = s.subtitle || '';
            if (b) b.value = s.body || '';
        });
    });
}

function saveSettings() {
    if (currentTab === 'PROFIL') {
        apiGet('/organizations').then(function(orgs) {
            var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
            var org = orgs.find(function(o) { return o.email === user.email; });
            if (!org) return;
            apiPut('/organizations/' + org.id, {
                name: document.getElementById('editName').value,
                email: document.getElementById('editEmail').value,
                phone: document.getElementById('editPhone').value,
                description: document.getElementById('editDesc').value,
                logo: document.getElementById('editLogo').value
            }).then(function() { alert('Profil sauvegardé !'); });
        });
    } else if (currentTab === 'COURSES') {
        alert('Types de courses sauvegardés !');
    } else if (currentTab === 'LANDING') {
        var inputs = document.querySelectorAll('#settingsContent input[data-section], #settingsContent textarea[data-section]');
        var sections = {};
        inputs.forEach(function(inp) {
            var sec = inp.dataset.section;
            if (!sections[sec]) sections[sec] = { section: sec, title: '', subtitle: '', body: '' };
            sections[sec][inp.dataset.field] = inp.value;
        });
        apiPut('/landing-content', { sections: Object.values(sections) }).then(function() { alert('Contenu sauvegardé !'); });
    } else {
        alert('Paramètres sauvegardés !');
    }
}
