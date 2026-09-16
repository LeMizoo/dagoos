// ========================================
// DRIVER FLEET — COURSES
// Historique + courses acceptées
// ========================================

var coursesData = [];
var coursesFilter = 'all';

// ========================================
// INITIALISATION
// ========================================

async function init_courses() {
    var container = document.getElementById('mainContent') || document.querySelector('main');

    if (!container) return;

    container.innerHTML =
        getHeaderHTML() +
        '<div style="padding:12px;max-width:500px;margin:0 auto;padding-bottom:90px;">' +

            // TITRE
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
                '<div>' +
                    '<h2 style="font-size:20px;font-weight:800;margin:0;color:var(--text-primary);">Courses</h2>' +
                    '<div style="font-size:11px;color:var(--text-muted);margin-top:3px;">Historique de vos courses</div>' +
                '</div>' +
                '<button onclick="init_courses()" style="background:var(--bg-surface);border:1px solid var(--border-strong);color:var(--text-primary);border-radius:8px;padding:8px 10px;cursor:pointer;font-size:11px;">' +
                    'Actualiser' +
                '</button>' +
            '</div>' +

            // COURSES — source de vérité API

            // FILTRES
            '<div style="background:var(--bg-surface);border-radius:12px;padding:10px;margin-bottom:10px;">' +
                '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">' +
                    '<button onclick="filterCourses(\'all\')" id="filterAll" style="' + filterButtonStyle('all') + '">Toutes</button>' +
                    '<button onclick="filterCourses(\'today\')" id="filterToday" style="' + filterButtonStyle('today') + '">Aujourd’hui</button>' +
                    '<button onclick="filterCourses(\'week\')" id="filterWeek" style="' + filterButtonStyle('week') + '">Semaine</button>' +
                '</div>' +
            '</div>' +

            // RÉSUMÉ
            '<div id="coursesSummary" style="margin-bottom:10px;"></div>' +

            // LISTE
            '<div id="coursesHistory">' +
                '<div style="text-align:center;padding:30px;color:var(--text-muted);">Chargement...</div>' +
            '</div>' +

        '</div>';

    await loadCourses();
}


// ========================================
// STYLE FILTRES
// ========================================

function filterButtonStyle(filter) {
    var active = coursesFilter === filter;

    return active
        ? 'padding:8px 4px;border:none;border-radius:8px;background:var(--accent);color:var(--text-on-accent);font-size:11px;font-weight:700;cursor:pointer;'
        : 'padding:8px 4px;border:1px solid var(--border-strong);border-radius:8px;background:var(--bg-soft);color:var(--text-muted);font-size:11px;font-weight:600;cursor:pointer;';
}


// ========================================
// CHARGEMENT DES COURSES
// ========================================

async function loadCourses() {
    var history = document.getElementById('coursesHistory');

    if (history) {
        history.innerHTML =
            '<div style="text-align:center;padding:30px;color:var(--text-muted);">Chargement des courses...</div>';
    }

    var user = getDriverUser();

    if (!user.driverId) {
        if (history) {
            history.innerHTML =
                '<div style="background:var(--error-bg);color:var(--error-fg);padding:14px;border-radius:10px;text-align:center;">' +
                    'Chauffeur non identifié.' +
                '</div>';
        }
        return;
    }

    try {
        var response = await window.apiGet(
            '/finances/courses?driverId=' + encodeURIComponent(user.driverId)
        );

        coursesData = Array.isArray(response)
            ? response
            : Array.isArray(response?.courses)
                ? response.courses
                : [];

        renderCourses();

    } catch (error) {
        console.error('Erreur chargement courses:', error);

        if (history) {
            history.innerHTML =
                '<div style="background:var(--error-bg);color:var(--error-fg);padding:14px;border-radius:10px;text-align:center;">' +
                    'Impossible de charger l’historique des courses.' +
                '</div>';
        }
    }
}


// ========================================
// FILTRAGE
// ========================================

function filterCourses(filter) {
    coursesFilter = filter;

    var filters = ['all', 'today', 'week'];

    filters.forEach(function(name) {
        var button = document.getElementById('filter' + capitalize(name));

        if (button) {
            button.style.cssText = filterButtonStyle(name);
        }
    });

    renderCourses();
}


// ========================================
// RENDU HISTORIQUE
// ========================================

function renderCourses() {
    var history = document.getElementById('coursesHistory');
    var summary = document.getElementById('coursesSummary');

    if (!history) return;

    var filtered = coursesData.filter(function(course) {
        return courseMatchesFilter(course);
    });

    // Plus récentes en premier
    filtered.sort(function(a, b) {
        return getCourseTimestamp(b) - getCourseTimestamp(a);
    });

    renderSummary(filtered, summary);

    if (filtered.length === 0) {
        history.innerHTML =
            '<div style="background:var(--bg-surface);border-radius:12px;padding:30px 15px;text-align:center;">' +
                '<div style="font-size:28px;margin-bottom:8px;">📋</div>' +
                '<div style="color:var(--text-primary);font-weight:700;margin-bottom:4px;">Aucune course</div>' +
                '<div style="color:var(--text-muted);font-size:11px;">Aucune course pour cette période.</div>' +
            '</div>';

        return;
    }

    var html = '';

    filtered.forEach(function(course) {
        html += renderCourseCard(course);
    });

    history.innerHTML = html;
}


// ========================================
// RÉSUMÉ
// ========================================

function renderSummary(courses, container) {
    if (!container) return;

    var total = courses.reduce(function(sum, course) {
        return sum + getCourseAmount(course);
    }, 0);

    var commission = courses.reduce(function(sum, course) {
        return sum + getCourseCommission(course);
    }, 0);

    var net = courses.reduce(function(sum, course) {
        return sum + getCourseNet(course);
    }, 0);

    container.innerHTML =
        '<div style="background:var(--bg-surface);border-radius:12px;padding:12px;">' +
            '<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">Résumé de la période</div>' +
            '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;text-align:center;">' +

                '<div style="background:var(--bg-soft);border-radius:9px;padding:9px 4px;">' +
                    '<div style="font-size:16px;font-weight:800;color:var(--text-primary);">' +
                        courses.length +
                    '</div>' +
                    '<div style="font-size:9px;color:var(--text-muted);">Courses</div>' +
                '</div>' +

                '<div style="background:var(--bg-soft);border-radius:9px;padding:9px 4px;">' +
                    '<div style="font-size:14px;font-weight:800;color:var(--success-fg);">' +
                        formatAr(total) +
                    '</div>' +
                    '<div style="font-size:9px;color:var(--text-muted);">CA</div>' +
                '</div>' +

                '<div style="background:var(--bg-soft);border-radius:9px;padding:9px 4px;">' +
                    '<div style="font-size:14px;font-weight:800;color:var(--gold);">' +
                        formatAr(net) +
                    '</div>' +
                    '<div style="font-size:9px;color:var(--text-muted);">Net</div>' +
                '</div>' +

            '</div>' +
        '</div>';
}


// ========================================
// CARTE COURSE
// ========================================


function getCourseDate(course) {
    if (!course) return '-';
    if (course.date) return String(course.date).split('T')[0];
    if (course.createdAt) return String(course.createdAt).split('T')[0];
    return '-';
}

function renderCourseActions(course) {
    var status = String(
        course.status ||
        course.statut ||
        course.state ||
        'TERMINEE'
    ).toUpperCase();

    var courseId = course.id;

    if (!courseId) return '';

    var html =
        '<div style="display:grid;gap:6px;margin-top:10px;">';

    if (status === 'EN_ATTENTE') {
        html +=
            '<button data-action="demarrer-course" data-course-id="' +
            escapeHtml(courseId) +
            '" style="width:100%;background:var(--text-primary);color:var(--text-on-accent);border:none;padding:9px;border-radius:7px;font-weight:700;font-size:11px;cursor:pointer;">' +
                'Démarrer' +
            '</button>';
    }

    if (status === 'EN_ROUTE') {
        html +=
            '<button data-action="prendre-en-charge" data-course-id="' +
            escapeHtml(courseId) +
            '" style="width:100%;background:var(--gold);color:var(--text-primary);border:none;padding:9px;border-radius:7px;font-weight:700;font-size:11px;cursor:pointer;">' +
                'Client pris en charge' +
            '</button>';
    }

    if (status === 'EN_ROUTE' || status === 'EN_COURS') {
        html +=
            '<button data-action="terminer-course" data-course-id="' +
            escapeHtml(courseId) +
            '" style="width:100%;background:var(--accent);color:var(--text-on-accent);border:none;padding:9px;border-radius:7px;font-weight:700;font-size:11px;cursor:pointer;">' +
                'Terminer' +
            '</button>';
    }

    html += '</div>';

    return html;
}


function renderCourseCard(course) {
    var amount = getCourseAmount(course);
    var commission = getCourseCommission(course);
    var net = getCourseNet(course);

    var type = getCourseTypeLabel(course);
    var date = getCourseDate(course);
    var distance = getCourseDistance(course);

    var status = String(
        course.status ||
        course.statut ||
        course.state ||
        'COMPLETED'
    ).toUpperCase();

    var statusLabel = getStatusLabel(status);
    var statusColor = getStatusColor(status);

    return (
        '<div style="background:var(--bg-surface);border-radius:12px;padding:13px;margin-bottom:8px;">' +

            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">' +

                '<div style="min-width:0;">' +
                    '<div style="font-size:13px;font-weight:700;color:var(--text-primary);">' +
                        escapeHtml(type) +
                    '</div>' +

                    '<div style="font-size:10px;color:var(--text-muted);margin-top:3px;">' +
                        escapeHtml(date) +
                    '</div>' +

                '</div>' +

                '<span style="flex-shrink:0;background:' + statusColor + ';color:var(--text-primary);padding:3px 7px;border-radius:10px;font-size:9px;font-weight:700;">' +
                    statusLabel +
                '</span>' +

            '</div>' +

            '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px;">' +

                '<div style="background:var(--bg-soft);border-radius:8px;padding:8px;text-align:center;">' +
                    '<div style="font-size:13px;font-weight:800;color:var(--success-fg);">' +
                        formatAr(amount) +
                    '</div>' +
                    '<div style="font-size:8px;color:var(--text-muted);">CA</div>' +
                '</div>' +

                '<div style="background:var(--bg-soft);border-radius:8px;padding:8px;text-align:center;">' +
                    '<div style="font-size:13px;font-weight:800;color:var(--text-primary);">' +
                        formatAr(commission) +
                    '</div>' +
                    '<div style="font-size:8px;color:var(--text-muted);">Versement</div>' +
                '</div>' +

                '<div style="background:var(--bg-soft);border-radius:8px;padding:8px;text-align:center;">' +
                    '<div style="font-size:13px;font-weight:800;color:var(--gold);">' +
                        formatAr(net) +
                    '</div>' +
                    '<div style="font-size:8px;color:var(--text-muted);">Net</div>' +
                '</div>' +

            '</div>' +

            (
                distance > 0
                    ? '<div style="font-size:10px;color:var(--text-muted);margin-top:8px;">Distance : <strong style="color:var(--text-primary);">' +
                        distance.toFixed(1) +
                        ' km</strong></div>'
                    : ''
            ) +

            renderCourseActions(course) +

        '</div>'
    );
}


// ========================================
// ACTIONS COURSE — API
// ========================================

async function demarrerCourse(courseId) {
    if (!courseId) return;

    try {
        var response = await fetch(
            getApiUrl() + '/finances/courses/' +
            encodeURIComponent(courseId) + '/start',
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + getDriverToken(),
                    'Content-Type': 'application/json'
                }
            }
        );

        var data = await response.json().catch(function() {
            return {};
        });

        if (!response.ok) {
            alert(data.error || 'Impossible de démarrer la course');
            return;
        }

        alert('Course démarrée !');
        await loadCourses();

    } catch (error) {
        console.error('Démarrage course:', error);
        alert('Erreur réseau lors du démarrage');
    }
}


// ========================================
// PRISE EN CHARGE CLIENT
// ========================================

async function prendreEnCharge(courseId) {
    if (!courseId) return;

    try {
        var response = await fetch(
            getApiUrl() + '/finances/courses/' +
            encodeURIComponent(courseId) + '/pickup',
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + getDriverToken(),
                    'Content-Type': 'application/json'
                }
            }
        );

        var data = await response.json().catch(function() {
            return {};
        });

        if (!response.ok) {
            alert(data.error || 'Impossible de prendre en charge le client');
            return;
        }

        alert('Client pris en charge !');
        await loadCourses();

    } catch (error) {
        console.error('Prise en charge:', error);
        alert('Erreur réseau lors de la prise en charge');
    }
}


// ========================================
// TERMINER COURSE
// ========================================

async function terminerCourse(courseId) {
    if (!courseId) return;

    try {
        var response = await fetch(
            getApiUrl() + '/finances/courses/' +
            encodeURIComponent(courseId) + '/complete',
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + getDriverToken(),
                    'Content-Type': 'application/json'
                }
            }
        );

        var data = await response.json().catch(function() {
            return {};
        });

        if (!response.ok) {
            alert(data.error || 'Impossible de terminer la course');
            return;
        }

        alert('Course terminée !');
        await loadCourses();

    } catch (error) {
        console.error('Fin course:', error);
        alert('Erreur réseau lors de la fin de course');
    }
}


// ========================================
// ACTIONS COURSE — FIN
// ========================================

// ========================================
// FILTRES DE DATE
// ========================================

function courseMatchesFilter(course) {
    if (coursesFilter === 'all') return true;

    var timestamp = getCourseTimestamp(course);

    if (!timestamp) return false;

    var date = new Date(timestamp);
    var now = new Date();

    if (coursesFilter === 'today') {
        return (
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() === now.getDate()
        );
    }

    if (coursesFilter === 'week') {
        var currentDay = now.getDay();

        // Lundi = début de semaine
        var mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

        var monday = new Date(now);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(now.getDate() + mondayOffset);

        return date >= monday;
    }

    return true;
}


// ========================================
// DONNÉES COURSE
// ========================================

function getCourseTimestamp(course) {
    var value =
        course.date ||
        course.createdAt ||
        course.created_at ||
        course.timestamp;

    if (!value) return 0;

    var timestamp = new Date(value).getTime();

    return isNaN(timestamp) ? 0 : timestamp;
}

function getCourseAmount(course) {
    var value =
        course.price ??
        course.amount ??
        course.montant ??
        course.total ??
        0;

    return Number(value) || 0;
}

function getCourseCommission(course) {
    var value =
        course.commission ??
        course.versement ??
        course.driverCommission ??
        course.driver_commission;

    if (value !== undefined && value !== null) {
        return Number(value) || 0;
    }

    // Compatibilité avec les anciennes données.
    // Le calcul n'est utilisé que si l'API ne fournit aucune valeur.
    var pct = (typeof getCommissionPct === 'function') ? getCommissionPct() : 20;
    return Math.round(getCourseAmount(course) * ((100 - pct) / 100));
}

function getCourseNet(course) {
    var value =
        course.net ??
        course.netAmount ??
        course.driverNet ??
        course.driver_net;

    if (value !== undefined && value !== null) {
        return Number(value) || 0;
    }

    var amount = getCourseAmount(course);
    var versement = getCourseCommission(course);

    return Math.max(0, amount - versement);
}

function getCourseDistance(course) {
    return Number(
        course.distanceKm ??
        course.distance ??
        course.distance_km ??
        0
    ) || 0;
}

function getCourseTypeLabel(course) {
    var type = String(
        course.type ||
        course.courseType ||
        course.course_type ||
        'course'
    ).toLowerCase();

    var labels = {
        course: 'Course normale',
        courseNormale: 'Course normale',
        normale: 'Course normale',
        normal: 'Course normale',
        ady_varotra: 'Ady Varotra',
        adyVarotra: 'Ady Varotra',
        ady: 'Ady Varotra',
        location: 'Location journalière',
        locationJournalier: 'Location journalière',
        locationSpeciale: 'Location spéciale',
        tarifFixe: 'Trajet (tarif fixe)'
    };

    return labels[type] || course.type || 'Course';
}


// ========================================
// STATUT
// ========================================

function getStatusLabel(status) {
    var labels = {
        COMPLETED: 'Terminée',
        COMPLETE: 'Terminée',
        FINISHED: 'Terminée',
        DONE: 'Terminée',
        IN_PROGRESS: 'En cours',
        PENDING: 'En attente',
        CANCELLED: 'Annulée',
        CANCELED: 'Annulée',
        ACCEPTED: 'Acceptée'
    };

    return labels[status] || 'Terminée';
}

function getStatusColor(status) {
    var colors = {
        COMPLETED: 'var(--success-fg)',
        COMPLETE: 'var(--success-fg)',
        FINISHED: 'var(--success-fg)',
        DONE: 'var(--success-fg)',
        IN_PROGRESS: 'var(--text-primary)',
        PENDING: 'var(--gold)',
        CANCELLED: 'var(--error-fg)',
        CANCELED: 'var(--error-fg)',
        ACCEPTED: 'var(--gold)'
    };

    return colors[status] || 'var(--success-fg)';
}


// ========================================
// CHAUFFEUR
// ========================================

function getDriverUser() {
    try {
        return JSON.parse(
            localStorage.getItem('dagoo_driver_user') || '{}'
        );
    } catch (error) {
        return {};
    }
}


// ========================================
// FORMATAGE
// ========================================

function formatAr(value) {
    return (Number(value) || 0).toLocaleString('fr-FR') + ' Ar';
}

function formatDate(value) {
    if (!value) return '';

    var date = new Date(value);

    if (isNaN(date.getTime())) return '';

    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


// ========================================
// API PUBLIQUE
// ========================================

window.init_courses = init_courses;
window.loadCourses = loadCourses;
window.filterCourses = filterCourses;
// P7-E2-B-FIX-3 : délégation sécurisée des actions dynamiques.
if (!window.__p7e2bFix3FleetCoursesDelegation) {
    window.__p7e2bFix3FleetCoursesDelegation = true;

    document.addEventListener('click', function (event) {
        var button = event.target.closest(
            'button[data-action="demarrer-course"], ' +
            'button[data-action="prendre-en-charge"], ' +
            'button[data-action="terminer-course"]'
        );

        if (!button) return;

        var action = button.getAttribute('data-action');
        var courseId = button.getAttribute('data-course-id');

        if (!courseId) return;

        if (action === 'demarrer-course') {
            window.demarrerCourse(courseId);
        } else if (action === 'prendre-en-charge') {
            window.prendreEnCharge(courseId);
        } else if (action === 'terminer-course') {
            window.terminerCourse(courseId);
        }
    });
}

window.demarrerCourse = demarrerCourse;
window.prendreEnCharge = prendreEnCharge;
window.terminerCourse = terminerCourse;