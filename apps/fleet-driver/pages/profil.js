// ========================================
// DRIVER - PROFIL
// ========================================
function init_profil() {
    var main = document.getElementById('mainContent');
    var user = JSON.parse(localStorage.getItem("dagoo_driver_user") || "{}");
    var token = localStorage.getItem('dagoo_driver_token');

    main.innerHTML = getHeaderHTML() +
        '<div style="padding:12px;max-width:500px;margin:0 auto;padding-bottom:80px;">' +
            // Carte infos chauffeur
            '<div class="card" style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.card : '#1E293B') +';border-radius:12px;padding:20px;margin-bottom:12px;">' +
                '<h3 style="color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';margin-bottom:16px;">👤 Profil Chauffeur</h3>' +
                '<div style="display:flex;flex-direction:column;gap:12px;">' +
                    '<div><span style="color:#94A3B8;font-size:11px;">Nom</span><div style="font-weight:600;color:#fff;">' + (user.name || 'Chauffeur') + '</div></div>' +
                    '<div><span style="color:#94A3B8;font-size:11px;">Code</span><div style="font-weight:600;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';font-family:monospace;">' + (user.driverCode || '-') + '</div></div>' +
                    '<div><span style="color:#94A3B8;font-size:11px;">Organisation</span><div style="font-weight:600;color:#fff;">' + (user.organization || '-') + '</div></div>' +
                    '<div><span style="color:#94A3B8;font-size:11px;">Email</span><div style="font-weight:600;color:#fff;font-size:12px;">' + (user.email || '-') + '</div></div>' +
                '</div>' +
            '</div>' +

            // Auto-déconnexion
            '<div class="card" style="background:' + (window.FLEET_THEME ? window.FLEET_THEME.card : (pwa === 'fleet-driver' ? '#1E293B' : '#064E3B')) + ';border-radius:12px;padding:20px;margin-bottom:12px;">' +
                '<h3 style="color:' + (window.FLEET_THEME ? window.FLEET_THEME.primary : (pwa === 'fleet-driver' ? '#DAA520' : '#10B981')) + ';margin-bottom:16px;">⏱️ Déconnexion automatique</h3>' +
                '<label style="display:block;font-size:12px;color:#94A3B8;margin-bottom:6px;">Délai d'inactivité</label>' +
                '<select id="inactivityTimeout" onchange="changeInactivityTimeout(this.value)" style="width:100%;padding:10px;border:1px solid ' + (window.FLEET_THEME ? window.FLEET_THEME.primary : (pwa === 'fleet-driver' ? '#DAA520' : '#10B981')) + ';background:' + (pwa === 'fleet-driver' ? '#1A1A2E' : '#0A1F18') + ';color:#fff;border-radius:8px;font-size:14px;">' +
                    '<option value="60000">1 minute</option>' +
                    '<option value="180000">3 minutes</option>' +
                    '<option value="300000">5 minutes (défaut)</option>' +
                    '<option value="600000">10 minutes</option>' +
                    '<option value="900000">15 minutes</option>' +
                    '<option value="1800000">30 minutes</option>' +
                '</select>' +
                '<p style="font-size:11px;color:#94A3B8;margin-top:6px;">Déconnexion automatique après cette durée sans activité.</p>' +
            '</div>' +

            // Changer PIN
            '<div class="card" style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.card : '#1E293B') +';border-radius:12px;padding:20px;margin-bottom:12px;">' +
                '<h3 style="color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';margin-bottom:16px;">🔐 Changer mon PIN</h3>' +
                '<div style="display:flex;flex-direction:column;gap:10px;">' +
                    '<input type="password" id="oldPin" placeholder="Ancien PIN" maxlength="4" style="padding:10px;border-radius:8px;border:1px solid '+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';background:#1A1A2E;color:#fff;text-align:center;font-size:18px;letter-spacing:8px;">' +
                    '<input type="password" id="newPin" placeholder="Nouveau PIN" maxlength="4" style="padding:10px;border-radius:8px;border:1px solid '+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';background:#1A1A2E;color:#fff;text-align:center;font-size:18px;letter-spacing:8px;">' +
                    '<input type="password" id="confirmPin" placeholder="Confirmer le PIN" maxlength="4" style="padding:10px;border-radius:8px;border:1px solid '+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';background:#1A1A2E;color:#fff;text-align:center;font-size:18px;letter-spacing:8px;">' +
                    '<button onclick="changePin()" style="padding:12px;background:#F1C40F;color:#1A1A2E;border:none;border-radius:8px;font-weight:700;cursor:pointer;">💾 Enregistrer le nouveau PIN</button>' +
                '</div>' +
                '<div id="pinMessage" style="margin-top:10px;text-align:center;font-size:12px;"></div>' +
            '</div>' +

            '<button onclick="logout()" style="width:100%;padding:12px;background:#EF4444;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;">🚪 Déconnexion</button>' +
        '</div>';
}

async function changePin() {
    var oldPin = document.getElementById('oldPin').value;
    var newPin = document.getElementById('newPin').value;
    var confirmPin = document.getElementById('confirmPin').value;
    var msg = document.getElementById('pinMessage');
    var user = JSON.parse(localStorage.getItem("dagoo_driver_user") || "{}");

    if (!oldPin || !newPin || !confirmPin) { msg.innerHTML = '<span style="color:#F87171;">Tous les champs sont requis</span>'; return; }
    if (newPin !== confirmPin) { msg.innerHTML = '<span style="color:#F87171;">Les PIN ne correspondent pas</span>'; return; }
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) { msg.innerHTML = '<span style="color:#F87171;">Le PIN doit être composé de 4 chiffres</span>'; return; }

    try {
        var r = await fetch(DAGOOS_CONFIG.apiUrl + '/drivers/me', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('dagoo_driver_token') },
            body: JSON.stringify({ pin: newPin })
        });
        var data = await r.json();
        if (r.ok) {
            msg.innerHTML = '<span style="color:'+ (window.FLEET_THEME ? window.FLEET_THEME.success : '#22C55E') +';">✅ PIN changé avec succès !</span>';
            document.getElementById('oldPin').value = '';
            document.getElementById('newPin').value = '';
            document.getElementById('confirmPin').value = '';
        } else {
            msg.innerHTML = '<span style="color:#F87171;">❌ ' + (data.error || 'Erreur') + '</span>';
        }
    } catch(e) {
        msg.innerHTML = '<span style="color:#F87171;">❌ Erreur réseau</span>';
    }
}


function changeInactivityTimeout(ms) {
    var timeoutMs = parseInt(ms, 10);
    if (window.dagooInactivity) {
        window.dagooInactivity.setTimeoutMs(timeoutMs);
        alert('✅ Délai de déconnexion mis à jour');
    } else {
        alert('⚠️ Module d inactivité non chargé');
    }
}

window.init_profil = init_profil;
window.changeInactivityTimeout = changeInactivityTimeout;
window.changePin = changePin;
