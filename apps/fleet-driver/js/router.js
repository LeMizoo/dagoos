function getAuthHeaders() {
  var token = localStorage.getItem('dagoo_driver_token');
  var headers = { 'Content-Type': 'application/json' };
  if (token) { headers['Authorization'] = 'Bearer ' + token; }
  return headers;
}

// Fonctions utilitaires communes
function getDriverToken() {
  return localStorage.getItem('dagoo_driver_token') || '';
}

function getDriverUser() {
  try {
    return JSON.parse(localStorage.getItem('dagoo_driver_user') || '{}');
  } catch (e) {
    return {};
  }
}

function getApiUrl() {
  return (typeof DAGOOS_CONFIG !== 'undefined' && DAGOOS_CONFIG.apiUrl)
    ? DAGOOS_CONFIG.apiUrl
    : '';
}

async function apiFetch(endpoint, options) {
  options = options || {};
  var url = DAGOOS_CONFIG.apiUrl + endpoint;
  window.dagooApiPending = (window.dagooApiPending || 0) + 1;
  var config = { method: options.method || 'GET', headers: getAuthHeaders() };
  if (options.body !== undefined) {
    config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }
  try {
    var response = await fetch(url, config);
    window.dagooApiPending = Math.max(0, (window.dagooApiPending || 1) - 1);
    if (response.status === 401) {
      localStorage.removeItem('dagoo_driver_token');
      localStorage.removeItem('dagoo_driver_user');
      window.location.href = '/';
      return null;
    }
    var contentType = response.headers.get('content-type') || '';
    window.dagooApiPending = Math.max(0, (window.dagooApiPending || 1) - 1);
    if (contentType.includes('application/json')) return await response.json();
    return await response.text();
  } catch (err) {
    window.dagooApiPending = Math.max(0, (window.dagooApiPending || 1) - 1);
    console.error('Erreur API (' + endpoint + '):', err);
    throw err;
  }
}

window.getDriverToken = getDriverToken;
window.getDriverUser = getDriverUser;
window.getApiUrl = getApiUrl;

window.apiFetch = apiFetch;
window.apiGet = function(endpoint) { return apiFetch(endpoint); };

window.apiPost = function(endpoint, body) {
  return apiFetch(endpoint, { method: 'POST', body: body });
};

window.logout = function() {
  // Supprimer uniquement la session active
  // Conserver le code chauffeur mémorisé pour la reconnexion rapide
  localStorage.removeItem('dagoo_driver_token');
  localStorage.removeItem('dagoo_driver_user');
  localStorage.removeItem('driver_current_page');
  window.location.href = '/';
};

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

function getHeaderHTML() {
  var user = JSON.parse(localStorage.getItem('dagoo_driver_user') || '{}');
  // Statut dérivé du pointage (pas de Driver.status)
  var pointageStatut = window.currentPointage && window.currentPointage.statut
    ? window.currentPointage.statut
    : (window.statutPresence === 'present' ? 'PRESENT'
      : window.statutPresence === 'pause' ? 'PAUSE'
      : 'NON_DEBUTE');
  var statusLabel = pointageStatut === 'PRESENT' ? 'En service' : pointageStatut === 'PAUSE' ? 'En pause' : 'Absent';
  var statusColor = pointageStatut === 'PRESENT' ? '#22C55E' : pointageStatut === 'PAUSE' ? '#F59E0B' : '#E74C3C';
  var plate = window.currentVehicle ? window.currentVehicle.plate : '';
  
  return '<div style="background:#1E293B;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;border-bottom:1px solid #DAA520;">' +
    '<div style="display:flex;align-items:center;gap:8px;">' +
      '<img src="' + DAGOOS_CONFIG.logoUrl + '" style="width:36px;height:36px;object-fit:contain;border-radius:8px;">' +
      '<div>' +
        '<div style="font-size:14px;font-weight:700;color:#DAA520;">' + (user.name || 'Chauffeur') + '</div>' +
        '<div style="font-size:10px;color:#94A3B8;display:flex;gap:6px;align-items:center;flex-wrap:wrap;">' +
          (window.DAGOOS_DRIVER_CONTEXT && window.DAGOOS_DRIVER_CONTEXT.isCoop ? '<span style="padding:2px 6px;border-radius:20px;font-size:9px;background:#2a2a2a;color:#22C55E;">🏢 Coopérative</span>' : '<span style="padding:2px 6px;border-radius:20px;font-size:9px;background:#2a2a2a;color:#DAA520;">🚛 Flotte</span>') +
          '<span style="padding:2px 6px;border-radius:20px;font-size:9px;background:' + statusColor + ';color:#fff;">' + statusLabel + '</span>' +
          (plate ? '<span style="padding:2px 6px;border-radius:20px;font-size:9px;background:#2a2a2a;color:#DAA520;">🏍️ ' + plate + '</span>' : '<span style="padding:2px 6px;border-radius:20px;font-size:9px;background:#E74C3C;color:#fff;">⚠️ Sans moto</span>') +
          '<span style="color:#94A3B8;">' + (user.driverCode || '') + '</span>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div style="display:flex;gap:4px;">' +
      '<button onclick="loadPage(\'notifications\')" style="background:rgba(255,255,255,0.1);border:none;width:32px;height:32px;border-radius:50%;color:#DAA520;cursor:pointer;font-size:14px;">🔔</button>' +
      '<button onclick="loadPage(\'profil\')" style="background:rgba(255,255,255,0.1);border:none;width:32px;height:32px;border-radius:50%;color:#DAA520;cursor:pointer;font-size:14px;">📶</button>' +
      '<button onclick="logout()" style="background:rgba(255,255,255,0.1);border:none;width:32px;height:32px;border-radius:50%;color:#F87171;cursor:pointer;font-size:16px;" aria-label="Déconnexion" title="Déconnexion">⏻</button>' +
    '</div>' +
  '</div>';
}



// État de connexion
window.updateConnectionState = function() {
    var online = navigator.onLine;
    var btn = document.querySelector('[aria-label="Profil"]');
    if (btn) {
        btn.innerHTML = online ? '📶' : '📴';
        btn.style.color = online ? '#22C55E' : '#E74C3C';
    }
};

window.addEventListener('online', function() {
    window.updateConnectionState();
});

window.addEventListener('offline', function() {
    window.updateConnectionState();
});

window.getHeaderHTML = getHeaderHTML;
