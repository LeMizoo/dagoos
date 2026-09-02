function init_location() {
  var app = document.getElementById('app');
  app.innerHTML = `
    <div style="background:#252540;padding:16px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:50;border-bottom:1px solid rgba(245,158,11,0.2);">
      <span style="font-size:24px;">🚐</span>
      <div style="font-size:16px;font-weight:800;color:#F59E0B;">Location de véhicules</div>
    </div>
    <div style="padding:16px;">
      <div style="background:#252540;border-radius:14px;padding:16px;margin-bottom:12px;">
        <input id="locDepart" placeholder="Adresse de départ" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
        <input id="locArrivee" placeholder="Adresse d'arrivée" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
        <select id="locType" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
          <option value="bus">🚌 Bus</option>
          <option value="minivan">🚐 Mini Van</option>
          <option value="tricycle">🛺 Tricycle</option>
        </select>
        <select id="locTrajet" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:12px;">
          <option value="aller_simple">Aller simple</option>
          <option value="aller_retour">Aller-retour</option>
          <option value="multi_jours">Multi-jours</option>
        </select>
        <button onclick="estimerLocation()" style="width:100%;padding:14px;background:#F59E0B;color:#1A1A2E;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Estimer la location</button>
      </div>
      <div id="locResult"></div>
    </div>
  `;
}

async function estimerLocation() {
  var depart = document.getElementById('locDepart').value;
  var arrivee = document.getElementById('locArrivee').value;
  var typeVehicule = document.getElementById('locType').value;
  var typeTrajet = document.getElementById('locTrajet').value;

  if (!depart || !arrivee) { alert('Remplissez départ et arrivée'); return; }

  try {
    var result = await apiPost('/public/estimate-location', {
      organizationSlug: 'dagoos-fleet',
      typeVehicule: typeVehicule,
      typeTrajet: typeTrajet,
      depart: depart,
      arrivee: arrivee
    });

    var container = document.getElementById('locResult');

    if (result && result.prixEstime) {
      container.innerHTML = `
        <div style="background:#252540;border-radius:12px;padding:16px;border:1px solid #F59E0B;">
          <div style="font-size:11px;color:#94A3B8;">Distance estimée</div>
          <div style="font-size:22px;font-weight:800;color:#F59E0B;">${result.distanceKm} km</div>
          <div style="font-size:11px;color:#94A3B8;margin-top:8px;">Prix estimé</div>
          <div style="font-size:26px;font-weight:800;color:#F59E0B;">${result.prixEstime} Ar</div>
        </div>
      `;
    }
  } catch(e) {
    alert('Erreur estimation');
  }
}

window.init_location = init_location;
window.estimerLocation = estimerLocation;
