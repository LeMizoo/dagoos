// ========================================
// DRIVER - VERSEMENTS
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

async function init_versements() {
    var main = document.getElementById('mainContent');
    var user = JSON.parse(localStorage.getItem("dagoo_driver_user") || "{}");

    main.innerHTML = getHeaderHTML() + '<div style="padding:12px;max-width:500px;margin:0 auto;padding-bottom:80px;"><div style="text-align:center;padding:40px;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : 'var(--gold)') +';">Chargement...</div></div>';

    try {
        // Source de vérité : API finances (aligné Coop)
        var stats = await window.apiFetch('/finances/stats/summary');

        var today = (stats && stats.today) || {};

        var totalCA         = Number(today.ca  || 0);
        var totalCommission = Number(today.com || 0);
        var totalVerse      = Number(today.net || 0);

        var html = getHeaderHTML() + '<div style="padding:12px;max-width:500px;margin:0 auto;padding-bottom:80px;">' +

            // Résumé
            '<div class="card" style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.card : 'var(--bg-surface)') +';border-radius:12px;padding:20px;margin-bottom:12px;">' +
                '<h3 style="color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : 'var(--gold)') +';margin-bottom:16px;">💰 Résumé des versements</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;">' +
                    '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : 'var(--bg-soft)') +';border-radius:10px;padding:10px;"><div style="font-size:16px;font-weight:800;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.success : 'var(--success-fg)') +';">' + totalCA.toLocaleString() + ' Ar</div><div style="font-size:9px;color:var(--text-muted);">CA Total</div></div>' +
                    '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : 'var(--bg-soft)') +';border-radius:10px;padding:10px;"><div style="font-size:16px;font-weight:800;color:var(--text-primary);">' + totalCommission.toLocaleString() + ' Ar</div><div style="font-size:9px;color:var(--text-muted);">Part organisation</div></div>' +
                    '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : 'var(--bg-soft)') +';border-radius:10px;padding:10px;"><div style="font-size:16px;font-weight:800;color:var(--text-primary);">' + totalVerse.toLocaleString() + ' Ar</div><div style="font-size:9px;color:var(--text-muted);">Net chauffeur</div></div>' +
                '</div>' +
            '</div>' +

            // Demander un versement
            '<div class="card" style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.card : 'var(--bg-surface)') +';border-radius:12px;padding:20px;margin-bottom:12px;">' +
                '<h3 style="color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : 'var(--gold)') +';margin-bottom:12px;">📤 Demander un versement</h3>' +
                '<p style="color:var(--text-muted);font-size:11px;margin-bottom:12px;">Votre gain net disponible est de <strong style="color:'+ (window.FLEET_THEME ? window.FLEET_THEME.success : 'var(--success-fg)') +';">' + totalVerse.toLocaleString() + ' Ar</strong></p>' +
                '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
                    '<input type="number" id="versementMontant" placeholder="Montant (Ar)" style="flex:1;padding:10px;background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : 'var(--bg-soft)') +';border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:14px;">' +
                '</div>' +
                '<select id="versementMode" style="width:100%;padding:10px;background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : 'var(--bg-soft)') +';border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-size:14px;margin-bottom:8px;">' +
                    '<option value="especes">💰 Espèces</option>' +
                    '<option value="mobile_money">📱 Mobile Money</option>' +
                    '<option value="virement">🏦 Virement</option>' +
                '</select>' +
                '<button onclick="demanderVersement()" style="width:100%;padding:12px;background:var(--gold);color:var(--text-primary);border:none;border-radius:8px;font-weight:700;cursor:pointer;">📤 Demander ce versement</button>' +
                '<div id="versementMsg" style="margin-top:8px;text-align:center;font-size:12px;"></div>' +
            '</div>' +
        '</div>';
        main.innerHTML = html;
    } catch(e) {
        console.error('init_versements:', e);
        main.innerHTML = getHeaderHTML() + '<div style="text-align:center;padding:40px;color:var(--error-fg);">Erreur de chargement</div>';
    }
}


async function demanderVersement() {
    var montant = document.getElementById('versementMontant').value;
    var mode = document.getElementById('versementMode').value;
    var msg = document.getElementById('versementMsg');
    var user = JSON.parse(localStorage.getItem("dagoo_driver_user") || "{}");

    if (!montant || parseInt(montant) <= 0) {
        msg.innerHTML = '<span style="color:var(--error-fg);">Veuillez entrer un montant valide</span>';
        return;
    }

    try {
        await window.apiFetch('/finances/versements', {
            method: 'POST',
            body: {
                amount: parseInt(montant),
                periode: new Date().toISOString().slice(0,7)
            }
        });

        msg.innerHTML = '<span style="color:'+ (window.FLEET_THEME ? window.FLEET_THEME.success : 'var(--success-fg)') +';">✅ Demande de versement envoyée !</span>';
    } catch(e) {
        msg.innerHTML = '<span style="color:var(--error-fg);">❌ ' + escapeHtmlLocal(e.message || 'Erreur réseau') + '</span>';
    }
}


window.init_versements = init_versements;
window.demanderVersement = demanderVersement;
