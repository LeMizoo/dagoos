```javascript
// ========================================
// DRIVER - STATISTIQUES
// ========================================

var statsRefreshInterval = null;
var statsLoading = false;

// ========================================
// UTILITAIRES
// ========================================

function statsGetUser() {
  try {
    return JSON.parse(localStorage.getItem('dagoo_driver_user') || '{}');
  } catch (e) {
    return {};
  }
}

function statsFormatAmount(value) {
  var amount = Number(value) || 0;
  return amount.toLocaleString('fr-FR') + ' Ar';
}

function statsGetDate(value) {
  if (!value) return null;

  var date = new Date(value);
  if (isNaN(date.getTime())) return null;

  return date;
}

function statsStartOfDay(date) {
  var result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function statsStartOfWeek(date) {
  var result = statsStartOfDay(date);

  // Lundi = début de semaine
  var day = result.getDay();
  var diff = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + diff);
  return result;
}

function statsGetAmount(course) {
  if (!course) return 0;

  if (course.price !== undefined && course.price !== null) {
    return Number(course.price) || 0;
  }

  if (course.amount !== undefined && course.amount !== null) {
    return Number(course.amount) || 0;
  }

  return 0;
}

function statsGetCommission(course) {
  if (!course) return 0;

  if (course.commission !== undefined && course.commission !== null) {
    return Number(course.commission) || 0;
  }

  return 0;
}

function statsSetText(id, value) {
  var element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

// ========================================
// INITIALISATION
// ========================================

async function init_stats() {
  var container =
    document.getElementById('pageContainer') ||
    document.getElementById('mainContent') ||
    document.querySelector('main');

  if (!container) {
    console.warn('Conteneur statistiques introuvable.');
    return;
  }

  container.innerHTML =
    (typeof getHeaderHTML === 'function' ? getHeaderHTML() : '') +

    '<div style="padding:16px;max-width:500px;margin:0 auto;padding-bottom:80px;">' +

      // TITRE
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">' +
        '<div style="width:40px;height:40px;border-radius:12px;background:#DAA52020;display:flex;align-items:center;justify-content:center;color:#DAA520;">' +
          '<i class="fas fa-chart-bar"></i>' +
        '</div>' +
        '<div>' +
          '<h2 style="font-size:20px;font-weight:800;margin:0;color:#fff;">Statistiques</h2>' +
          '<p style="font-size:11px;color:#94A3B8;margin:3px 0 0;">Votre activité et vos revenus</p>' +
        '</div>' +
      '</div>' +

      // AUJOURD'HUI
      '<div style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:12px;">' +

        '<h3 style="color:#DAA520;margin:0 0 12px;font-size:13px;">' +
          '<i class="fas fa-calendar-day" style="margin-right:6px;"></i>' +
          'Aujourd’hui' +
        '</h3>' +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +

          '<div style="background:#252525;border-radius:10px;padding:12px;text-align:center;">' +
            '<div style="font-size:22px;font-weight:800;color:#fff;" id="statTodayCourses">0</div>' +
            '<div style="font-size:10px;color:#94A3B8;">Courses</div>' +
          '</div>' +

          '<div style="background:#252525;border-radius:10px;padding:12px;text-align:center;">' +
            '<div style="font-size:18px;font-weight:800;color:#22C55E;" id="statTodayCA">0 Ar</div>' +
            '<div style="font-size:10px;color:#94A3B8;">CA</div>' +
          '</div>' +

          '<div style="background:#252525;border-radius:10px;padding:12px;text-align:center;">' +
            '<div style="font-size:18px;font-weight:800;color:#F59E0B;" id="statTodayCom">0 Ar</div>' +
            '<div style="font-size:10px;color:#94A3B8;">Commission</div>' +
          '</div>' +

          '<div style="background:#252525;border-radius:10px;padding:12px;text-align:center;">' +
            '<div style="font-size:18px;font-weight:800;color:#8B5CF6;" id="statTodayNet">0 Ar</div>' +
            '<div style="font-size:10px;color:#94A3B8;">Net</div>' +
          '</div>' +

        '</div>' +
      '</div>' +

      // CETTE SEMAINE
      '<div style="background:#1E293B;border-radius:12px;padding:14px;margin-bottom:12px;">' +

        '<h3 style="color:#DAA520;margin:0 0 12px;font-size:13px;">' +
          '<i class="fas fa-calendar-week" style="margin-right:6px;"></i>' +
          'Cette semaine' +
        '</h3>' +

        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +

          '<div style="background:#252525;border-radius:10px;padding:12px;text-align:center;">' +
            '<div style="font-size:22px;font-weight:800;color:#fff;" id="statWeekCourses">0</div>' +
            '<div style="font-size:10px;color:#94A3B8;">Courses</div>' +
          '</div>' +

          '<div style="background:#252525;border-radius:10px;padding:12px;text-align:center;">' +
            '<div style="font-size:18px;font-weight:800;color:#22C55E;" id="statWeekCA">0 Ar</div>' +
            '<div style="font-size:10px;color:#94A3B8;">CA</div>' +
          '</div>' +

          '<div style="background:#252525;border-radius:10px;padding:12px;text-align:center;">' +
            '<div style="font-size:18px;font-weight:800;color:#F59E0B;" id="statWeekCom">0 Ar</div>' +
            '<div style="font-size:10px;color:#94A3B8;">Commission</div>' +
          '</div>' +

          '<div style="background:#252525;border-radius:10px;padding:12px;text-align:center;">' +
            '<div style="font-size:18px;font-weight:800;color:#8B5CF6;" id="statWeekNet">0 Ar</div>' +
            '<div style="font-size:10px;color:#94A3B8;">Net</div>' +
          '</div>' +

        '</div>' +
      '</div>' +

      // INFO
      '<div style="background:#172033;border:1px solid #334155;border-radius:10px;padding:10px 12px;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<i class="fas fa-sync-alt" style="color:#DAA520;font-size:12px;"></i>' +
          '<span style="font-size:10px;color:#94A3B8;">Les statistiques sont actualisées automatiquement.</span>' +
        '</div>' +
      '</div>' +

      '<div id="statsError" style="display:none;margin-top:10px;background:#450A0A;color:#FCA5A5;border-radius:8px;padding:10px;font-size:11px;text-align:center;"></div>' +

    '</div>';

  await refreshDailyStats();

  // Éviter plusieurs intervalles lorsque le routeur recharge la page.
  if (statsRefreshInterval) {
    clearInterval(statsRefreshInterval);
  }

  statsRefreshInterval = setInterval(function() {
    refreshDailyStats();
  }, 30000);
}

// ========================================
// CHARGEMENT DES STATISTIQUES
// ========================================

async function refreshDailyStats() {
  if (statsLoading) return;

  statsLoading = true;

  try {
    var user = statsGetUser();
    var driverId = user.driverId;

    if (!driverId) {
      throw new Error('Chauffeur non identifié.');
    }

    var endpoint = '/finances/courses?driverId=' + encodeURIComponent(driverId);

    var stats = await window.apiFetch(endpoint);

    if (!Array.isArray(stats)) {
      stats = [];
    }

    var now = new Date();
    var startToday = statsStartOfDay(now);
    var startWeek = statsStartOfWeek(now);

    // ========================================
    // AUJOURD'HUI
    // ========================================

    var todayCourses = stats.filter(function(course) {
      var date = statsGetDate(course.date);
      return date && date >= startToday && date <= now;
    });

    var todayCA = todayCourses.reduce(function(sum, course) {
      return sum + statsGetAmount(course);
    }, 0);

    var todayCommission = todayCourses.reduce(function(sum, course) {
      return sum + statsGetCommission(course);
    }, 0);

    // Le net dépend des données retournées par le backend.
    // Si commission est disponible, net = CA - commission.
    var todayNet = todayCA - todayCommission;

    // ========================================
    // CETTE SEMAINE
    // ========================================

    var weekCourses = stats.filter(function(course) {
      var date = statsGetDate(course.date);
      return date && date >= startWeek && date <= now;
    });

    var weekCA = weekCourses.reduce(function(sum, course) {
      return sum + statsGetAmount(course);
    }, 0);

    var weekCommission = weekCourses.reduce(function(sum, course) {
      return sum + statsGetCommission(course);
    }, 0);

    var weekNet = weekCA - weekCommission;

    // ========================================
    // AFFICHAGE
    // ========================================

    statsSetText(
      'statTodayCourses',
      todayCourses.length.toLocaleString('fr-FR')
    );

    statsSetText(
      'statTodayCA',
      statsFormatAmount(todayCA)
    );

    statsSetText(
      'statTodayCom',
      statsFormatAmount(todayCommission)
    );

    statsSetText(
      'statTodayNet',
      statsFormatAmount(todayNet)
    );

    statsSetText(
      'statWeekCourses',
      weekCourses.length.toLocaleString('fr-FR')
    );

    statsSetText(
      'statWeekCA',
      statsFormatAmount(weekCA)
    );

    statsSetText(
      'statWeekCom',
      statsFormatAmount(weekCommission)
    );

    statsSetText(
      'statWeekNet',
      statsFormatAmount(weekNet)
    );

    var errorElement = document.getElementById('statsError');

    if (errorElement) {
      errorElement.style.display = 'none';
      errorElement.textContent = '';
    }

  } catch (error) {
    console.warn(
      'Erreur de récupération des statistiques chauffeur:',
      error
    );

    var errorElement = document.getElementById('statsError');

    if (errorElement) {
      errorElement.textContent =
        error && error.message
          ? error.message
          : 'Impossible de récupérer les statistiques.';

      errorElement.style.display = 'block';
    }

  } finally {
    statsLoading = false;
  }
}

// ========================================
// NETTOYAGE
// ========================================

function destroyStatsPage() {
  if (statsRefreshInterval) {
    clearInterval(statsRefreshInterval);
    statsRefreshInterval = null;
  }

  statsLoading = false;
}

// ========================================
// EXPORTS
// ========================================

window.init_stats = init_stats;
window.refreshDailyStats = refreshDailyStats;
window.destroyStatsPage = destroyStatsPage;
```
