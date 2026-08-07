var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
var token = localStorage.getItem('dagoos_token');

// Vérification assouplie : on vérifie juste le driverId
if (!token || !user.driverId) {
  window.location.replace('index.html');
}

function apiGet(e) {
  return fetch(DAGOOS_CONFIG.apiUrl + e, {
    headers: { Authorization: 'Bearer ' + token }
  }).then(function(r) { return r.json(); });
}

async function apiPost(endpoint, data) {
  var response = await fetch(DAGOOS_CONFIG.apiUrl + endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify(data)
  });
  var result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || 'Erreur HTTP ' + response.status);
  }
  return result;
}

function logout() {
  localStorage.clear();
  window.location.replace(DAGOOS_CONFIG.apps.driver || DAGOOS_CONFIG.landingUrl);
}

function loadPage(page) {
  var main = document.getElementById('mainContent');
  var script = document.createElement('script');
  script.src = 'pages/' + page + '.js';
  script.onload = function() {
    if (typeof window['init_' + page] === 'function') {
      window['init_' + page]();
    }
  };
  main.innerHTML = '<p style="text-align:center;padding:40px;color:#94A3B8;">Chargement...</p>';
  document.body.appendChild(script);

  // Activer le bouton dans la bottom nav
  document.querySelectorAll('.bottom-nav button').forEach(function(b) {
    b.classList.remove('active');
  });
  var activeBtn = document.querySelector('.bottom-nav button[data-page="' + page + '"]');
  if (activeBtn) activeBtn.classList.add('active');
}

// Charger la page d'accueil au démarrage
loadPage('home');
