function init_home() {
  var app = document.getElementById('app');

  app.innerHTML = `
    <div style="background:#064E3B;padding:16px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:50;">
      <img src="/b-trans.svg" style="width:36px;height:36px;object-fit:contain;border-radius:8px;">
      <div>
        <div style="font-size:16px;font-weight:800;color:#10B981;">DAGOO'S</div>
        <div style="font-size:10px;color:#94A3B8;">Chez les potes, ça roule.</div>
      </div>
    </div>

    <div style="padding:16px;">
      <h2 style="font-size:18px;font-weight:800;margin-bottom:12px;">Choisissez un service</h2>

      <!-- Taxi Urbain -->
      <div onclick="loadPage('course')" style="background:#064E3B;border-radius:14px;padding:16px;margin-bottom:10px;cursor:pointer;display:flex;align-items:center;gap:14px;border:1px solid rgba(16,185,129,0.2);">
        <span style="font-size:32px;">🚕</span>
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:700;color:#fff;">Demandez un taxi</div>
          <div style="font-size:11px;color:#94A3B8;margin-top:2px;">Taxi ou moto à proximité, suivi en direct</div>
          <div style="display:flex;gap:8px;margin-top:6px;">
            <span style="font-size:9px;background:rgba(16,185,129,0.15);color:#10B981;padding:3px 8px;border-radius:20px;">Géolocalisation</span>
            <span style="font-size:9px;background:rgba(16,185,129,0.15);color:#10B981;padding:3px 8px;border-radius:20px;">Rapide</span>
          </div>
        </div>
        <span style="color:#10B981;font-size:20px;">→</span>
      </div>

      <!-- Départs Inter-urbains -->
      <div onclick="loadPage('reservations')" style="background:#064E3B;border-radius:14px;padding:16px;margin-bottom:10px;cursor:pointer;display:flex;align-items:center;gap:14px;border:1px solid rgba(16,185,129,0.2);">
        <span style="font-size:32px;">🚌</span>
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:700;color:#fff;">Départs inter-urbains</div>
          <div style="font-size:11px;color:#94A3B8;margin-top:2px;">Consultez les départs et réservez votre place</div>
          <div style="display:flex;gap:8px;margin-top:6px;">
            <span style="font-size:9px;background:rgba(16,185,129,0.15);color:#10B981;padding:3px 8px;border-radius:20px;">Réservation</span>
            <span style="font-size:9px;background:rgba(16,185,129,0.15);color:#10B981;padding:3px 8px;border-radius:20px;">Confort</span>
          </div>
        </div>
        <span style="color:#10B981;font-size:20px;">→</span>
      </div>

      <!-- Location Urbaine -->
      <div onclick="loadPage('location')" style="background:#064E3B;border-radius:14px;padding:16px;margin-bottom:10px;cursor:pointer;display:flex;align-items:center;gap:14px;border:1px solid rgba(16,185,129,0.2);">
        <span style="font-size:32px;">🚐</span>
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:700;color:#fff;">Location urbaine</div>
          <div style="font-size:11px;color:#94A3B8;margin-top:2px;">Bus, minivan ou tricycle pour vos événements</div>
          <div style="display:flex;gap:8px;margin-top:6px;">
            <span style="font-size:9px;background:rgba(16,185,129,0.15);color:#10B981;padding:3px 8px;border-radius:20px;">Avec chauffeur</span>
            <span style="font-size:9px;background:rgba(16,185,129,0.15);color:#10B981;padding:3px 8px;border-radius:20px;">Flexible</span>
          </div>
        </div>
        <span style="color:#10B981;font-size:20px;">→</span>
      </div>

      <!-- Location Inter-urbaine -->
      <div onclick="loadPage('location')" style="background:#064E3B;border-radius:14px;padding:16px;margin-bottom:10px;cursor:pointer;display:flex;align-items:center;gap:14px;border:1px solid rgba(16,185,129,0.2);">
        <span style="font-size:32px;">🗺️</span>
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:700;color:#fff;">Location inter-urbaine</div>
          <div style="font-size:11px;color:#94A3B8;margin-top:2px;">Déplacements vers tout Madagascar</div>
          <div style="display:flex;gap:8px;margin-top:6px;">
            <span style="font-size:9px;background:rgba(16,185,129,0.15);color:#10B981;padding:3px 8px;border-radius:20px;">Longue distance</span>
            <span style="font-size:9px;background:rgba(16,185,129,0.15);color:#10B981;padding:3px 8px;border-radius:20px;">Multi-jours</span>
          </div>
        </div>
        <span style="color:#10B981;font-size:20px;">→</span>
      </div>

      <!-- Suivi -->
      <div onclick="loadPage('suivi')" style="background:#064E3B;border-radius:14px;padding:16px;cursor:pointer;display:flex;align-items:center;gap:14px;border:1px solid rgba(16,185,129,0.2);">
        <span style="font-size:32px;">📋</span>
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:700;color:#fff;">Suivre ma demande</div>
          <div style="font-size:11px;color:#94A3B8;margin-top:2px;">Vérifiez le statut avec votre code de suivi</div>
        </div>
        <span style="color:#10B981;font-size:20px;">→</span>
      </div>
    </div>
  `;
}

window.init_home = init_home;
