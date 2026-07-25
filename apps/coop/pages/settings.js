function init_settings() {
    document.getElementById('mainContent').innerHTML = '<div class="topbar"><h1><i class="fas fa-cog"></i> Paramètres</h1></div><div class="card" style="padding:24px;"><div id="orgInfo">Chargement...</div></div>';
    loadSettings();
}
async function loadSettings() {
    var orgs = await apiGet('/organizations');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var org = orgs.find(function(o) { return o.email === user.email; });
    if (!org) return;
    var html = '<p><strong>Nom:</strong> ' + org.name + '</p><p><strong>Plan:</strong> ' + (org.plan || 'Freemium') + '</p><p><strong>Statut:</strong> ' + org.status + '</p>';
    if (org.plan === 'Premium' || org.plan === 'Standard') {
        html += '<div style="background:#D1FAE5;padding:20px;border-radius:10px;text-align:center;margin-top:16px;"><p style="font-size:24px;">🌐</p><h4>Page vitrine active</h4><a href="https://dago-coop.pages.dev/' + (org.slug || '') + '" target="_blank">dago-coop.pages.dev/' + (org.slug || '') + '</a></div>';
    }
    document.getElementById('orgInfo').innerHTML = html;
}
