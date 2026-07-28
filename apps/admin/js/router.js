// DAGOO'S ADMIN - ROUTER
var API_URL = DAGOOS_CONFIG.apiUrl;
var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
var token = localStorage.getItem('dagoos_token');
var currentPage = 'home';

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

// Navigation
function loadPage(page) {
  currentPage = page;
  var main = document.getElementById('mainInner');
  main.innerHTML = '<div style="text-align:center;padding:40px;">⏳ Chargement...</div>';
  
  // Nettoyer les anciens scripts de page
  document.querySelectorAll('script[data-page]').forEach(function(s) { s.remove(); });
  
  var script = document.createElement('script');
  script.src = 'pages/' + page + '.js';
  script.setAttribute('data-page', page);
  script.onload = function() {
    var funcName = 'init_' + page.replace(/-/g, '_');
    if (typeof window[funcName] === 'function') {
      window[funcName]();
    }
  };
  script.onerror = function() {
    main.innerHTML = '<div style="text-align:center;padding:40px;">❌ Page introuvable</div>';
  };
  document.body.appendChild(script);
  
  // Sidebar actif
  document.querySelectorAll('.sidebar-link').forEach(function(l) { l.classList.remove('active'); });
  var link = document.querySelector('[data-page="' + page + '"]');
  if (link) link.classList.add('active');
}

// Clics sidebar
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.sidebar-link').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var page = this.dataset.page;
      if (page) {
        var urlMap = {
          'home': '/dashboard', 'fleets': '/dashboard/flottes',
          'fleets-vehicules': '/dashboard/flottes/vehicules', 'fleets-chauffeurs': '/dashboard/flottes/chauffeurs',
          'coops': '/dashboard/cooperatives', 'coops-vehicules': '/dashboard/cooperatives/vehicules',
          'coops-chauffeurs': '/dashboard/cooperatives/chauffeurs', 'drivers': '/dashboard/chauffeurs',
          'messages': '/dashboard/messages', 'notifications': '/dashboard/notifications',
          'finances': '/dashboard/finances', 'payments': '/dashboard/paiements',
          'logs': '/dashboard/logs', 'settings': '/dashboard/parametres'
        };
        history.pushState(null, '', urlMap[page] || '/dashboard');
        loadPage(page);
      }
    });
  });
  
  // Charger la page initiale
  loadPage('home');
});

// Modal
function showModal(title, content) {
  var modal = document.getElementById('dagModal');
  if (!modal) { modal = document.createElement('div'); modal.id = 'dagModal'; document.body.appendChild(modal); }
  modal.innerHTML = '<div class="modal-overlay" onclick="closeModal()"></div><div class="modal-content"><div class="modal-header"><h3>'+title+'</h3><button onclick="closeModal()">✕</button></div><div class="modal-body">'+content+'</div></div>';
  modal.style.display = 'block';
}
function closeModal() { var m = document.getElementById('dagModal'); if(m) m.style.display = 'none'; }
