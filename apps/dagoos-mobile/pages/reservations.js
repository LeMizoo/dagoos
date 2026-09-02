function init_reservations() {
  var app = document.getElementById('app');
  app.innerHTML = `
    <div style="background:#064E3B;padding:16px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:50;">
      <span style="font-size:24px;">🚌</span>
      <div style="font-size:16px;font-weight:800;color:#10B981;">Départs inter-urbains</div>
    </div>
    <div style="padding:16px;">
      <div style="background:#064E3B;border-radius:14px;padding:16px;text-align:center;">
        <span style="font-size:40px;">🚌</span>
        <div style="font-size:14px;font-weight:700;margin-top:8px;">Bientôt disponible</div>
        <div style="font-size:11px;color:#94A3B8;margin-top:4px;">Consultez les départs et réservez votre place</div>
      </div>
    </div>
  `;
}

window.init_reservations = init_reservations;
