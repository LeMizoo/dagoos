function init_settings() {
    var main = document.getElementById('mainInner');
    main.innerHTML = '<div class="topbar"><h1><i class="fas fa-cog"></i> Parametres</h1></div>' +
        '<div style="display:flex;gap:0;margin-bottom:24px;background:var(--card);border-radius:14px;overflow:hidden;">' +
            '<button class="settings-tab active" id="tab-FLOTTE" onclick="switchSettingsTab(\'FLOTTE\')" style="flex:1;padding:16px;border:none;cursor:pointer;font-weight:600;">Plans Flotte</button>' +
            '<button class="settings-tab" id="tab-COOP" onclick="switchSettingsTab(\'COOP\')" style="flex:1;padding:16px;border:none;cursor:pointer;font-weight:600;">Plans Coop</button>' +
            '<button class="settings-tab" id="tab-LANDING" onclick="switchSettingsTab(\'LANDING\')" style="flex:1;padding:16px;border:none;cursor:pointer;font-weight:600;">Contenu Landing</button>' +
        '</div>' +
        '<div id="settingsContent" style="padding:20px;">Chargement...</div>' +
        '<button onclick="saveSettings()" style="width:100%;padding:16px;background:#1A5276;color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;margin-top:24px;"><i class="fas fa-save"></i> Enregistrer</button>' +
        '<div class="card" style="padding:24px;margin-top:24px;"><h3>General</h3>' +
            '<div style="margin-top:16px;"><label>Monnaie</label><select id="monnaie" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;"><option>Ar (Ariary)</option><option>EUR</option><option>USD</option></select></div>' +
            '<div style="margin-top:16px;"><label>Langue</label><select id="langue" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;"><option>Francais</option><option>Malagasy</option><option>English</option></select></div>' +
        '</div>';
    loadSettingsTab('FLOTTE');
}

var currentSettingsTab = 'FLOTTE';
var allPlansData = [];

function switchSettingsTab(type) {
    currentSettingsTab = type;
    document.querySelectorAll('.settings-tab').forEach(function(b) { b.classList.remove('active'); });
    var tabEl = document.getElementById('tab-' + type);
    if (tabEl) tabEl.classList.add('active');
    loadSettingsTab(type);
}

function loadSettingsTab(type) {
    if (type === 'FLOTTE' || type === 'COOP') {
        loadPlansTab(type);
    } else if (type === 'LANDING') {
        loadLandingEditor();
    }
}

async function loadPlansTab(type) {
    try {
        var res = await apiGet('/plans');
        allPlansData = res || [];
        var plans = allPlansData.filter(function(p) { return p.type === (type === 'FLOTTE' ? 'FLEET_MANAGER' : 'COOPERATIVE'); });
        var label = type === 'FLOTTE' ? 'chauffeurs' : 'livreurs';
        var html = '<div class="card" style="padding:24px;"><h3>Plans ' + (type === 'FLOTTE' ? 'Flotte' : 'Coop') + '</h3>';
        plans.forEach(function(p) {
            html += '<div style="display:flex;align-items:center;gap:10px;padding:12px;border:1px solid var(--border);border-radius:10px;margin-top:12px;flex-wrap:wrap;">';
            html += '<strong style="width:80px;">' + p.name + '</strong>';
            html += '<input type="number" value="' + p.price + '" data-id="' + p.id + '" data-field="price" style="width:80px;padding:6px;border:1px solid var(--border);border-radius:6px;text-align:center;"> Ar';
            html += '<input type="number" value="' + p.vehiclesMax + '" data-id="' + p.id + '" data-field="vehiclesMax" style="width:50px;padding:6px;border:1px solid var(--border);border-radius:6px;text-align:center;"> vehicules';
            html += '<input type="number" value="' + p.driversMax + '" data-id="' + p.id + '" data-field="driversMax" style="width:50px;padding:6px;border:1px solid var(--border);border-radius:6px;text-align:center;"> ' + label;
            html += '</div>';
        });
        html += '</div>';
        document.getElementById('settingsContent').innerHTML = html;
    } catch(e) { document.getElementById('settingsContent').innerHTML = '<p>Erreur de chargement</p>'; }
}

function loadLandingEditor() {
    var html = '<div class="card" style="padding:24px;"><h3>Contenu de la landing page</h3><p style="color:var(--text2);">Modifiez les textes sur dago-mobility.pages.dev</p>';
    var sections = ['hero', 'apps', 'features', 'about', 'cta', 'footer'];
    sections.forEach(function(sec) {
        html += '<div style="margin-top:20px;border:1px solid var(--border);border-radius:10px;padding:16px;">';
        html += '<h4 style="text-transform:uppercase;font-size:12px;color:var(--text2);margin-bottom:10px;">' + sec + '</h4>';
        html += '<div class="form-group"><label>Titre</label><input data-section="' + sec + '" data-field="title" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
        html += '<div class="form-group"><label>Sous-titre</label><input data-section="' + sec + '" data-field="subtitle" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></div>';
        html += '<div class="form-group"><label>Texte</label><textarea data-section="' + sec + '" data-field="body" rows="3" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;"></textarea></div>';
        html += '</div>';
    });
    html += '</div>';
    document.getElementById('settingsContent').innerHTML = html;
    loadLandingContent();
}

async function loadLandingContent() {
    try {
        var data = await apiGet('/landing-content');
        if (data && data.length) {
            data.forEach(function(s) {
                var titleEl = document.querySelector('[data-section="' + s.section + '"][data-field="title"]');
                var subtitleEl = document.querySelector('[data-section="' + s.section + '"][data-field="subtitle"]');
                var bodyEl = document.querySelector('[data-section="' + s.section + '"][data-field="body"]');
                if (titleEl) titleEl.value = s.title || '';
                if (subtitleEl) subtitleEl.value = s.subtitle || '';
                if (bodyEl) bodyEl.value = s.body || '';
            });
        }
    } catch(e) {}
}

function saveSettings() {
    if (currentSettingsTab === 'FLOTTE' || currentSettingsTab === 'COOP') {
        var inputs = document.querySelectorAll('#settingsContent input[data-id]');
        inputs.forEach(function(inp) {
            var id = inp.dataset.id;
            var field = inp.dataset.field;
            var plan = allPlansData.find(function(p) { return p.id === id; });
            if (plan) plan[field] = parseInt(inp.value) || 0;
        });
        apiPut('/plans', { plans: allPlansData }).then(function() { alert('Plans sauvegardes !'); });
    } else if (currentSettingsTab === 'LANDING') {
        var landingInputs = document.querySelectorAll('#settingsContent input[data-section], #settingsContent textarea[data-section]');
        var sectionMap = {};
        landingInputs.forEach(function(inp) {
            var sec = inp.dataset.section;
            if (!sectionMap[sec]) sectionMap[sec] = { section: sec, title: '', subtitle: '', body: '' };
            sectionMap[sec][inp.dataset.field] = inp.value;
        });
        var sections = Object.values(sectionMap);
        apiPut('/landing-content', { sections: sections }).then(function() { alert('Contenu sauvegarde !'); });
    }
}
