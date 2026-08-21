/**
 * COOP DRIVER — DÉPARTS
 *
 * Cette page remplace l'ancien écran Fleet "Mes Courses".
 * Source métier : GET /api/departs/mine
 *
 * Le backend reste la source de vérité pour :
 * - le départ
 * - le véhicule
 * - les passagers
 * - les paiements
 * - la recette
 * - le versement Coop
 * - la commission chauffeur
 */

async function init_courses() {
    var main = document.getElementById('mainContent');

    if (!main) return;

    main.innerHTML =
        getHeaderHTML() +
        '<div style="padding:16px;max-width:500px;margin:0 auto;padding-bottom:80px;">' +
            '<div style="text-align:center;padding:40px;color:#10B981;">Chargement...</div>' +
        '</div>';

    try {
        var result = await window.apiFetch('/departs/mine');

        renderDepartPage(result);
    } catch (error) {
        console.error('Erreur récupération départ Coop:', error);

        main.innerHTML =
            getHeaderHTML() +
            '<div style="padding:16px;max-width:500px;margin:0 auto;padding-bottom:80px;">' +
                '<div style="background:#450A0A;border-radius:12px;padding:20px;text-align:center;">' +
                    '<div style="font-size:14px;font-weight:700;color:#FCA5A5;margin-bottom:8px;">' +
                        'Impossible de récupérer le départ' +
                    '</div>' +
                    '<div style="font-size:11px;color:#FECACA;">' +
                        escapeHtml(error.message || 'Erreur réseau') +
                    '</div>' +
                    '<button onclick="init_courses()" style="margin-top:14px;padding:10px 16px;background:#10B981;color:#0A1F18;border:none;border-radius:8px;font-weight:700;cursor:pointer;">' +
                        'Réessayer' +
                    '</button>' +
                '</div>' +
            '</div>';
    }
}


/**
 * Affichage principal du départ.
 */
function renderDepartPage(data) {
    var main = document.getElementById('mainContent');

    if (!main) return;

    if (!data || !data.depart) {
        main.innerHTML =
            getHeaderHTML() +
            '<div style="padding:16px;max-width:500px;margin:0 auto;padding-bottom:80px;">' +
                '<div style="background:#0A1F18;border-radius:12px;padding:24px;text-align:center;">' +
                    '<div style="font-size:18px;font-weight:800;color:#fff;margin-bottom:8px;">' +
                        'Aucun départ aujourd’hui' +
                    '</div>' +
                    '<div style="font-size:12px;color:#94A3B8;">' +
                        'Aucun départ ne vous est actuellement assigné.' +
                    '</div>' +
                '</div>' +
            '</div>';

        return;
    }

    var depart = data.depart;
    var vehicle = data.vehicle || {};
    var passagers = Array.isArray(data.passagers) ? data.passagers : [];
    var finance = data.finance || {};

    var statut = depart.statut || 'PUBLISHED';

    var statutLabel = getDepartStatutLabel(statut);
    var statutColor = getDepartStatutColor(statut);

    var payes = Number(finance.passagersPayes || 0);
    var totalPassagers = Number(finance.passagersTotal || passagers.length);
    var placesTotal = Number(finance.placesTotal || depart.placesTotal || 0);
    var placesRestantes = Number(
        finance.placesRestantes !== undefined
            ? finance.placesRestantes
            : Math.max(0, placesTotal - totalPassagers)
    );

    var recette = Number(finance.recette || 0);
    var versementCoop = Number(finance.versementCoop || 0);
    var commissionChauffeur = Number(finance.commissionChauffeur || 0);

    var html =
        getHeaderHTML() +

        '<div style="padding:16px;max-width:500px;margin:0 auto;padding-bottom:80px;">' +

            // Titre
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
                '<div>' +
                    '<h2 style="font-size:20px;font-weight:800;color:#fff;margin:0;">Mes départs</h2>' +
                    '<div style="font-size:11px;color:#94A3B8;margin-top:4px;">Départ du jour</div>' +
                '</div>' +
                '<span style="padding:5px 9px;border-radius:20px;background:' + statutColor + ';color:#fff;font-size:10px;font-weight:800;">' +
                    statutLabel +
                '</span>' +
            '</div>' +

            // Départ
            '<div style="background:#064E3B;border-radius:14px;padding:18px;margin-bottom:12px;">' +

                '<div style="font-size:10px;color:#6EE7B7;font-weight:700;margin-bottom:12px;">' +
                    'TRAJET' +
                '</div>' +

                '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">' +
                    '<div style="flex:1;">' +
                        '<div style="font-size:10px;color:#94A3B8;">Départ</div>' +
                        '<div style="font-size:17px;font-weight:800;color:#fff;margin-top:3px;">' +
                            escapeHtml(depart.pointDepart || '-') +
                        '</div>' +
                    '</div>' +

                    '<div style="font-size:18px;color:#10B981;">→</div>' +

                    '<div style="flex:1;text-align:right;">' +
                        '<div style="font-size:10px;color:#94A3B8;">Destination</div>' +
                        '<div style="font-size:17px;font-weight:800;color:#fff;margin-top:3px;">' +
                            escapeHtml(depart.destination || '-') +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +

                    '<div style="background:#0A1F18;border-radius:9px;padding:10px;">' +
                        '<div style="font-size:9px;color:#94A3B8;">Heure</div>' +
                        '<div style="font-size:15px;font-weight:800;color:#fff;margin-top:3px;">' +
                            escapeHtml(depart.heure || '-') +
                        '</div>' +
                    '</div>' +

                    '<div style="background:#0A1F18;border-radius:9px;padding:10px;">' +
                        '<div style="font-size:9px;color:#94A3B8;">Tarif</div>' +
                        '<div style="font-size:15px;font-weight:800;color:#10B981;margin-top:3px;">' +
                            formatAr(depart.prix) +
                        '</div>' +
                    '</div>' +

                    '<div style="background:#0A1F18;border-radius:9px;padding:10px;">' +
                        '<div style="font-size:9px;color:#94A3B8;">Véhicule</div>' +
                        '<div style="font-size:13px;font-weight:800;color:#fff;margin-top:3px;">' +
                            escapeHtml(vehicle.plate || '-') +
                        '</div>' +
                    '</div>' +

                    '<div style="background:#0A1F18;border-radius:9px;padding:10px;">' +
                        '<div style="font-size:9px;color:#94A3B8;">Occupation</div>' +
                        '<div style="font-size:13px;font-weight:800;color:#fff;margin-top:3px;">' +
                            totalPassagers + '/' + placesTotal +
                        '</div>' +
                    '</div>' +

                '</div>' +
            '</div>' +

            // Résumé occupation
            '<div style="background:#0A1F18;border-radius:12px;padding:16px;margin-bottom:12px;">' +

                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
                    '<span style="font-size:12px;font-weight:700;color:#fff;">Occupation</span>' +
                    '<span style="font-size:12px;font-weight:800;color:#10B981;">' +
                        totalPassagers + '/' + placesTotal +
                    '</span>' +
                '</div>' +

                '<div style="height:8px;background:#1E293B;border-radius:20px;overflow:hidden;">' +
                    '<div style="height:100%;width:' +
                        calculateOccupation(totalPassagers, placesTotal) +
                        '%;background:#10B981;border-radius:20px;"></div>' +
                '</div>' +

                '<div style="display:flex;justify-content:space-between;margin-top:8px;font-size:10px;color:#94A3B8;">' +
                    '<span>' + payes + ' payé(s)</span>' +
                    '<span>' + placesRestantes + ' place(s) restante(s)</span>' +
                '</div>' +

            '</div>' +

            // Manifest
            '<div style="background:#064E3B;border-radius:12px;padding:16px;margin-bottom:12px;">' +

                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
                    '<div style="font-size:14px;font-weight:800;color:#fff;">Manifest passagers</div>' +
                    '<div style="font-size:10px;color:#6EE7B7;">' +
                        passagers.length + ' passager(s)' +
                    '</div>' +
                '</div>' +

                renderPassagers(passagers) +

            '</div>' +

            // Finance
            '<div style="background:#064E3B;border-radius:12px;padding:16px;margin-bottom:12px;">' +

                '<div style="font-size:14px;font-weight:800;color:#fff;margin-bottom:14px;">Récapitulatif financier</div>' +

                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +

                    '<div style="background:#0A1F18;border-radius:9px;padding:12px;">' +
                        '<div style="font-size:9px;color:#94A3B8;">Passagers payés</div>' +
                        '<div style="font-size:18px;font-weight:800;color:#10B981;margin-top:4px;">' +
                            payes + '/' + totalPassagers +
                        '</div>' +
                    '</div>' +

                    '<div style="background:#0A1F18;border-radius:9px;padding:12px;">' +
                        '<div style="font-size:9px;color:#94A3B8;">Recette</div>' +
                        '<div style="font-size:18px;font-weight:800;color:#10B981;margin-top:4px;">' +
                            formatAr(recette) +
                        '</div>' +
                    '</div>' +

                    '<div style="background:#0A1F18;border-radius:9px;padding:12px;">' +
                        '<div style="font-size:9px;color:#94A3B8;">Versement Coop</div>' +
                        '<div style="font-size:18px;font-weight:800;color:#60A5FA;margin-top:4px;">' +
                            formatAr(versementCoop) +
                        '</div>' +
                    '</div>' +

                    '<div style="background:#0A1F18;border-radius:9px;padding:12px;">' +
                        '<div style="font-size:9px;color:#94A3B8;">Commission chauffeur</div>' +
                        '<div style="font-size:18px;font-weight:800;color:#F59E0B;margin-top:4px;">' +
                            formatAr(commissionChauffeur) +
                        '</div>' +
                    '</div>' +

                '</div>' +

            '</div>' +

            // Action départ
            renderDepartAction(depart) +

            // Actualiser
            '<button onclick="init_courses()" style="width:100%;margin-top:10px;padding:11px;background:#1E293B;color:#CBD5E1;border:none;border-radius:8px;font-weight:700;cursor:pointer;">' +
                'Actualiser' +
            '</button>' +

        '</div>';

    main.innerHTML = html;
}


/**
 * Manifest passagers.
 */
function renderPassagers(passagers) {
    if (!passagers.length) {
        return (
            '<div style="padding:20px;text-align:center;background:#0A1F18;border-radius:9px;">' +
                '<div style="font-size:12px;color:#94A3B8;">Aucun passager réservé</div>' +
            '</div>'
        );
    }

    return passagers.map(function(p) {
        var confirmed = p.statut === 'CONFIRMED';

        var statutLabel = confirmed ? 'PAYÉ' : 'EN ATTENTE';

        var statutBackground = confirmed ? '#10B981' : '#F59E0B';

        return (
            '<div style="background:#0A1F18;border-radius:9px;padding:11px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">' +

                '<div style="min-width:0;">' +
                    '<div style="font-size:12px;font-weight:700;color:#fff;">' +
                        escapeHtml(p.passagerNom || 'Passager') +
                    '</div>' +
                    '<div style="font-size:10px;color:#94A3B8;margin-top:3px;">' +
                        'Place ' + escapeHtml(p.place || '-') +
                        (p.telephone ? ' · ' + escapeHtml(p.telephone) : '') +
                    '</div>' +
                '</div>' +

                '<span style="flex-shrink:0;margin-left:8px;padding:4px 8px;border-radius:20px;background:' +
                    statutBackground +
                    ';color:#0A1F18;font-size:9px;font-weight:800;">' +
                    statutLabel +
                '</span>' +

            '</div>'
        );
    }).join('');
}


/**
 * Actions autorisées sur le départ.
 *
 * Le backend valide réellement la transition.
 */
function renderDepartAction(depart) {
    if (!depart) return '';

    if (depart.statut === 'PUBLISHED') {
        return (
            '<button onclick="demarrerEmbarquementCoop(\'' +
                escapeAttribute(depart.id) +
            '\')" id="btnStartEmbarquement" style="width:100%;padding:13px;background:#10B981;color:#0A1F18;border:none;border-radius:9px;font-weight:800;cursor:pointer;">' +
                'Commencer l’embarquement' +
            '</button>'
        );
    }

    if (depart.statut === 'EMBARQUEMENT') {
        return (
            '<button onclick="terminerDepartCoop(\'' +
                escapeAttribute(depart.id) +
            '\')" id="btnTerminerDepart" style="width:100%;padding:13px;background:#F59E0B;color:#0A1F18;border:none;border-radius:9px;font-weight:800;cursor:pointer;">' +
                'Terminer le départ' +
            '</button>'
        );
    }

    if (depart.statut === 'TERMINÉ') {
        return (
            '<div style="background:#064E3B;border-radius:9px;padding:13px;text-align:center;color:#6EE7B7;font-size:12px;font-weight:800;">' +
                'Départ terminé' +
            '</div>'
        );
    }

    return '';
}


/**
 * Démarrer l'embarquement.
 */
async function demarrerEmbarquementCoop(departId) {
    if (!departId) return;

    if (!confirm('Commencer l’embarquement pour ce départ ?')) {
        return;
    }

    var button = document.getElementById('btnStartEmbarquement');

    try {
        if (button) {
            button.disabled = true;
            button.textContent = 'Mise à jour...';
        }

        var result = await window.apiFetch('/departs/' + departId + '/transition', {
            method: 'POST',
            body: {
                action: 'start_embarquement'
            }
        });

        if (!result || result.error) {
            throw new Error(
                result && result.error
                    ? result.error
                    : 'Transition impossible'
            );
        }

        await init_courses();

    } catch (error) {
        console.error('Erreur démarrage embarquement:', error);
        alert('Erreur : ' + (error.message || 'Transition impossible'));

        if (button) {
            button.disabled = false;
            button.textContent = 'Commencer l’embarquement';
        }
    }
}


/**
 * Terminer le départ.
 */
async function terminerDepartCoop(departId) {
    if (!departId) return;

    if (!confirm('Confirmer la fin de ce départ ?')) {
        return;
    }

    var button = document.getElementById('btnTerminerDepart');

    try {
        if (button) {
            button.disabled = true;
            button.textContent = 'Mise à jour...';
        }

        var result = await window.apiFetch('/departs/' + departId + '/transition', {
            method: 'POST',
            body: {
                action: 'terminer'
            }
        });

        if (!result || result.error) {
            throw new Error(
                result && result.error
                    ? result.error
                    : 'Transition impossible'
            );
        }

        await init_courses();

    } catch (error) {
        console.error('Erreur terminaison départ:', error);
        alert('Erreur : ' + (error.message || 'Transition impossible'));

        if (button) {
            button.disabled = false;
            button.textContent = 'Terminer le départ';
        }
    }
}


/**
 * Helpers
 */
function formatAr(value) {
    var number = Number(value || 0);

    return number.toLocaleString('fr-FR') + ' Ar';
}

function calculateOccupation(current, total) {
    current = Number(current || 0);
    total = Number(total || 0);

    if (total <= 0) return 0;

    return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
}

function getDepartStatutLabel(statut) {
    var labels = {
        PUBLISHED: 'PUBLISHED',
        EMBARQUEMENT: 'EMBARQUEMENT',
        'TERMINÉ': 'TERMINÉ'
    };

    return labels[statut] || statut;
}

function getDepartStatutColor(statut) {
    if (statut === 'PUBLISHED') return '#3B82F6';
    if (statut === 'EMBARQUEMENT') return '#F59E0B';
    if (statut === 'TERMINÉ') return '#10B981';

    return '#64748B';
}

function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttribute(value) {
    return String(value === undefined || value === null ? '' : value)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");
}


/**
 * Exposition globale pour le routeur PWA.
 */
window.init_courses = init_courses;
window.demarrerEmbarquementCoop = demarrerEmbarquementCoop;
window.terminerDepartCoop = terminerDepartCoop;