function init_settings() {
    var main = document.getElementById('mainContent');
    main.innerHTML = '<div class="topbar"><h1>⚙️ Paramètres</h1></div><div class="card" style="padding:24px;"><div id="orgInfo">Chargement...</div></div>';
    loadSettings();
}

async function loadSettings() {
    var orgs = await apiGet('/organizations');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var org = orgs.find(function(o) { return o.email === user.email; });
    if (!org) { document.getElementById('orgInfo').innerHTML = 'Erreur'; return; }
    var html = '<p><strong>Nom:</strong> ' + org.name + '</p>';
    html += '<p><strong>Code:</strong> ' + org.code + '</p>';
    html += '<p><strong>Plan:</strong> ' + (org.plan || 'Freemium') + '</p>';
    html += '<p><strong>Statut:</strong> ' + org.status + '</p>';
    html += '<p><strong>Email:</strong> ' + (org.email || 'N/A') + '</p>';
    html += '<p><strong>Téléphone:</strong> ' + (org.phone || 'N/A') + '</p>';
    if (org.plan === 'Premium' || org.plan === 'Standard') {
        html += '<div style="background:#F1F5F9;border-radius:12px;padding:20px;text-align:center;margin-top:16px;">';
        html += '<p style="font-size:24px;">🌐</p><h4>Votre page vitrine</h4>';
        html += '<a href="https://dago-fleet.pages.dev/' + (org.slug || org.code.toLowerCase()) + '" target="_blank" style="color:#1A5276;font-weight:600;">dago-fleet.pages.dev/' + (org.slug || org.code.toLowerCase()) + '</a></div>';
    } else {
        html += '<div style="background:#FEF3C7;border-radius:12px;padding:20px;text-align:center;margin-top:16px;"><p>🔒 Page vitrine disponible en Premium</p></div>';
    }
    document.getElementById('orgInfo').innerHTML = html;
}
