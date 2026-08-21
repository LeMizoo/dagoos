// ========================================
// DRIVER - FINANCES (Versements + Dépenses)
// ========================================

async function init_finances() {
    var container =
        document.getElementById('mainContent') ||
        document.getElementById('pageContainer') ||
        document.querySelector('main');

    if (!container) return;

    container.innerHTML =
        getHeaderHTML() +
        '<div style="padding:16px;max-width:500px;margin:0 auto;padding-bottom:80px;">' +
            '<h2 style="font-size:20px;font-weight:bold;margin-bottom:16px;">💰 Finances</h2>' +
            '<div id="financesContent" style="text-align:center;padding:40px;color:#94A3B8;">Chargement...</div>' +
        '</div>';

    try {
        // Charger les versements
        var versements = await window.apiFetch('/finances/versements').catch(function() { return []; });
        var expenses = await window.apiFetch('/finances/expenses').catch(function() { return []; });

        var contentEl = document.getElementById('financesContent');
        if (!contentEl) return;

        var versementsHtml = '';
        if (Array.isArray(versements) && versements.length > 0) {
            versementsHtml = versements.map(function(v) {
                return '<div style="background:#1E293B;border-radius:8px;padding:10px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">' +
                    '<div><span style="color:#fff;font-weight:600;font-size:12px;">' + (v.montant || v.amount || 0).toLocaleString() + ' Ar</span>' +
                    '<br><span style="color:#94A3B8;font-size:10px;">' + (v.statut || v.status || '') + '</span></div>' +
                    '<span style="color:#F59E0B;font-weight:700;">📤</span></div>';
            }).join('');
        } else {
            versementsHtml = '<p style="color:#94A3B8;text-align:center;padding:10px;">Aucune demande de versement.</p>';
        }

        var expensesHtml = '';
        if (Array.isArray(expenses) && expenses.length > 0) {
            expensesHtml = expenses.map(function(e) {
                return '<div style="background:#1E293B;border-radius:8px;padding:10px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">' +
                    '<div><span style="color:#fff;font-weight:600;font-size:12px;">' + (e.category || '') + '</span>' +
                    '<br><span style="color:#94A3B8;font-size:10px;">' + (e.description || '') + '</span></div>' +
                    '<span style="color:#EF4444;font-weight:700;">-' + (e.amount || 0).toLocaleString() + ' Ar</span></div>';
            }).join('');
        } else {
            expensesHtml = '<p style="color:#94A3B8;text-align:center;padding:10px;">Aucune dépense enregistrée.</p>';
        }

        contentEl.innerHTML =
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:10px;">' +
                '<h3 style="color:#F59E0B;margin-bottom:10px;font-size:13px;">📤 Versements</h3>' +
                versementsHtml +
            '</div>' +
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:10px;">' +
                '<h3 style="color:#EF4444;margin-bottom:10px;font-size:13px;">💸 Dépenses</h3>' +
                expensesHtml +
            '</div>';
    } catch (e) {
        var contentEl = document.getElementById('financesContent');
        if (contentEl) contentEl.innerHTML = '<p style="color:#EF4444;">Erreur : ' + e.message + '</p>';
    }
}

window.init_finances = init_finances;
