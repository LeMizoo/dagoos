// ============================================
// LOCATION.JS — Miroir exact de la landing
// ============================================

var locationEstimation = null;

function init_location() {
  var info = getPassengerInfo();

  var app = document.getElementById('app');
  app.innerHTML = `
    <div style="background:#252540;padding:16px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:50;border-bottom:1px solid rgba(245,158,11,0.2);">
      <span style="font-size:24px;">🚐</span>
      <div style="font-size:16px;font-weight:800;color:#F59E0B;">Demander une location</div>
    </div>
    <div style="padding:16px;">
      <p style="text-align:center;color:#94A3B8;font-size:12px;margin-bottom:12px;">Bus, minivan ou tricycle pour vos événements et déplacements</p>

      <div style="background:#252540;border-radius:14px;padding:16px;margin-bottom:12px;">
        <input id="locNom" placeholder="Votre nom" value="${info.name || ''}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
        <input id="locTel" placeholder="Votre téléphone" value="${info.phone || ''}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">

        <select id="locFlotte" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
          <option value="">-- Choisir une flotte --</option>
        </select>

        <select id="locType" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
          <option value="moto">🏍️ Moto</option>
          <option value="voiture">🚗 Voiture</option>
          <option value="bus">🚌 Bus</option>
          <option value="minivan">🚐 Mini Van</option>
          <option value="tricycle">🛺 Tricycle</option>
        </select>

        <select id="locTrajet" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
          <option value="A_B">A → B (aller simple)</option>
          <option value="A_B_A">A → B → A (aller-retour même jour)</option>
          <option value="A_B_A_MULTI">A → B → A (multi-jours)</option>
        </select>

        <input id="locDepart" placeholder="Adresse de départ" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;" onchange="estimerLocation()">
        <input id="locArrivee" placeholder="Adresse d'arrivée" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;" onchange="estimerLocation()">

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
          <div>
            <label style="font-size:10px;color:#94A3B8;display:block;margin-bottom:4px;">Date aller</label>
            <input id="locDateAller" type="date" style="width:100%;padding:10px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;" onchange="estimerLocation()">
          </div>
          <div>
            <label style="font-size:10px;color:#94A3B8;display:block;margin-bottom:4px;">Heure départ</label>
            <input id="locHeureDepart" type="time" value="08:00" style="width:100%;padding:10px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;" onchange="estimerLocation()">
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
          <div>
            <label style="font-size:10px;color:#94A3B8;display:block;margin-bottom:4px;">Date retour</label>
            <input id="locDateRetour" type="date" style="width:100%;padding:10px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;" onchange="estimerLocation()">
          </div>
          <div>
            <label style="font-size:10px;color:#94A3B8;display:block;margin-bottom:4px;">Heure retour</label>
            <input id="locHeureRetour" type="time" value="18:00" style="width:100%;padding:10px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;" onchange="estimerLocation()">
          </div>
        </div>

        <select id="locCarburant" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;" onchange="estimerLocation()">
          <option value="AVEC">Avec carburant</option>
          <option value="SANS">Sans carburant</option>
        </select>

        <input id="locNbPassagers" type="number" placeholder="Nombre de passagers" min="1" value="1" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:12px;">

        <div id="locEstimationResult" style="margin-bottom:12px;"></div>

        <button onclick="demanderLocation()" style="width:100%;padding:14px;background:#F59E0B;color:#1A1A2E;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Envoyer la demande</button>
      </div>
    </div>
  `;

  // Charger les flottes
  apiGet('/public/organizations').then(function(orgs) {
    var select = document.getElementById('locFlotte');
    if (select && Array.isArray(orgs)) {
      var fleets = orgs.filter(function(o) { return o.type === 'FLEET_MANAGER'; });
      fleets.forEach(function(f) {
        var opt = document.createElement('option');
        opt.value = f.slug;
        opt.textContent = f.name;
        select.appendChild(opt);
      });
      if (fleets.length === 1) select.value = fleets[0].slug;
    }
  }).catch(function() {});
}

async function estimerLocation() {
  var depart = document.getElementById('locDepart').value;
  var arrivee = document.getElementById('locArrivee').value;
  var typeVehicule = document.getElementById('locType').value;
  var typeTrajet = document.getElementById('locTrajet').value;
  var dateAller = document.getElementById('locDateAller').value;
  var dateRetour = document.getElementById('locDateRetour').value;
  var carburant = document.getElementById('locCarburant').value;
  var flotte = document.getElementById('locFlotte').value;
  var container = document.getElementById('locEstimationResult');

  if (!depart || !arrivee || !flotte) {
    if (container) container.innerHTML = '';
    return;
  }

  try {
    var result = await apiPost('/public/estimate-location', {
      organizationSlug: flotte,
      typeVehicule: typeVehicule,
      typeTrajet: typeTrajet,
      depart: depart,
      arrivee: arrivee,
      dateAller: dateAller || null,
      dateRetour: dateRetour || null,
      carburant: carburant
    });

    locationEstimation = result;

    if (result && result.prixEstime && container) {
      container.innerHTML = `
        <div style="background:#1E293B;border-radius:12px;padding:16px;border:1px solid #F59E0B;">
          <p style="text-align:center;color:#F59E0B;font-size:13px;font-weight:600;">Estimation</p>
          <div style="font-size:11px;color:#94A3B8;">Distance</div>
          <div style="font-size:22px;font-weight:800;color:#F59E0B;">${result.distanceKm} km</div>
          ${result.nbJours > 1 ? '<div style="font-size:11px;color:#94A3B8;margin-top:6px;">Nombre de jours</div><div style="font-weight:600;">' + result.nbJours + ' jours</div>' : ''}
          <div style="font-size:11px;color:#94A3B8;margin-top:8px;">Prix</div>
          <div style="font-size:26px;font-weight:800;color:#F59E0B;">${Number(result.prixEstime).toLocaleString('fr-FR')} Ar</div>
        </div>
      `;
    }
  } catch(e) {
    if (container) container.innerHTML = '';
  }
}

async function demanderLocation() {
  var nom = document.getElementById('locNom').value.trim();
  var tel = document.getElementById('locTel').value.trim();
  var depart = document.getElementById('locDepart').value;
  var arrivee = document.getElementById('locArrivee').value;
  var typeVehicule = document.getElementById('locType').value;
  var typeTrajet = document.getElementById('locTrajet').value;
  var dateAller = document.getElementById('locDateAller').value;
  var dateRetour = document.getElementById('locDateRetour').value;
  var heureDepart = document.getElementById('locHeureDepart').value;
  var heureRetour = document.getElementById('locHeureRetour').value;
  var carburant = document.getElementById('locCarburant').value;
  var nbPassagers = document.getElementById('locNbPassagers').value;
  var flotte = document.getElementById('locFlotte').value;

  if (!nom || !tel) { alert('Remplissez votre nom et téléphone'); return; }
  if (!flotte) { alert('Choisissez une flotte'); return; }
  if (!depart || !arrivee) { alert('Remplissez départ et arrivée'); return; }

  // Sauvegarder les infos passager
  setPassengerInfo({ name: nom, phone: tel });

  try {
    var result = await apiPost('/public/actions', {
      organizationSlug: flotte,
      type: 'CAR_RENTAL',
      clientNom: nom,
      clientTel: tel,
      details: {
        depart: depart,
        arrivee: arrivee,
        typeVehicule: typeVehicule,
        typeTrajet: typeTrajet,
        dateAller: dateAller || null,
        dateRetour: dateRetour || null,
        heureDepart: heureDepart || null,
        heureRetour: heureRetour || null,
        carburant: carburant,
        nbPassagers: Number(nbPassagers) || 1
      }
    });

    if (result && (result.codeSuivi || result.actionId)) {
      var code = result.codeSuivi || result.actionId;
      localStorage.setItem('dagoos_mobile_last_code', code);
      alert('✅ Demande envoyée !\n\nCode de suivi : ' + code);
      loadPage('suivi');
    } else {
      alert('❌ ' + (result.error || 'Erreur lors de la demande'));
    }
  } catch(e) {
    alert('❌ Erreur réseau');
  }
}

window.init_location = init_location;
window.estimerLocation = estimerLocation;
window.demanderLocation = demanderLocation;
