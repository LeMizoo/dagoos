function init_settings() {
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div class="topbar"><h1>⚙️ Paramètres</h1></div>' +
        '<div style="display:flex;gap:0;margin-bottom:24px;background:var(--card);border-radius:14px;overflow:hidden;">' +
            '<button class="settings-tab active" id="tab-PROFIL" onclick="switchSettingsTab(\'PROFIL\')" style="flex:1;padding:16px;border:none;cursor:pointer;font-weight:600;">Profil</button>' +
            '<button class="settings-tab" id="tab-PLANS" onclick="switchSettingsTab(\'PLANS\')" style="flex:1;padding:16px;border:none;cursor:pointer;font-weight:600;">Plans</button>' +
            '<button class="settings-tab" id="tab-LANDING" onclick="switchSettingsTab(\'LANDING\')" style="flex:1;padding:16px;border:none;cursor:pointer;font-weight:600;">Contenu Landing</button>' +
        '</div>' +
        '<div id="settingsContent" style="padding:20px;">Chargement...</div>' +
        '<button onclick="saveAllSettings()" style="width:100%;padding:16px;background:#1A5276;color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;margin-top:24px;">💾 Enregistrer</button>' +
        '<style>.settings-tab.active{background:#1A5276!important;color:white!important;}.settings-tab:not(.active):hover{background:var(--border);}</style>';
    switchSettingsTab('PROFIL');
}

var currentSettingsTab = 'PROFIL';

function switchSettingsTab(type) {
    currentSettingsTab = type;
    document.querySelectorAll('.settings-tab').forEach(function(b) { b.classList.remove('active'); });
    var tabEl = document.getElementById('tab-' + type);
    if (tabEl) tabEl.classList.add('active');
    
    if (type === 'PROFIL') loadProfilSettings();
    else if (type === 'PLANS') loadPlansSettings();
    else if (type === 'LANDING') loadLandingSettings();
}

// ===== PROFIL =====
async function loadProfilSettings() {
    var orgs = await apiGet('/organizations');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var org = orgs.find(function(o) { return o.email === user.email; });
    if (!org) { document.getElementById('settingsContent').innerHTML = 'Erreur'; return; }
    
    var html = '<div class="card" style="padding:24px;"><h3>Profil de la flotte</h3>';
    html += '<div style="display:flex;align-items:center;gap:16px;margin:16px 0;">' +
        '<img src="' + (org.logo || 'https://dago-mobility.pages.dev/assets/logo/b-trans.png') + '" style="width:64px;height:64px;border-radius:14px;object-fit:cover;" id="logoPreview">' +
        '<div><strong style="font-size:18px;">' + org.name + '</strong><br><span style="color:var(--text2);">Code: ' + org.code + ' | Plan: ' + (org.plan || 'Freemium') + '</span></div></div>';
    html += '<div class="form-group"><label>Nom</label><input id="editName" value="' + org.name + '"></div>';
    html += '<div class="form-group"><label>Email</label><input id="editEmail" value="' + (org.email || '') + '"></div>';
    html += '<div class="form-group"><label>Téléphone</label><input id="editPhone" value="' + (org.phone || '') + '"></div>';
    html += '<div class="form-group"><label>Description</label><textarea id="editDesc" rows="3" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:8px;">' + (org.description || '') + '</textarea></div>';
    html += '<div class="form-group"><label>Logo (URL)</label><input id="editLogo" value="' + (org.logo || '') + '" onchange="document.getElementById(\'logoPreview\').src=this.value"></div>';
    
    // Page vitrine
    if (org.plan === 'Premium' || org.plan === 'Standard') {
        var vitrineUrl = 'https://dago-fleet.pages.dev/' + (org.slug || org.code.toLowerCase());
        html += '<div style="background:#D1FAE5;border-radius:12px;padding:16px;margin-top:16px;text-align:center;">' +
            '<p style="font-size:20px;">🌐</p><h4>Page vitrine active</h4>' +
            '<a href="' + vitrineUrl + '" target="_blank" style="color:#1A5276;font-weight:600;">' + vitrineUrl + '</a></div>';
    } else {
html += '<div style="background:#FEF3C7;border-radius:12px;padding:16px;margin-top:16px;text-align:center;"><p>🔒 Page vitrine disponible en Standard ou Premium</p><button class="btn btn-primary" onclick="switchSettingsTab(\'LANDING\')">Créer ma page vitrine</button></div>';
    }
    html += '</div>';
    document.getElementById('settingsContent').innerHTML = html;
}

// ===== PLANS =====
async function loadPlansSettings() {
    try {
        var plans = await apiGet('/plans');
        var fleetPlans = (plans || []).filter(function(p) { return p.type === 'FLEET_MANAGER'; });
        var html = '<div class="card" style="padding:24px;"><h3>Plans disponibles</h3>';
        fleetPlans.forEach(function(p) {
            html += '<div style="display:flex;align-items:center;gap:10px;padding:12px;border:1px solid var(--border);border-radius:10px;margin-top:8px;">' +
                '<strong style="width:80px;">' + p.name + '</strong>' +
                '<span>' + p.price.toLocaleString() + ' Ar/mois</span>' +
                '<span style="color:var(--text2);font-size:12px;">· ' + p.vehiclesMax + ' véhicules · ' + p.driversMax + ' chauffeurs</span>' +
                (p.name === 'Premium' ? '<span class="badge badge-warning">🌐 Page vitrine incluse</span>' : '') +
                '</div>';
        });
        html += '</div>';
        document.getElementById('settingsContent').innerHTML = html;
    } catch(e) { document.getElementById('settingsContent').innerHTML = '<p>Erreur</p>'; }
}

// ===== LANDING EDITOR =====
function loadLandingSettings() {
    var sections = ['hero', 'apps', 'features', 'about', 'cta', 'footer'];
    var html = '<div class="card" style="padding:24px;"><h3>Contenu de la landing page</h3><p style="color:var(--text2);">Modifiez les textes sur dago-fleet.pages.dev</p>';
    sections.forEach(function(sec) {
        html += '<div style="margin-top:20px;border:1px solid var(--border);border-radius:10px;padding:16px;">' +
            '<h4 style="text-transform:uppercase;font-size:12px;color:var(--text2);margin-bottom:10px;">' + sec + '</h4>' +
            '<div class="form-group"><label>Titre</label><input data-section="' + sec + '" data-field="title" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>' +
            '<div class="form-group"><label>Sous-titre</label><input data-section="' + sec + '" data-field="subtitle" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>' +
            '<div class="form-group"><label>Texte</label><textarea data-section="' + sec + '" data-field="body" rows="3" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></textarea></div>' +
            '</div>';
    });
    html += '</div>';
    document.getElementById('settingsContent').innerHTML = html;
    loadLandingContent();
}

async function loadLandingContent() {
    try {
        var data = await apiGet('/landing-content');
        (data || []).forEach(function(s) {
            var titleEl = document.querySelector('[data-section="' + s.section + '"][data-field="title"]');
            var subtitleEl = document.querySelector('[data-section="' + s.section + '"][data-field="subtitle"]');
            var bodyEl = document.querySelector('[data-section="' + s.section + '"][data-field="body"]');
            if (titleEl) titleEl.value = s.title || '';
            if (subtitleEl) subtitleEl.value = s.subtitle || '';
            if (bodyEl) bodyEl.value = s.body || '';
        });
    } catch(e) {}
}

function saveAllSettings() {
    if (currentSettingsTab === 'PROFIL') {
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
            }).then(function() { alert('Profil sauvegardé !'); loadProfilSettings(); });
        });
    } else if (currentSettingsTab === 'LANDING') {
        var inputs = document.querySelectorAll('#settingsContent input[data-section], #settingsContent textarea[data-section]');
        var sectionMap = {};
        inputs.forEach(function(inp) {
            var sec = inp.dataset.section;
            if (!sectionMap[sec]) sectionMap[sec] = { section: sec, title: '', subtitle: '', body: '' };
            sectionMap[sec][inp.dataset.field] = inp.value;
        });
        var sections = Object.values(sectionMap);
        apiPut('/landing-content', { sections: sections }).then(function() { alert('Contenu sauvegardé !'); });
    } else {
        alert('Paramètres sauvegardés !');
    }
}
