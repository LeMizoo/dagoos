function getApiUrl() {
  return (typeof DAGOOS_CONFIG !== 'undefined' && DAGOOS_CONFIG.apiUrl)
    ? DAGOOS_CONFIG.apiUrl
    : '';
}

function getPassengerInfo() {
  try {
    return JSON.parse(localStorage.getItem('dagoo_passenger_info') || '{}');
  } catch (e) {
    return {};
  }
}

function setPassengerInfo(info) {
  localStorage.setItem('dagoo_passenger_info', JSON.stringify(info));
}

window.getApiUrl = getApiUrl;
window.getPassengerInfo = getPassengerInfo;
window.setPassengerInfo = setPassengerInfo;

window.loadPage = async function(pageName) {
  console.log('Chargement page:', pageName);
  var container = document.getElementById('app');
  if (!container) { console.warn('Pas de conteneur'); return; }

  document.querySelectorAll('[data-page]').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.page === pageName);
  });

  container.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#94A3B8;">Chargement...</div>';

  try {
    var script = document.createElement('script');
    script.src = '/pages/' + pageName + '.js';
    script.dataset.page = pageName;
    script.onload = function() {
      console.log('Page chargée:', pageName);
      var initFn = window['init_' + pageName];
      if (typeof initFn === 'function') initFn();
      // Remplacer les <i data-lucide> par les SVG Lucide
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    };
    script.onerror = function() {
      container.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#E74C3C;">Erreur de chargement</div>';
    };
    document.body.appendChild(script);
  } catch (err) {
    console.error(err);
    container.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#E74C3C;">Erreur</div>';
  }
};

window.addEventListener('beforeunload', function() {
  var activeBtn = document.querySelector('[data-page].active');
  if (activeBtn) localStorage.setItem('dagoos_mobile_page', activeBtn.dataset.page);
});

document.addEventListener('DOMContentLoaded', function() {
  var savedPage = localStorage.getItem('dagoos_mobile_page') || 'home';
  loadPage(savedPage);
});
