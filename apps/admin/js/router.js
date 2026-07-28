// DAGOO'S ADMIN - ROUTER
var API_URL = DAGOOS_CONFIG.apiUrl;
var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
var token = localStorage.getItem('dagoos_token');

if (!token || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) { 
  window.location.replace('index.html'); 
}

document.getElementById('sidebarUser').textContent = (user.name || 'Admin');
document.getElementById('sidebarAvatar').textContent = (user.name || 'A')[0].toUpperCase();

function logout() { localStorage.clear(); window.location.replace(DAGOOS_CONFIG.landingUrl); }
function toggleSidebar() { document.getElementById("sidebar").classList.toggle("open"); document.getElementById("sidebarOverlay").classList.toggle("show"); }

// API
function apiGet(e) { return fetch(API_URL+e,{headers:{Authorization:'Bearer '+token}}).then(function(r){return r.json()}); }
function apiPost(e,d) { return fetch(API_URL+e,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(d)}).then(function(r){return r.json()}); }
function apiPut(e,d) { return fetch(API_URL+e,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(d)}).then(function(r){return r.json()}); }
function apiPatch(e,d) { return fetch(API_URL+e,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(d)}).then(function(r){return r.json()}); }

// Navigation par rechargement
document.addEventListener('DOMContentLoaded', function() {
  var path = window.location.pathname;
  var page = 'home';
  
  if (path.includes('/flottes/vehicules')) page = 'fleets-vehicules';
  else if (path.includes('/flottes/chauffeurs')) page = 'fleets-chauffeurs';
  else if (path.includes('/flottes')) page = 'fleets';
  else if (path.includes('/cooperatives/vehicules')) page = 'coops-vehicules';
  else if (path.includes('/cooperatives/chauffeurs')) page = 'coops-chauffeurs';
  else if (path.includes('/cooperatives')) page = 'coops';
  else if (path.includes('/chauffeurs')) page = 'drivers';
  else if (path.includes('/messages')) page = 'messages';
  else if (path.includes('/notifications')) page = 'notifications';
  else if (path.includes('/finances')) page = 'finances';
  else if (path.includes('/paiements')) page = 'payments';
  else if (path.includes('/logs')) page = 'logs';
  else if (path.includes('/parametres')) page = 'settings';
  
  loadPageDirect(page);
});

function loadPageDirect(page) {
  var main = document.getElementById('mainInner');
  main.innerHTML = '<div style="text-align:center;padding:40px;">⏳ Chargement...</div>';
  
  var script = document.createElement('script');
  script.src = 'pages/' + page + '.js';
  script.onload = function() {
    var funcName = 'init_' + page.replace(/-/g, '_');
    if (typeof window[funcName] === 'function') {
      window[funcName]();
    }
  };
  script.onerror = function() {
    main.innerHTML = '<div style="text-align:center;padding:40px;">❌ Page introuvable : ' + page + '</div>';
  };
  document.body.appendChild(script);
  
  // Sidebar
  document.querySelectorAll('.sidebar-link').forEach(function(l) { l.classList.remove('active'); });
  var link = document.querySelector('[data-page="' + page + '"]');
  if (link) link.classList.add('active');
}

// Modal
function showModal(title, content) {
  var modal = document.getElementById('dagModal');
  if (!modal) { modal = document.createElement('div'); modal.id = 'dagModal'; document.body.appendChild(modal); }
  modal.innerHTML = '<div class="modal-overlay" onclick="closeModal()"></div><div class="modal-content"><div class="modal-header"><h3>'+title+'</h3><button onclick="closeModal()">✕</button></div><div class="modal-body">'+content+'</div></div>';
  modal.style.display = 'block';
}
function closeModal() { var m = document.getElementById('dagModal'); if(m) m.style.display = 'none'; }
