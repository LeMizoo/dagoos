function init_location() {
  var app = document.getElementById('app');
  app.innerHTML = `
    <div style="background:#252540;padding:16px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:50;">
      <span style="font-size:24px;">🚐</span>
      <div style="font-size:16px;font-weight:800;color:#F59E0B;">Location de véhicules</div>
    </div>
    <div style="padding:16px;">
      <div style="background:#252540;border-radius:14px;padding:16px;margin-bottom:10px;">
        <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:6px;">🚐 Location urbaine</div>
        <div style="font-size:11px;color:#94A3B8;">Bus, minivan ou tricycle pour vos événements et déplacements.</div>
      </div>
      <div style="background:#252540;border-radius:14px;padding:16px;">
        <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:6px;">🗺️ Location inter-urbaine</div>
        <div style="font-size:11px;color:#94A3B8;">Déplacements vers tout le territoire de Madagascar. Longue distance, multi-jours.</div>
      </div>
      <div style="margin-top:12px;text-align:center;color:#94A3B8;font-size:11px;">Formulaire de demande bientôt disponible</div>
    </div>
  `;
}

window.init_location = init_location;
