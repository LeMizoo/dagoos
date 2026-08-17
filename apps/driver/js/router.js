function getAuthHeaders() {
  var token = localStorage.getItem('dagoo_driver_token');
  var headers = { 'Content-Type': 'application/json' };
  if (token) { headers['Authorization'] = 'Bearer ' + token; }
  return headers;
}

async function apiFetch(endpoint, options) {
  options = options || {};
  var url = DAGOOS_CONFIG.apiUrl + endpoint;
  var config = { method: options.method || 'GET', headers: getAuthHeaders() };
  if (options.body !== undefined) {
    config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }
  try {
    var response = await fetch(url, config);
    if (response.status === 401) {
      localStorage.removeItem('dagoo_driver_token');
      localStorage.removeItem('dagoo_driver_user');
      window.location.href = '/';
      return null;
    }
    var contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) return await response.json();
    return await response.text();
  } catch (err) {
    console.error('Erreur API (' + endpoint + '):', err);
    throw err;
  }
}

window.apiFetch = apiFetch;
window.apiGet = function(endpoint) { return apiFetch(endpoint); };

window.loadPage = async function(pageName) {
  console.log('Chargement page:', pageName);
  var container = document.getElementById('pageContainer') || document.getElementById('mainContent') || document.getElementById('app') || document.querySelector('main');
  if (!container) { console.warn('Pas de conteneur'); return; }
  document.querySelectorAll('[data-page]').forEach(function(btn) { btn.classList.toggle('active', btn.dataset.page === pageName); });
  container.innerHTML = '<div style="text-align:center;padding:40px;color:#94A3B8;">Chargement...</div>';
  try {
    var script = document.createElement('script');
    script.src = '/pages/' + pageName + '.js';
    script.dataset.driverPage = pageName;
    script.onload = function() { console.log('Page chargée:', pageName); var initFn = window['init_' + pageName]; if (typeof initFn === 'function') initFn(); };
    script.onerror = function() { container.innerHTML = '<div style="text-align:center;padding:40px;color:#E74C3C;">Erreur</div>'; };
    document.body.appendChild(script);
  } catch (err) { console.error(err); container.innerHTML = '<div style="text-align:center;padding:40px;color:#E74C3C;">Erreur</div>'; }
};

window.addEventListener('beforeunload', function() {
  var activeBtn = document.querySelector('[data-page].active');
  if (activeBtn) localStorage.setItem('driver_current_page', activeBtn.dataset.page);
});

document.addEventListener('DOMContentLoaded', function() {
  var savedPage = localStorage.getItem('driver_current_page') || 'home';
  loadPage(savedPage);
});
