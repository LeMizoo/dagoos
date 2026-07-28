// SIDEBAR DAGOO'S - Composant partagé
function renderSidebar(role) {
  var sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  
  var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
  var initials = (user.name || 'A')[0].toUpperCase();
  
  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <img src="assets/logo/b-trans.svg" alt="Dagoo's">
      <h2>DAG<span>OO'S</span></h2>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section">Principal</div>
      <a href="/dashboard" data-page="home" class="sidebar-link active"><i class="fas fa-th-large"></i> Tableau de bord</a>
      
      <div class="nav-section">Opérations</div>
      <a href="/dashboard/flottes" data-page="fleets"><i class="fas fa-truck"></i> Flottes <span class="badge-count" id="fleetCount">0</span></a>
      <a href="/dashboard/flottes/vehicules" data-page="fleets-vehicules" class="sub"><i class="fas fa-car"></i> Véhicules</a>
      <a href="/dashboard/flottes/chauffeurs" data-page="fleets-chauffeurs" class="sub"><i class="fas fa-user"></i> Chauffeurs</a>
      <a href="/dashboard/cooperatives" data-page="coops"><i class="fas fa-building"></i> Coopératives <span class="badge-count" id="coopCount">0</span></a>
      <a href="/dashboard/cooperatives/vehicules" data-page="coops-vehicules" class="sub"><i class="fas fa-car"></i> Véhicules</a>
      <a href="/dashboard/cooperatives/chauffeurs" data-page="coops-chauffeurs" class="sub"><i class="fas fa-user"></i> Chauffeurs</a>
      <a href="/dashboard/chauffeurs" data-page="drivers"><i class="fas fa-motorcycle"></i> Chauffeurs <span class="badge-count" id="driverCount">0</span></a>
      
      <div class="nav-section">Communication</div>
      <a href="/dashboard/messages" data-page="messages"><i class="fas fa-envelope"></i> Messages</a>
      <a href="/dashboard/notifications" data-page="notifications"><i class="fas fa-bell"></i> Alertes <span class="badge-count" id="msgCount">0</span></a>
      
      <div class="nav-section">Finances</div>
      <a href="/dashboard/finances" data-page="finances"><i class="fas fa-credit-card"></i> Abonnements</a>
      <a href="/dashboard/paiements" data-page="payments"><i class="fas fa-money-bill-wave"></i> Paiements</a>
      
      <div class="nav-section">Système</div>
      <a href="/dashboard/logs" data-page="logs"><i class="fas fa-history"></i> Logs</a>
      <a href="/dashboard/parametres" data-page="settings"><i class="fas fa-cog"></i> Paramètres</a>
    </nav>
    <div class="sidebar-footer">
      <div class="user-info">
        <div class="avatar" id="sidebarAvatar">${initials}</div>
        <div>
          <div class="name" id="sidebarUser">${user.name || 'Admin'}</div>
          <div class="role">Super Admin</div>
        </div>
      </div>
      <div class="theme-btns">
        <button onclick="setTheme('light')">☀️</button>
        <button onclick="setTheme('dark')">🌙</button>
        <button onclick="setTheme('system')">💻</button>
      </div>
      <button class="logout-btn" onclick="logout()">⏻ Déconnexion</button>
    </div>`;
  
  // Activer le lien courant
  var currentPath = window.location.pathname;
  var links = sidebar.querySelectorAll('.sidebar-link');
  links.forEach(function(link) {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
}
