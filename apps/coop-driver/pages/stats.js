// ========================================
// COOP DRIVER — STATISTIQUES
// ========================================
// Source métier : GET /api/finances/stats/summary
// Le backend calcule et filtre les statistiques.
// Le frontend se contente de les afficher.
// ========================================

async function init_stats() {
    var container =
        document.getElementById('pageContainer') ||
        document.getElementById('mainContent') ||
        document.querySelector('main');

    if (!container) return;

    container.innerHTML =
        getHeaderHTML() +
        '<div style="padding:16px;max-width:700px;margin:0 auto;padding-bottom:80px;">' +

            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">' +
                '<h2 style="font-size:20px;font-weight:bold;margin:0;">Statistiques</h2>' +
                '<button onclick="refreshStats()" id="btnRefreshStats" ' +
                    'style="border:1px solid #D1D5DB;background:white;border-radius:8px;padding:8px 12px;font-size:12px;font-weight:600;cursor:pointer;">' +
                    'Actualiser' +
                '</button>' +
            '</div>' +

            '<div id="statsLoading" style="text-align:center;padding:30px;color:#6B7280;">' +
                'Chargement des statistiques...' +
            '</div>' +

            '<div id="statsContent" style="display:none;">' +

                '<h3 style="font-size:15px;font-weight:700;margin:0 0 10px;">Aujourd’hui</h3>' +

                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:22px;">' +

                    '<div style="background:white;border-radius:12px;padding:16px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1);">' +
                        '<p style="font-size:12px;color:#6B7280;margin:0 0 6px;">Courses</p>' +
                        '<p id="statTodayCourses" style="font-size:24px;font-weight:bold;color:#10B981;margin:0;">0</p>' +
                    '</div>' +

                    '<div style="background:white;border-radius:12px;padding:16px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1);">' +
                        '<p style="font-size:12px;color:#6B7280;margin:0 0 6px;">CA</p>' +
                        '<p id="statTodayCA" style="font-size:24px;font-weight:bold;color:#10B981;margin:0;">0 Ar</p>' +
                    '</div>' +

                    '<div style="background:white;border-radius:12px;padding:16px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1);">' +
                        '<p style="font-size:12px;color:#6B7280;margin:0 0 6px;">Commission</p>' +
                        '<p id="statTodayCom" style="font-size:24px;font-weight:bold;color:#EF4444;margin:0;">0 Ar</p>' +
                    '</div>' +

                    '<div style="background:white;border-radius:12px;padding:16px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1);">' +
                        '<p style="font-size:12px;color:#6B7280;margin:0 0 6px;">Net</p>' +
                        '<p id="statTodayNet" style="font-size:24px;font-weight:bold;color:#3B82F6;margin:0;">0 Ar</p>' +
                    '</div>' +

                '</div>' +

                '<h3 style="font-size:15px;font-weight:700;margin:0 0 10px;">Cette semaine</h3>' +

                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +

                    '<div style="background:white;border-radius:12px;padding:16px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1);">' +
                        '<p style="font-size:12px;color:#6B7280;margin:0 0 6px;">Courses</p>' +
                        '<p id="statWeekCourses" style="font-size:24px;font-weight:bold;color:#10B981;margin:0;">0</p>' +
                    '</div>' +

                    '<div style="background:white;border-radius:12px;padding:16px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1);">' +
                        '<p style="font-size:12px;color:#6B7280;margin:0 0 6px;">CA</p>' +
                        '<p id="statWeekCA" style="font-size:24px;font-weight:bold;color:#10B981;margin:0;">0 Ar</p>' +
                    '</div>' +

                    '<div style="background:white;border-radius:12px;padding:16px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1);">' +
                        '<p style="font-size:12px;color:#6B7280;margin:0 0 6px;">Commission</p>' +
                        '<p id="statWeekCom" style="font-size:24px;font-weight:bold;color:#EF4444;margin:0;">0 Ar</p>' +
                    '</div>' +

                    '<div style="background:white;border-radius:12px;padding:16px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1);">' +
                        '<p style="font-size:12px;color:#6B7280;margin:0 0 6px;">Net</p>' +
                        '<p id="statWeekNet" style="font-size:24px;font-weight:bold;color:#3B82F6;margin:0;">0 Ar</p>' +
                    '</div>' +

                '</div>' +

                '<div id="statsUpdatedAt" style="text-align:center;color:#9CA3AF;font-size:11px;margin-top:18px;"></div>' +

            '</div>' +

            '<div id="statsError" style="display:none;text-align:center;padding:25px;color:#DC2626;background:#FEF2F2;border-radius:12px;margin-top:12px;">' +
            '</div>' +

        '</div>';

    await refreshStats();
}

async function refreshStats() {
    var loading = document.getElementById('statsLoading');
    var content = document.getElementById('statsContent');
    var errorBox = document.getElementById('statsError');
    var button = document.getElementById('btnRefreshStats');

    if (button) {
        button.disabled = true;
        button.style.opacity = '0.6';
    }

    if (errorBox) {
        errorBox.style.display = 'none';
        errorBox.textContent = '';
    }

    try {
        var result = await window.apiFetch('/finances/stats/summary');

        if (!result || result.error) {
            throw new Error(
                result?.error ||
                result?.message ||
                'Impossible de récupérer les statistiques'
            );
        }

        updateStatElement(
            'statTodayCourses',
            result.today?.count || 0
        );

        updateStatElement(
            'statTodayCA',
            formatAr(result.today?.ca)
        );

        updateStatElement(
            'statTodayCom',
            formatAr(result.today?.com)
        );

        updateStatElement(
            'statTodayNet',
            formatAr(result.today?.net)
        );

        updateStatElement(
            'statWeekCourses',
            result.week?.count || 0
        );

        updateStatElement(
            'statWeekCA',
            formatAr(result.week?.ca)
        );

        updateStatElement(
            'statWeekCom',
            formatAr(result.week?.com)
        );

        updateStatElement(
            'statWeekNet',
            formatAr(result.week?.net)
        );

        if (loading) {
            loading.style.display = 'none';
        }

        if (content) {
            content.style.display = 'block';
        }

        var updatedAt = document.getElementById('statsUpdatedAt');

        if (updatedAt) {
            updatedAt.textContent =
                'Dernière actualisation : ' +
                new Date().toLocaleTimeString('fr-FR');
        }

    } catch (error) {
        console.error('Erreur statistiques Coop :', error);

        if (loading) {
            loading.style.display = 'none';
        }

        if (content) {
            content.style.display = 'none';
        }

        if (errorBox) {
            errorBox.style.display = 'block';
            errorBox.textContent =
                error.message ||
                'Erreur lors du chargement des statistiques';
        }

    } finally {
        if (button) {
            button.disabled = false;
            button.style.opacity = '1';
        }
    }
}

function updateStatElement(id, value) {
    var element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function formatAr(value) {
    var amount = Number(value || 0);

    return amount.toLocaleString('fr-FR') + ' Ar';
}

window.init_stats = init_stats;
window.refreshStats = refreshStats;