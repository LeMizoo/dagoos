// ========================================
// DRIVER COOP — VERSEMENTS
// Source métier : API finances
// ========================================

function formatAr(value) {
    return Number(value || 0).toLocaleString('fr-FR') + ' Ar';
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDate(value) {
    if (!value) return '-';

    var date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '-';
    }

    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function statusLabel(status) {
    switch (status) {
        case 'en_attente':
            return 'En attente';
        case 'valide':
            return 'Validé';
        case 'refuse':
            return 'Refusé';
        case 'paye':
            return 'Payé';
        default:
            return status || '-';
    }
}

function statusStyle(status) {
    switch (status) {
        case 'valide':
        case 'paye':
            return 'color:#22C55E;background:#052E16;';
        case 'refuse':
            return 'color:#F87171;background:#450A0A;';
        case 'en_attente':
        default:
            return 'color:#F59E0B;background:#451A03;';
    }
}

async function loadVersementsData() {
    var results = await Promise.all([
        window.apiFetch('/finances/stats/summary'),
        window.apiFetch('/finances/versements')
    ]);

    return {
        stats: results[0] || {},
        versements: Array.isArray(results[1]) ? results[1] : []
    };
}

function renderVersements(data) {
    var stats = data.stats || {};
    var versements = data.versements || [];

    var today = stats.today || {};
    var week = stats.week || {};

    /*
     * Le backend est la source de vérité.
     *
     * Aucun calcul 20/80 n'est effectué ici.
     * Le montant net provient directement de /finances/stats/summary.
     */

    var netDisponible = Number(today.net || 0);

    var html =
        getHeaderHTML() +

        '<div style="padding:12px;max-width:560px;margin:0 auto;padding-bottom:80px;">' +

            '<div style="margin-bottom:16px;">' +
                '<h2 style="font-size:20px;font-weight:800;margin:0 0 4px;">Versements</h2>' +
                '<p style="font-size:12px;color:#94A3B8;margin:0;">' +
                    'Suivi de vos revenus et demandes de versement' +
                '</p>' +
            '</div>' +

            // ========================================
            // DISPONIBLE
            // ========================================

            '<div class="card" style="background:#064E3B;border-radius:14px;padding:20px;margin-bottom:12px;">' +

                '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">' +
                    '<div>' +
                        '<div style="font-size:11px;color:#A7F3D0;margin-bottom:6px;">' +
                            'Net aujourd’hui' +
                        '</div>' +
                        '<div style="font-size:28px;font-weight:800;color:#22C55E;">' +
                            formatAr(netDisponible) +
                        '</div>' +
                    '</div>' +

                    '<div style="font-size:24px;">' +
                        'Ar' +
                    '</div>' +
                '</div>' +

                '<div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.1);display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +

                    '<div>' +
                        '<div style="font-size:10px;color:#94A3B8;">Courses aujourd’hui</div>' +
                        '<div style="font-size:16px;font-weight:700;color:#fff;">' +
                            (today.count || 0) +
                        '</div>' +
                    '</div>' +

                    '<div>' +
                        '<div style="font-size:10px;color:#94A3B8;">CA aujourd’hui</div>' +
                        '<div style="font-size:16px;font-weight:700;color:#fff;">' +
                            formatAr(today.ca) +
                        '</div>' +
                    '</div>' +

                    '<div>' +
                        '<div style="font-size:10px;color:#94A3B8;">Commission</div>' +
                        '<div style="font-size:16px;font-weight:700;color:#fff;">' +
                            formatAr(today.com) +
                        '</div>' +
                    '</div>' +

                    '<div>' +
                        '<div style="font-size:10px;color:#94A3B8;">Net semaine</div>' +
                        '<div style="font-size:16px;font-weight:700;color:#fff;">' +
                            formatAr(week.net) +
                        '</div>' +
                    '</div>' +

                '</div>' +
            '</div>' +

            // ========================================
            // DEMANDE
            // ========================================

            '<div class="card" style="background:#064E3B;border-radius:14px;padding:20px;margin-bottom:12px;">' +

                '<h3 style="font-size:16px;font-weight:800;color:#10B981;margin:0 0 6px;">' +
                    'Demander un versement' +
                '</h3>' +

                '<p style="font-size:11px;color:#94A3B8;margin:0 0 14px;">' +
                    'Le montant demandé sera traité par votre organisation.' +
                '</p>' +

                '<input ' +
                    'type="number" ' +
                    'id="versementMontant" ' +
                    'min="1" ' +
                    'step="1" ' +
                    'placeholder="Montant en Ar" ' +
                    'style="width:100%;box-sizing:border-box;padding:12px;background:#252525;border:1px solid #333;border-radius:8px;color:#fff;font-size:14px;margin-bottom:10px;"' +
                '>' +

                '<button ' +
                    'id="btnDemanderVersement" ' +
                    'onclick="demanderVersement()" ' +
                    'style="width:100%;padding:12px;background:#F59E0B;color:#0A1F18;border:none;border-radius:8px;font-weight:700;cursor:pointer;"' +
                '>' +
                    'Demander ce versement' +
                '</button>' +

                '<div id="versementMsg" style="margin-top:10px;text-align:center;font-size:12px;"></div>' +

            '</div>' +

            // ========================================
            // HISTORIQUE
            // ========================================

            '<div class="card" style="background:#064E3B;border-radius:14px;padding:20px;">' +

                '<h3 style="font-size:16px;font-weight:800;color:#10B981;margin:0 0 14px;">' +
                    'Historique des demandes' +
                '</h3>';

    if (!versements.length) {
        html +=
            '<div style="padding:24px 8px;text-align:center;color:#64748B;font-size:12px;">' +
                'Aucune demande de versement.' +
            '</div>';
    } else {
        html += '<div style="display:flex;flex-direction:column;gap:8px;">';

        versements.forEach(function(versement) {
            html +=
                '<div style="background:#252525;border-radius:10px;padding:12px;">' +

                    '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">' +

                        '<div>' +
                            '<div style="font-size:16px;font-weight:800;color:#fff;">' +
                                formatAr(versement.amount) +
                            '</div>' +

                            '<div style="font-size:10px;color:#64748B;margin-top:3px;">' +
                                'Période : ' +
                                escapeHtml(versement.periode || '-') +
                            '</div>' +

                            '<div style="font-size:10px;color:#64748B;margin-top:2px;">' +
                                formatDate(versement.createdAt) +
                            '</div>' +
                        '</div>' +

                        '<span style="font-size:10px;font-weight:700;padding:5px 8px;border-radius:999px;' +
                            statusStyle(versement.status) +
                        '">' +
                            escapeHtml(statusLabel(versement.status)) +
                        '</span>' +

                    '</div>' +

                '</div>';
        });

        html += '</div>';
    }

    html +=
            '</div>' +
        '</div>';

    return html;
}

async function init_versements() {
    var main =
        document.getElementById('mainContent') ||
        document.getElementById('pageContainer') ||
        document.querySelector('main');

    if (!main) return;

    main.innerHTML =
        getHeaderHTML() +
        '<div style="padding:40px;text-align:center;color:#10B981;">' +
            'Chargement...' +
        '</div>';

    try {
        var data = await loadVersementsData();

        main.innerHTML = renderVersements(data);

    } catch (error) {
        console.error('Erreur versements:', error);

        main.innerHTML =
            getHeaderHTML() +
            '<div style="padding:40px;text-align:center;">' +
                '<div style="color:#F87171;font-size:14px;margin-bottom:8px;">' +
                    'Erreur de chargement des versements' +
                '</div>' +
                '<div style="color:#64748B;font-size:11px;">' +
                    'Veuillez réessayer.' +
                '</div>' +
            '</div>';
    }
}

async function demanderVersement() {
    var input = document.getElementById('versementMontant');
    var button = document.getElementById('btnDemanderVersement');
    var msg = document.getElementById('versementMsg');

    if (!input || !msg) return;

    var amount = Number(input.value);

    if (!Number.isFinite(amount) || amount <= 0) {
        msg.innerHTML =
            '<span style="color:#F87171;">' +
                'Veuillez entrer un montant valide.' +
            '</span>';

        return;
    }

    var periode = new Date().toISOString().slice(0, 7);

    if (button) {
        button.disabled = true;
        button.style.opacity = '0.6';
        button.textContent = 'Envoi...';
    }

    msg.innerHTML = '';

    try {
        /*
         * Le backend identifie automatiquement le chauffeur
         * via req.user.driverId.
         *
         * Le frontend ne transmet donc ni driverId,
         * ni méthode de paiement.
         */
        var result = await window.apiFetch('/finances/versements', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: Math.round(amount),
                periode: periode
            })
        });

        msg.innerHTML =
            '<span style="color:#22C55E;">' +
                'Demande de versement envoyée.' +
            '</span>';

        input.value = '';

        // Recharger pour afficher immédiatement la nouvelle demande.
        setTimeout(function() {
            init_versements();
        }, 500);

        return result;

    } catch (error) {
        console.error('Erreur demande versement:', error);

        msg.innerHTML =
            '<span style="color:#F87171;">' +
                escapeHtml(error.message || 'Erreur lors de la demande') +
            '</span>';

    } finally {
        if (button) {
            button.disabled = false;
            button.style.opacity = '1';
            button.textContent = 'Demander ce versement';
        }
    }
}

window.init_versements = init_versements;
window.demanderVersement = demanderVersement;