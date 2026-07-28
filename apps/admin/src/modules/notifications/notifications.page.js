// DAGOO'S - Notifications
async function init_notifications() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="topbar"><h1>🔔 Alertes</h1></div>
    <div class="card" id="notifList"><p>Chargement...</p></div>`;
  loadNotifications();
}

async function loadNotifications() {
  try {
    const notifs = await apiGet('/notifications');
    document.getElementById('notifList').innerHTML = notifs.length ? notifs.map(n => `
      <div style="padding:12px;border-bottom:1px solid var(--border);${n.read ? '' : 'background:rgba(26,82,118,0.05);'}">
        <strong>${n.title || 'Notification'}</strong>
        <p style="color:#6C757D;font-size:13px;">${n.message || ''}</p>
        <small>${new Date(n.createdAt).toLocaleString('fr-FR')}</small>
      </div>`).join('') : '<p style="padding:20px;text-align:center;">📭 Aucune alerte</p>';
  } catch(e) {}
}
