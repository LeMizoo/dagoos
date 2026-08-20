async function init_stats() {
  await refreshDailyStats();
}

async function refreshDailyStats() {
  try {
    var stats = await apiFetch('/finances/courses');
    
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
