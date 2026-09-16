// ========================================
// DRIVER - PROFIL
// ========================================

// P7-E2-B-FIX : helper local (délègue à window.escapeHtml défini dans router.js).
function escapeHtmlLocal(value) {
  if (window.escapeHtml) return window.escapeHtml(value);
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function init_profil() {
    var main = document.getElementById('mainContent');
    var user = JSON.parse(localStorage.getItem("dagoo_driver_user") || "{}");
    var token = localStorage.getItem('dagoo_driver_token');

    main.innerHTML = getHeaderHTML() +
        '<div style="padding:12px;max-width:500px;margin:0 auto;padding-bottom:80px;">' +
            // Carte infos chauffeur
            '<div class="card" style="background:var(--bg-surface);border-radius:12px;padding:20px;margin-bottom:12px;">' +
                '<h3 style="color:var(--text-primary);margin-bottom:16px;">👤 Profil Chauffeur</h3>' +
                '<div style="display:flex;flex-direction:column;gap:12px;">' +
                    '<div><span style="color:var(--text-muted);font-size:11px;">Nom</span><div style="font-weight:600;color:var(--text-primary);">' + escapeHtmlLocal(user.name || 'Chauffeur') + '</div></div>' +
                    '<div><span style="color:var(--text-muted);font-size:11px;">Code</span><div style="font-weight:600;color:var(--text-primary);font-family:monospace;">' + escapeHtmlLocal(user.driverCode || '-') + '</div></div>' +
                    '<div><span style="color:var(--text-muted);font-size:11px;">Organisation</span><div style="font-weight:600;color:var(--text-primary);">' + escapeHtmlLocal(user.organization || '-') + '</div></div>' +
                    '<div><span style="color:var(--text-muted);font-size:11px;">Email</span><div style="font-weight:600;color:var(--text-primary);font-size:12px;">' + escapeHtmlLocal(user.email || '-') + '</div></div>' +
                '</div>' +
            '</div>' +

            // Auto-déconnexion
            '<div class="card" style="background:var(--bg-surface);border-radius:12px;padding:20px;margin-bottom:12px;">' +
                '<h3 style="color:var(--text-primary);margin-bottom:16px;">⏱️ Déconnexion automatique</h3>' +
                '<label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:6px;">Délai d\'inactivité</label>' +
                '<select id="inactivityTimeout" onchange="changeInactivityTimeout(this.value)" style="width:100%;padding:10px;border:1px solid var(--border);background:var(--bg-soft);color:var(--text-primary);border-radius:8px;font-size:14px;">' +
                    '<option value="60000">1 minute</option>' +
                    '<option value="180000">3 minutes</option>' +
                    '<option value="300000">5 minutes (défaut)</option>' +
                    '<option value="600000">10 minutes</option>' +
                    '<option value="900000">15 minutes</option>' +
                    '<option value="1800000">30 minutes</option>' +
                '</select>' +
                '<p style="font-size:11px;color:var(--text-muted);margin-top:6px;">Déconnexion automatique après cette durée sans activité.</p>' +
            '</div>' +

            // Changer PIN
            '<div class="card" style="background:var(--bg-surface);border-radius:12px;padding:20px;margin-bottom:12px;">' +
                '<h3 style="color:var(--text-primary);margin-bottom:16px;">🔐 Changer mon PIN</h3>' +
                '<div style="display:flex;flex-direction:column;gap:10px;">' +
                    '<input type="password" id="oldPin" placeholder="Ancien PIN" maxlength="4" style="padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--bg-soft);color:var(--text-primary);text-align:center;font-size:18px;letter-spacing:8px;">' +
                    '<input type="password" id="newPin" placeholder="Nouveau PIN" maxlength="4" style="padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--bg-soft);color:var(--text-primary);text-align:center;font-size:18px;letter-spacing:8px;">' +
                    '<input type="password" id="confirmPin" placeholder="Confirmer le PIN" maxlength="4" style="padding:10px;border-radius:8px;border:1px solid var(--border);background:var(--bg-soft);color:var(--text-primary);text-align:center;font-size:18px;letter-spacing:8px;">' +
                    '<button onclick="changePin()" style="padding:12px;background:var(--gold);color:var(--text-primary);border:none;border-radius:8px;font-weight:700;cursor:pointer;">💾 Enregistrer le nouveau PIN</button>' +
                '</div>' +
                '<div id="pinMessage" style="margin-top:10px;text-align:center;font-size:12px;"></div>' +
            '</div>' +

            '<button onclick="logout()" style="width:100%;padding:12px;background:var(--error-fg);color:var(--text-on-accent);border:none;border-radius:8px;font-weight:700;cursor:pointer;">🚪 Déconnexion</button>' +
        '</div>';

}



async function changePin() {
    var oldPin = document.getElementById('oldPin').value;
    var newPin = document.getElementById('newPin').value;
    var confirmPin = document.getElementById('confirmPin').value;
    var msg = document.getElementById('pinMessage');

    if (!oldPin || !newPin || !confirmPin) { msg.innerHTML = '<span style="color:var(--error-fg);">Tous les champs sont requis</span>'; return; }
    if (newPin !== confirmPin) { msg.innerHTML = '<span style="color:var(--error-fg);">Les PIN ne correspondent pas</span>'; return; }
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) { msg.innerHTML = '<span style="color:var(--error-fg);">Le PIN doit être composé de 4 chiffres</span>'; return; }

    try {
        var result = await apiFetch('/drivers/me/pin', {
            method: 'PUT',
            body: { oldPin: oldPin, newPin: newPin }
        });

        if (result && result.ok) {
            msg.innerHTML = '<span style="color:var(--success-fg);">✅ PIN changé avec succès !</span>';
            document.getElementById('oldPin').value = '';
            document.getElementById('newPin').value = '';
            document.getElementById('confirmPin').value = '';
        } else {
            msg.innerHTML = '<span style="color:var(--error-fg);">❌ ' + escapeHtmlLocal((result && result.error) || 'Erreur') + '</span>';
        }
    } catch(e) {
        msg.innerHTML = '<span style="color:var(--error-fg);">❌ Erreur réseau</span>';
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
