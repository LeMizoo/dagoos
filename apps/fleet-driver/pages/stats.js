async function init_stats() {
  var container = document.getElementById('pageContainer') || document.getElementById('mainContent') || document.querySelector('main');
  if (container) {
    container.innerHTML = getHeaderHTML() + '<div style="padding:16px;">' +
      '<h2 style="font-size:20px;font-weight:bold;margin-bottom:16px;">📊 Statistiques</h2>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.card : 'var(--bg-surface)') +';border-radius:12px;padding:16px;text-align:center;box-shadow:var(--shadow-card);">' +
          '<p style="font-size:12px;color:var(--text-muted);">Courses aujourd\'hui</p>' +
          '<p id="statTodayCourses" style="font-size:24px;font-weight:bold;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : 'var(--gold)') +';">0</p>' +
        '</div>' +
        '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.card : 'var(--bg-surface)') +';border-radius:12px;padding:16px;text-align:center;box-shadow:var(--shadow-card);">' +
          '<p style="font-size:12px;color:var(--text-muted);">CA aujourd\'hui</p>' +
          '<p id="statTodayCA" style="font-size:24px;font-weight:bold;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : 'var(--gold)') +';">0 Ar</p>' +
        '</div>' +
        '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.card : 'var(--bg-surface)') +';border-radius:12px;padding:16px;text-align:center;box-shadow:var(--shadow-card);">' +
          '<p style="font-size:12px;color:var(--text-muted);">Commission</p>' +
          '<p id="statTodayCom" style="font-size:24px;font-weight:bold;color:var(--error-fg);">0 Ar</p>' +
        '</div>' +
        '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.card : 'var(--bg-surface)') +';border-radius:12px;padding:16px;text-align:center;box-shadow:var(--shadow-card);">' +
          '<p style="font-size:12px;color:var(--text-muted);">Net aujourd\'hui</p>' +
          '<p id="statTodayNet" style="font-size:24px;font-weight:bold;color:var(--text-primary);">0 Ar</p>' +
        '</div>' +
      '</div>' +
      '<h3 style="font-size:16px;font-weight:bold;margin:20px 0 12px;">📅 Cette semaine</h3>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.card : 'var(--bg-surface)') +';border-radius:12px;padding:16px;text-align:center;box-shadow:var(--shadow-card);">' +
          '<p style="font-size:12px;color:var(--text-muted);">Courses</p>' +
          '<p id="statWeekCourses" style="font-size:24px;font-weight:bold;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : 'var(--gold)') +';">0</p>' +
        '</div>' +
        '<div style="background:'+ (window.FLEET_THEME ? window.FLEET_THEME.card : 'var(--bg-surface)') +';border-radius:12px;padding:16px;text-align:center;box-shadow:var(--shadow-card);">' +
          '<p style="font-size:12px;color:var(--text-muted);">CA semaine</p>' +
          '<p id="statWeekCA" style="font-size:24px;font-weight:bold;color:'+ (window.FLEET_THEME ? window.FLEET_THEME.primary : 'var(--gold)') +';">0 Ar</p>' +
        '</div>' +
      '</div>' +
    '</div>';
  }
  await refreshDailyStats();
}

async function refreshDailyStats() {
  try {
    var stats = await window.apiFetch('/finances/courses');
    
    if (stats && Array.isArray(stats)) {
      var today = new Date().toISOString().split('T')[0];
      var todayCourses = stats.filter(function(c) {
        return c.date && c.date.startsWith(today);
      });
      
      var todayCA = todayCourses.reduce(function(sum, c) { return sum + (c.price || c.amount || 0); }, 0);
      var todayCom = todayCourses.reduce(function(sum, c) { return sum + (c.commission || 0); }, 0);
      var todayNet = todayCA - todayCom;
      
      var el = function(id) { return document.getElementById(id); };
      if (el('statTodayCourses')) el('statTodayCourses').textContent = todayCourses.length;
      if (el('statTodayCA')) el('statTodayCA').textContent = todayCA.toLocaleString() + ' Ar';
      if (el('statTodayCom')) el('statTodayCom').textContent = todayCom.toLocaleString() + ' Ar';
      if (el('statTodayNet')) el('statTodayNet').textContent = todayNet.toLocaleString() + ' Ar';

      // Cette semaine
      var weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      var weekCourses = stats.filter(function(c) {
        return c.date && new Date(c.date) >= weekAgo;
      });
      var weekCA = weekCourses.reduce(function(sum, c) { return sum + (c.price || c.amount || 0); }, 0);
      var weekCom = weekCourses.reduce(function(sum, c) { return sum + (c.commission || 0); }, 0);
      var weekNet = weekCA - weekCom;

      if (el('statWeekCourses')) el('statWeekCourses').textContent = weekCourses.length;
      if (el('statWeekCA')) el('statWeekCA').textContent = weekCA.toLocaleString() + ' Ar';
      if (el('statWeekCom')) el('statWeekCom').textContent = weekCom.toLocaleString() + ' Ar';
      if (el('statWeekNet')) el('statWeekNet').textContent = weekNet.toLocaleString() + ' Ar';
    }
  } catch (err) {
    console.warn('Erreur de récupération des stats:', err);
  }
}

setInterval(refreshDailyStats, 30000);
