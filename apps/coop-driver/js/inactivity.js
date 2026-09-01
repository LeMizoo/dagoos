// Auto-déconnexion après inactivité
(function() {
  const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
  function getStorageKey() {
    var user = JSON.parse(localStorage.getItem('dagoo_driver_user') || '{}');
    var driverId = user.driverId || user.driverCode || 'default';
    return 'dagoo_inactivity_timeout_' + driverId;
  }
  let timer = null;

  function getTimeoutMs() {
    const stored = localStorage.getItem(getStorageKey());
    const parsed = stored ? parseInt(stored, 10) : NaN;
    return !isNaN(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
  }

  function resetTimer() {
    if (timer) clearTimeout(timer);
    const timeoutMs = getTimeoutMs();
    timer = setTimeout(function() {
      // Ne pas déconnecter si une requête API est en cours
      if (window.dagooApiPending && window.dagooApiPending > 0) {
        resetTimer();
        return;
      }

      // Déconnexion
      localStorage.removeItem('dagoo_driver_token');
      localStorage.removeItem('dagoo_driver_user');
      localStorage.removeItem('dagoo_driver_code');
      localStorage.removeItem('dagoo_driver_org');
      localStorage.removeItem('dagoo_driver_type');
      localStorage.removeItem('driver_current_page');

      // Redirection vers la page de login
      window.location.href = '/';
    }, timeoutMs);
  }

  // Exposer les fonctions globalement
  window.dagooInactivity = {
    reset: resetTimer,
    getTimeoutMs: getTimeoutMs,
    setTimeoutMs: function(ms) {
      localStorage.setItem(getStorageKey(), String(ms));
      resetTimer();
    }
  };

  // Écouter les événements d'activité
  const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
  events.forEach(function(evt) {
    document.addEventListener(evt, function() {
      resetTimer();
    }, { passive: true });
  });

  // Initialiser au chargement
  document.addEventListener('DOMContentLoaded', function() {
    // Ne pas activer sur la page login
    if (window.location.pathname === '/' || window.location.pathname.includes('index')) return;
    resetTimer();
  });
})();
