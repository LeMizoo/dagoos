// ========================================
// DRIVER - PROFIL
// ========================================
function init_profil() {
    var main = document.getElementById('mainContent');
    var user = JSON.parse(localStorage.getItem("dagoos_user") || "{}");
    var token = localStorage.getItem('dagoos_token');
    var orgName = user.organization || '-';

    main.innerHTML = 
        '<div style="padding:12px;max-width:500px;margin:0 auto;">' +
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:20px;margin-bottom:12px;">' +
                '<h3 style="color:#DAA520;margin-bottom:16px;">👤 Profil Chauffeur</h3>' +
                '<div style="display:flex;flex-direction:column;gap:12px;">' +
                    '<div><span style="color:#94A3B8;font-size:11px;">Nom</span><div style="font-weight:600;color:#fff;">' + (user.name || 'Chauffeur') + '</div></div>' +
                    '<div><span style="color:#94A3B8;font-size:11px;">Code</span><div style="font-weight:600;color:#DAA520;font-family:monospace;">' + (user.driverCode || '-') + '</div></div>' +
                    '<div><span style="color:#94A3B8;font-size:11px;">Organisation</span><div style="font-weight:600;color:#fff;">' + orgName + '</div></div>' +
                '</div>' +
            '</div>' +

            // Changer le PIN
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:20px;margin-bottom:12px;">' +
                '<h3 style="color:#DAA520;margin-bottom:16px;">🔐 Changer mon PIN</h3>' +
                '<div style="display:flex;flex-direction:column;gap:10px;">' +
                    '<input type="password" id="oldPin" placeholder="Ancien PIN" maxlength="4" style="padding:10px;border-radius:8px;border:1px solid #DAA520;background:#1A1A2E;color:#fff;text-align:center;font-size:18px;letter-spacing:8px;">' +
                    '<input type="password" id="newPin" placeholder="Nouveau PIN" maxlength="4" style="padding:10px;border-radius:8px;border:1px solid #DAA520;background:#1A1A2E;color:#fff;text-align:center;font-size:18px;letter-spacing:8px;">' +
                    '<input type="password" id="confirmPin" placeholder="Confirmer le PIN" maxlength="4" style="padding:10px;border-radius:8px;border:1px solid #DAA520;background:#1A1A2E;color:#fff;text-align:center;font-size:18px;letter-spacing:8px;">' +
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
    var user = JSON.parse(localStorage.getItem("dagoos_user") || "{}");

    if (!oldPin || !newPin || !confirmPin) { msg.innerHTML = '<span style="color:#F87171;">Tous les champs sont requis</span>'; return; }
    if (newPin !== confirmPin) { msg.innerHTML = '<span style="color:#F87171;">Les PIN ne correspondent pas</span>'; return; }
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) { msg.innerHTML = '<span style="color:#F87171;">Le PIN doit être composé de 4 chiffres</span>'; return; }

    try {
        var r = await fetch(DAGOOS_CONFIG.apiUrl + '/drivers/' + user.driverId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('dagoos_token') },
            body: JSON.stringify({ oldPin: oldPin, pin: newPin })
        });
        var data = await r.json();
        if (r.ok) {
            msg.innerHTML = '<span style="color:#22C55E;">✅ PIN changé avec succès !</span>';
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

window.init_profil = init_profil;
window.changePin = changePin;
