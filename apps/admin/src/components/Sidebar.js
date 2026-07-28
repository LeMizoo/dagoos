// DAGOO'S - Sidebar Admin
function renderSidebar() {
  const user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
  const initials = (user.name || 'A')[0].toUpperCase();
  const path = window.location.pathname;

  const menu = [
    { section: 'Principal', items: [
      { href: '/admin/dashboard', icon: 'fa-th-large', label: 'Tableau de bord', page: 'dashboard' }
    ]},
    { section: 'Flotte', items: [
      { href: '/admin/flotte', icon: 'fa-truck', label: 'Flottes', page: 'flotte', badge: 'fleetCount' },
      { href: '/admin/flotte/vehicules', icon: 'fa-car', label: 'Véhicules', page: 'flotte/vehicules', sub: true },
      { href: '/admin/flotte/maintenance', icon: 'fa-wrench', label: 'Maintenance', page: 'flotte/maintenance', sub: true },
      { href: '/admin/flotte/chauffeurs', icon: 'fa-user', label: 'Chauffeurs Flotte', page: 'flotte/chauffeurs', sub: true }
    ]},
    { section: 'Coopérative', items: [
      { href: '/admin/cooperative', icon: 'fa-building', label: 'Coopératives', page: 'cooperative', badge: 'coopCount' },
      { href: '/admin/cooperative/vehicules', icon: 'fa-car', label: 'Véhicules', page: 'cooperative/vehicules', sub: true },
      { href: '/admin/cooperative/chauffeurs', icon: 'fa-user', label: 'Chauffeurs Coop', page: 'cooperative/chauffeurs', sub: true }
    ]},
    { section: 'Chauffeurs', items: [
      { href: '/admin/chauffeurs', icon: 'fa-motorcycle', label: 'Tous les chauffeurs', page: 'chauffeurs', badge: 'driverCount' }
    ]},
    { section: 'Finances', items: [
      { href: '/admin/finances', icon: 'fa-credit-card', label: 'Abonnements', page: 'finances' },
      { href: '/admin/paiements', icon: 'fa-money-bill-wave', label: 'Paiements', page: 'paiements' }
    ]},
    { section: 'Communication', items: [
      { href: '/admin/messages', icon: 'fa-envelope', label: 'Messages', page: 'messages' },
      { href: '/admin/notifications', icon: 'fa-bell', label: 'Alertes', page: 'notifications', badge: 'msgCount' }
    ]},
    { section: 'Système', items: [
      { href: '/admin/logs', icon: 'fa-history', label: 'Logs', page: 'logs' },
      { href: '/admin/parametres', icon: 'fa-cog', label: 'Paramètres', page: 'parametres' }
    ]}
  ];

  let html = `
    <div class="sidebar-logo">
      <img src="assets/logo/b-trans.svg" alt="Dagoo's">
      <h2>DAG<span>OO'S</span></h2>
    </div>
    <nav class="sidebar-nav">`;

  menu.forEach(section => {
    html += `<div class="nav-section">${section.section}</div>`;
    section.items.forEach(item => {
      const isActive = path === item.href || path.startsWith(item.href + '/');
      const subClass = item.sub ? ' sub' : '';
      const badgeHtml = item.badge ? ` <span class="badge-count" id="${item.badge}">-</span>` : '';
      html += `<a href="${item.href}" data-page="${item.page}" class="sidebar-link${subClass}${isActive ? ' active' : ''}"><i class="fas ${item.icon}"></i> ${item.label}${badgeHtml}</a>`;
    });
  });

  html += `</nav>
    <div class="sidebar-footer">
      <div class="user-info">
        <div class="avatar" id="sidebarAvatar">${initials}</div>
        <div>
          <div class="name">${user.name || 'Admin'}</div>
          <div class="role">Super Admin</div>
        </div>
      </div>
      <button class="logout-btn" onclick="logout()">⏻ Déconnexion</button>
    </div>`;

  document.getElementById('sidebar').innerHTML = html;
}
