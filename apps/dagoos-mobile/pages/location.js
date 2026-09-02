async function getFirstOrganizationSlug() {
  try {
    var orgs = await apiGet('/public/organizations');
    if (Array.isArray(orgs) && orgs.length > 0) {
      var org = orgs.find(function(o) { return o.type === 'FLEET_MANAGER'; }) || orgs[0];
      return org.slug || 'dagoos-fleet';
    }
  } catch(e) {}
  return 'dagoos-fleet';
}

window.getFirstOrganizationSlug = getFirstOrganizationSlug;

var locationEstimation = null;

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
        
        <select id="locTrajet" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
          <option value="A_B">Aller simple</option>
          <option value="A_B_A">Aller-retour</option>
          <option value="A_B_A_MULTI">Multi-jours</option>
        </select>

        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <input id="locDateAller" type="date" style="flex:1;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;">
          <input id="locDateRetour" type="date" style="flex:1;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;">
        </div>

        <select id="locCarburant" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:12px;">
          <option value="AVEC">⛽ Avec carburant</option>
          <option value="SANS">🚫 Sans carburant</option>
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
  var dateAller = document.getElementById('locDateAller').value;
  var dateRetour = document.getElementById('locDateRetour').value;
  var carburant = document.getElementById('locCarburant').value;

  if (!depart || !arrivee) { alert('Remplissez départ et arrivée'); return; }

  try {
    var result = await apiPost('/public/estimate-location', {
      organizationSlug: await getFirstOrganizationSlug(),
      typeVehicule: typeVehicule,
      typeTrajet: typeTrajet,
      depart: depart,
      arrivee: arrivee,
      dateAller: dateAller || null,
      dateRetour: dateRetour || null,
      carburant: carburant
    });

    locationEstimation = result;

    var container = document.getElementById('locResult');

    if (result && result.prixEstime) {
      container.innerHTML = `
        <div style="background:#252540;border-radius:12px;padding:16px;border:1px solid #F59E0B;">
          <div style="font-size:11px;color:#94A3B8;">Distance estimée</div>
          <div style="font-size:22px;font-weight:800;color:#F59E0B;">${result.distanceKm} km</div>
          ${result.nbJours > 1 ? '<div style="font-size:11px;color:#94A3B8;margin-top:6px;">Nombre de jours</div><div style="font-weight:600;">' + result.nbJours + ' jours</div>' : ''}
          <div style="font-size:11px;color:#94A3B8;margin-top:8px;">Prix estimé</div>
          <div style="font-size:26px;font-weight:800;color:#F59E0B;">${result.prixEstime} Ar</div>
          <button onclick="demanderLocation()" style="width:100%;margin-top:12px;padding:14px;background:#F59E0B;color:#1A1A2E;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Demander cette location</button>
        </div>
      `;
    }
  } catch(e) {
    alert('Erreur estimation : ' + (e.message || 'réseau'));
  }
}

async function demanderLocation() {
  var depart = document.getElementById('locDepart').value;
  var arrivee = document.getElementById('locArrivee').value;
  var typeVehicule = document.getElementById('locType').value;
  var typeTrajet = document.getElementById('locTrajet').value;
  var dateAller = document.getElementById('locDateAller').value;
  var dateRetour = document.getElementById('locDateRetour').value;
  var carburant = document.getElementById('locCarburant').value;
  var info = getPassengerInfo();

  try {
    var result = await apiPost('/public/actions', {
      organizationSlug: await getFirstOrganizationSlug(),
      type: 'CAR_RENTAL',
      clientNom: info.name || 'Passager',
      clientTel: info.phone || '0000000000',
      details: {
        depart: depart,
        arrivee: arrivee,
        typeVehicule: typeVehicule,
        typeTrajet: typeTrajet,
        dateAller: dateAller || null,
        dateRetour: dateRetour || null,
        carburant: carburant,
        prixEstime: locationEstimation ? locationEstimation.prixEstime : 0,
        distanceKm: locationEstimation ? locationEstimation.distanceKm : 0,
        nbJours: locationEstimation ? locationEstimation.nbJours : 1
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
