// DAGOO'S - Dashboard Admin
async function init_dashboard() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="topbar"><h1>📊 Tableau de bord</h1></div>
    <div class="stats-grid" id="statsGrid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px;">
      <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-truck"></i></div><div class="stat-value" id="statFleets">-</div><div class="stat-label">Flottes</div></div>
      <div class="stat-card"><div class="stat-icon green"><i class="fas fa-building"></i></div><div class="stat-value" id="statCoops">-</div><div class="stat-label">Coopératives</div></div>
      <div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-motorcycle"></i></div><div class="stat-value" id="statDrivers">-</div><div class="stat-label">Chauffeurs</div></div>
      <div class="stat-card"><div class="stat-icon red"><i class="fas fa-car"></i></div><div class="stat-value" id="statVehicles">-</div><div class="stat-label">Véhicules</div></div>
    </div>
    <div class="card"><h3 style="margin-bottom:12px;">📋 Dernières inscriptions</h3><div id="recentOrgs"></div></div>`;
  
  try {
    const [orgs, drivers, vehicles] = await Promise.all([
      apiGet('/organizations'),
      apiGet('/drivers'),
      apiGet('/vehicles')
    ]);
    
    document.getElementById('statFleets').textContent = orgs.filter(o => o.type === 'FLEET_MANAGER').length;
    document.getElementById('statCoops').textContent = orgs.filter(o => o.type === 'COOPERATIVE').length;
    document.getElementById('statDrivers').textContent = drivers.length;
    document.getElementById('statVehicles').textContent = vehicles.length;
    
    const recent = orgs.slice(0, 5);
    document.getElementById('recentOrgs').innerHTML = recent.length ? recent.map(o => `
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
        <span><strong>${o.name}</strong> <small>(${o.type === 'FLEET_MANAGER' ? '🚛 Flotte' : '🏢 Coop'})</small></span>
        <span class="badge badge-info">${o.plan || 'Freemium'}</span>
      </div>`).join('') : '<p>Aucune inscription récente</p>';
  } catch(e) {
    document.getElementById('recentOrgs').innerHTML = '<p style="color:#E74C3C;">❌ Erreur de chargement</p>';
  }
}
