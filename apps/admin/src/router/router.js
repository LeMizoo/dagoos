// DAGOO'S - Router Admin
const routes = {
  '/admin/dashboard':                   { page: 'dashboard', file: 'dashboard/dashboard.page.js' },
  '/admin/flotte':                       { page: 'flotte', file: 'flotte/flotte.page.js' },
  '/admin/flotte/vehicules':            { page: 'flotte/vehicules', file: 'flotte/vehicules/vehicules.page.js' },
  '/admin/flotte/maintenance':          { page: 'flotte/maintenance', file: 'flotte/maintenance/maintenance.page.js' },
  '/admin/flotte/chauffeurs':           { page: 'flotte/chauffeurs', file: 'flotte/chauffeurs/chauffeurs.page.js' },
  '/admin/cooperative':                  { page: 'cooperative', file: 'cooperative/cooperative.page.js' },
  '/admin/cooperative/vehicules':       { page: 'cooperative/vehicules', file: 'cooperative/vehicules/vehicules.page.js' },
  '/admin/cooperative/chauffeurs':      { page: 'cooperative/chauffeurs', file: 'cooperative/chauffeurs/chauffeurs.page.js' },
  '/admin/chauffeurs':                   { page: 'chauffeurs', file: 'chauffeurs/chauffeurs.page.js' },
  '/admin/finances':                     { page: 'finances', file: 'finances/finances.page.js' },
  '/admin/paiements':                    { page: 'paiements', file: 'finances/paiements.page.js' },
  '/admin/messages':                     { page: 'messages', file: 'messages/messages.page.js' },
  '/admin/notifications':               { page: 'notifications', file: 'notifications/notifications.page.js' },
  '/admin/logs':                         { page: 'logs', file: 'logs.page.js' },
  '/admin/parametres':                   { page: 'parametres', file: 'parametres/parametres.page.js' }
};

let currentPage = null;

function navigateTo(path) {
  const route = routes[path] || routes['/admin/dashboard'];
  history.pushState(null, '', path);
  loadPage(route);
}

function loadPage(route) {
  if (currentPage === route.page) return;
  currentPage = route.page;
  
  const main = document.getElementById('mainContent');
  main.innerHTML = '<div style="text-align:center;padding:40px;">⏳ Chargement...</div>';
  
  const script = document.createElement('script');
  script.src = 'src/modules/' + route.file;
  script.onload = () => {
    if (typeof window['init_' + route.page.replace(/\//g, '_')] === 'function') {
      window['init_' + route.page.replace(/\//g, '_')]();
    }
  };
  document.body.appendChild(script);
  
  // Sidebar actif
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  const link = document.querySelector(`[data-page="${route.page}"]`);
  if (link) link.classList.add('active');
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  renderSidebar();
  
  // Clics sidebar
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      navigateTo(this.getAttribute('href'));
    });
  });
  
  // Charger page courante
  const path = window.location.pathname;
  navigateTo(path || '/admin/dashboard');
});

window.addEventListener('popstate', () => {
  navigateTo(window.location.pathname);
});
