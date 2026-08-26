// ========================================
// DRIVER - VERSEMENTS
// ========================================
async function init_versements() {
    var main = document.getElementById('mainContent');
    var user = JSON.parse(localStorage.getItem("dagoo_driver_user") || "{}");
    
    main.innerHTML = getHeaderHTML() + '<div style="padding:12px;max-width:500px;margin:0 auto;padding-bottom:80px;"><div style="text-align:center;padding:40px;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';">Chargement...</div></div>';

    try {
        var courses = await window.apiGet('/finances/courses?driverId=' + user.driverId);
        var arr = Array.isArray(courses) ? courses : [];

        // Commission réelle de l'organisation (paramétrée dans /flotte/settings),
        // au lieu d'un taux 20%/80% figé dans le code.
        var commissionPct = 20;
        try {
            if (user.organizationId) {
                var tarifsOrg = await window.apiGet('/tarifs/' + user.organizationId);
                if (tarifsOrg && tarifsOrg.commissionChauffeur !== undefined && tarifsOrg.commissionChauffeur !== null) {
                    commissionPct = Number(tarifsOrg.commissionChauffeur);
                }
            }
        } catch (e) {
            console.warn('Commission organisation indisponible, utilisation du taux par défaut (20%):', e);
        }

        var totalCA = arr.reduce(function(s, c) { return s + (c.price || 0); }, 0);
        var totalCommission = Math.round(totalCA * (commissionPct / 100));
        var totalVerse = totalCA - totalCommission;

        var html = getHeaderHTML() + '<div style="padding:12px;max-width:500px;margin:0 auto;padding-bottom:80px;">' +
            // Résumé
            '<div class="card" style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.card : '#1E293B') +';border-radius:12px;padding:20px;margin-bottom:12px;">' +
                '<h3 style="color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';margin-bottom:16px;">💰 Résumé des versements</h3>' +
                '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;">' +
                    '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : '#252525') +';border-radius:10px;padding:10px;"><div style="font-size:16px;font-weight:800;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.success : '#22C55E') +';">' + totalCA.toLocaleString() + ' Ar</div><div style="font-size:9px;color:#888;">CA Total</div></div>' +
                    '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : '#252525') +';border-radius:10px;padding:10px;"><div style="font-size:16px;font-weight:800;color:#3B82F6;">' + totalCommission.toLocaleString() + ' Ar</div><div style="font-size:9px;color:#888;">Gardé (' + commissionPct + '%)</div></div>' +
                    '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : '#252525') +';border-radius:10px;padding:10px;"><div style="font-size:16px;font-weight:800;color:#8B5CF6;">' + totalVerse.toLocaleString() + ' Ar</div><div style="font-size:9px;color:#888;">Versé (' + (100 - commissionPct) + '%)</div></div>' +
                '</div>' +
            '</div>' +
            
            // Demander un versement
            '<div class="card" style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.card : '#1E293B') +';border-radius:12px;padding:20px;margin-bottom:12px;">' +
                '<h3 style="color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : '#DAA520') +';margin-bottom:12px;">📤 Demander un versement</h3>' +
                '<p style="color:#94A3B8;font-size:11px;margin-bottom:12px;">Votre gain net disponible est de <strong style="color:'+ (window.FLEET_THEME ? window.FLEET_THEME.success : '#22C55E') +';">' + totalVerse.toLocaleString() + ' Ar</strong></p>' +
                '<div style="display:flex;gap:8px;margin-bottom:8px;">' +
                    '<input type="number" id="versementMontant" placeholder="Montant (Ar)" style="flex:1;padding:10px;background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : '#252525') +';border:1px solid #333;border-radius:8px;color:#fff;font-size:14px;">' +
                '</div>' +
                '<select id="versementMode" style="width:100%;padding:10px;background:'+ (window.FLEET_THEME ? window.FLEET_THEME.cardDark : '#252525') +';border:1px solid #333;border-radius:8px;color:#fff;font-size:14px;margin-bottom:8px;">' +
                    '<option value="especes">💰 Espèces</option>' +
                    '<option value="mobile_money">📱 Mobile Money</option>' +
                    '<option value="virement">🏦 Virement</option>' +
                '</select>' +
                '<button onclick="demanderVersement()" style="width:100%;padding:12px;background:#F1C40F;color:#1A1A2E;border:none;border-radius:8px;font-weight:700;cursor:pointer;">📤 Demander ce versement</button>' +
                '<div id="versementMsg" style="margin-top:8px;text-align:center;font-size:12px;"></div>' +
            '</div>' +
        '</div>';
        main.innerHTML = html;
    } catch(e) {
        main.innerHTML = getHeaderHTML() + '<div style="text-align:center;padding:40px;color:#F87171;">Erreur de chargement</div>';
    }
}

async function demanderVersement() {
    var montant = document.getElementById('versementMontant').value;
    var mode = document.getElementById('versementMode').value;
    var msg = document.getElementById('versementMsg');
    var user = JSON.parse(localStorage.getItem("dagoo_driver_user") || "{}");

    if (!montant || parseInt(montant) <= 0) { msg.innerHTML = '<span style="color:#F87171;">Veuillez entrer un montant valide</span>'; return; }

    try {
        var r = await fetch(DAGOOS_CONFIG.apiUrl + '/versements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('dagoo_driver_token') },
            body: JSON.stringify({ driverId: user.driverId, amount: parseInt(montant), method: mode, periode: new Date().toISOString().slice(0,7) })
        });
        if (r.ok) {
            msg.innerHTML = '<span style="color:'+ (window.FLEET_THEME ? window.FLEET_THEME.success : '#22C55E') +';">✅ Demande de versement envoyée !</span>';
        } else {
            var data = await r.json();
            msg.innerHTML = '<span style="color:#F87171;">❌ ' + (data.error || 'Erreur') + '</span>';
        }
    } catch(e) {
        msg.innerHTML = '<span style="color:#F87171;">❌ Erreur réseau</span>';
    }
}

window.init_versements = init_versements;
window.demanderVersement = demanderVersement;
