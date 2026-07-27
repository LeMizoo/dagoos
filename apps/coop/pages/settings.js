function init_settings() {
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div class="topbar"><h1><i class="fas fa-cog"></i> Paramètres</h1></div>' +
        
        // PROFIL FLOTTE
        '<div class="card" style="padding:24px;margin-bottom:20px;">' +
            '<h3 style="margin-bottom:16px;"><i class="fas fa-building"></i> Profil de la flotte</h3>' +
            '<div id="orgInfo">Chargement...</div>' +
        '</div>' +
        
        // PAGE VITRINE
        '<div class="card" style="padding:24px;margin-bottom:20px;">' +
            '<h3 style="margin-bottom:16px;"><i class="fas fa-globe"></i> Page vitrine</h3>' +
            '<div id="vitrineInfo">Chargement...</div>' +
        '</div>' +
        
        // STATISTIQUES
        '<div class="card" style="padding:24px;">' +
            '<h3 style="margin-bottom:16px;"><i class="fas fa-chart-bar"></i> Statistiques</h3>' +
            '<div id="statsInfo">Chargement...</div>' +
        '</div>';
    loadSettingsData();
}

async function loadSettingsData() {
    var orgs = await apiGet('/organizations');
    var drivers = await apiGet('/drivers');
    var vehicles = await apiGet('/vehicles');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var org = orgs.find(function(o) { return o.email === user.email; });
    if (!org) { document.getElementById('orgInfo').innerHTML = 'Erreur'; return; }
    
    var myDrivers = drivers.filter(function(d) { return d.organization && d.organization.email === user.email; });
    var myVehicles = vehicles.filter(function(v) { return v.organizationId === org.id; });
    
    // PROFIL
    var html = '<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">' +
        '<img src="' + (org.logo || 'https://dago-mobility.pages.dev/assets/logo/b-trans.png') + '" style="width:64px;height:64px;border-radius:14px;object-fit:cover;" id="logoPreview">' +
        '<div><strong style="font-size:18px;">' + org.name + '</strong><br><span style="color:var(--text2);">Code: ' + org.code + ' | Plan: ' + (org.plan || 'Freemium') + ' | Statut: ' + org.status + '</span></div></div>';
    html += '<div class="form-group"><label>Nom</label><input id="editName" value="' + org.name + '"></div>';
    html += '<div class="form-group"><label>Email</label><input id="editEmail" value="' + (org.email || '') + '"></div>';
    html += '<div class="form-group"><label>Téléphone</label><input id="editPhone" value="' + (org.phone || '') + '"></div>';
    html += '<div class="form-group"><label>Description</label><textarea id="editDesc" rows="3" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:8px;">' + (org.description || '') + '</textarea></div>';
    html += '<div class="form-group"><label>Logo (URL)</label><input id="editLogo" value="' + (org.logo || '') + '" onchange="document.getElementById(\'logoPreview\').src=this.value"></div>';
    html += '<button class="btn btn-primary" onclick="saveProfile()"><i class="fas fa-save"></i> Enregistrer le profil</button>';
    document.getElementById('orgInfo').innerHTML = html;
    
    // PAGE VITRINE
    var vitrineHTML = '';
    if (org.plan === 'Premium' || org.plan === 'Standard') {
        var vitrineUrl = 'https://dago-coop.pages.dev/' + (org.slug || org.code.toLowerCase());
        vitrineHTML = '<div style="background:#D1FAE5;border-radius:12px;padding:20px;text-align:center;">' +
            '<p style="font-size:24px;">🌐</p><h4>Votre page vitrine est active !</h4>' +
            '<p style="color:var(--text2);">Partagez ce lien avec vos clients :</p>' +
            '<a href="' + vitrineUrl + '" target="_blank" style="display:inline-block;background:#27AE60;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;margin:8px 0;">' + vitrineUrl + ' <i class="fas fa-external-link-alt"></i></a>' +
            '<p style="font-size:11px;color:var(--text2);">Modifiez votre logo, nom et description ci-dessus pour personnaliser votre page.</p></div>';
    } else if (org.plan === 'Basic') {
        vitrineHTML = '<div style="background:#FEF3C7;border-radius:12px;padding:20px;text-align:center;">' +
            '<p style="font-size:24px;">🔒</p><h4>Page vitrine disponible en Standard ou Premium</h4>' +
            '<p style="color:#92400E;">Passez au plan Standard (35 000 Ar/mois) ou Premium (75 000 Ar/mois) pour obtenir votre page vitrine personnalisée.</p>' +
            '<button class="btn btn-primary" onclick="alert(\'Contactez votre administrateur pour upgrader votre plan.\')">Upgrader mon plan</button></div>';
    } else {
        vitrineHTML = '<div style="background:#FEF3C7;border-radius:12px;padding:20px;text-align:center;">' +
            '<p style="font-size:24px;">🔒</p><h4>Page vitrine disponible à partir du plan Standard</h4>' +
            '<p style="color:#92400E;">Votre plan Freemium ne donne pas accès à la page vitrine.</p></div>';
    }
    document.getElementById('vitrineInfo').innerHTML = vitrineHTML;
    
    // STATS
    document.getElementById('statsInfo').innerHTML = 
        '<div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">' +
            '<div class="stat-card"><div class="stat-icon green"><i class="fas fa-users"></i></div><div class="stat-info"><div class="stat-number">' + myDrivers.length + '</div><div class="stat-label">Chauffeurs</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon blue"><i class="fas fa-motorcycle"></i></div><div class="stat-info"><div class="stat-number">' + myVehicles.length + '</div><div class="stat-label">Véhicules</div></div></div>' +
            '<div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-route"></i></div><div class="stat-info"><div class="stat-number">0</div><div class="stat-label">Courses</div></div></div>' +
        '</div>';
}

function saveProfile() {
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
        }).then(function() { alert('Profil mis à jour !'); loadSettingsData(); });
    });
}
