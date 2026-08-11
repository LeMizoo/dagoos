function getAuthHeaders() {
  var token = localStorage.getItem('dagoo_driver_token');
  var headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  return headers;
}

async function apiFetch(endpoint, options) {
  options = options || {};
  var url = DAGOOS_CONFIG.apiUrl + endpoint;
  
  var config = {
    method: options.method || 'GET',
    headers: getAuthHeaders()
  };

  if (options.body) {
    config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  try {
    var response = await fetch(url, config);
    
    if (response.status === 401) {
      localStorage.removeItem('dagoo_driver_token');
      localStorage.removeItem('dagoo_driver_user');
      window.location.href = '/index.html';
      return null;
    }

    var contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch (err) {
    console.error('Erreur API (' + endpoint + '):', err);
    throw err;
  }
}

// Fonction de navigation globale
window.loadPage = async function(pageName) {
  console.log('📄 Chargement page:', pageName);
  
  var container = document.getElementById('pageContainer') || document.getElementById('app') || document.querySelector('main');
  if (!container) {
    console.warn('Pas de conteneur trouvé');
    return;
  }
  
  // Mettre à jour les boutons de navigation actifs
  document.querySelectorAll('[data-page]').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.page === pageName);
  });
  
  // Afficher un loader
  container.innerHTML = '<div style="text-align:center;padding:40px;color:#94A3B8;">⏳ Chargement...</div>';
  
  try {
    var response = await fetch('/pages/' + pageName + '.js');
    if (response.ok) {
      var script = document.createElement('script');
      script.src = '/pages/' + pageName + '.js';
      script.onload = function() {
        console.log('✅ Page chargée:', pageName);
      };
      document.body.appendChild(script);
    }
    
    // Charger le contenu HTML si disponible
    var htmlResponse = await fetch('/pages/' + pageName + '.html');
    if (htmlResponse.ok) {
      container.innerHTML = await htmlResponse.text();
    }
  } catch (err) {
    console.error('Erreur chargement page:', err);
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#E74C3C;">Erreur de chargement</div>';
  }
};

// Sauvegarder la page courante
window.addEventListener('beforeunload', function() {
  var activeBtn = document.querySelector('[data-page].active');
  if (activeBtn) {
    localStorage.setItem('driver_current_page', activeBtn.dataset.page);
  }
});

// Restaurer la dernière page au chargement
document.addEventListener('DOMContentLoaded', function() {
  var savedPage = localStorage.getItem('driver_current_page') || 'home';
  var btn = document.querySelector('[data-page="' + savedPage + '"]');
  if (btn) {
    loadPage(savedPage);
  }
});
