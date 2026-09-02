function init_course() {
  var depart = localStorage.getItem('dagoos_trip_depart') || '';
  var arrivee = localStorage.getItem('dagoos_trip_arrivee') || '';

  var app = document.getElementById('app');
  app.innerHTML = `
    <div style="background:#252540;padding:16px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:24px;">🚕</span>
      <div style="font-size:16px;font-weight:800;color:#F59E0B;">Demande de course</div>
    </div>
    <div style="padding:16px;">
      <div style="background:#252540;border-radius:12px;padding:16px;">
        <input id="depart" placeholder="Départ" value="${depart}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
        <input id="arrivee" placeholder="Arrivée" value="${arrivee}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
        <select id="typeVehicule" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:12px;">
          <option value="moto">🏍️ Taxi Moto</option>
          <option value="voiture">🚕 Taxi</option>
          <option value="bus">🚌 Bus</option>
          <option value="minivan">🚐 Mini Van</option>
          <option value="tricycle">🛺 Tricycle</option>
        </select>
        <button onclick="estimerPrix()" style="width:100%;padding:14px;background:#F59E0B;color:#1A1A2E;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Estimer le prix</button>
      </div>
      <div id="estimationResult" style="margin-top:12px;"></div>
    </div>
  `;
}

async function estimerPrix() {
  var depart = document.getElementById('depart').value;
  var arrivee = document.getElementById('arrivee').value;
  var typeVehicule = document.getElementById('typeVehicule').value;

  if (!depart || !arrivee) { alert('Remplissez départ et arrivée'); return; }

  localStorage.setItem('dagoos_trip_depart', depart);
  localStorage.setItem('dagoos_trip_arrivee', arrivee);

  try {
    var result = await apiPost('/public/estimate', {
      organizationSlug: 'dagoos-fleet',
      depart: depart,
      arrivee: arrivee,
      typeVehicule: typeVehicule
    });
    var container = document.getElementById('estimationResult');

    if (result && result.prixEstime) {
      container.innerHTML = `
        <div style="background:#252540;border-radius:12px;padding:16px;border:1px solid #F59E0B;">
          <div style="font-size:11px;color:#94A3B8;">Distance estimée</div>
          <div style="font-size:22px;font-weight:800;color:#F59E0B;">${result.distanceKm} km</div>
          <div style="font-size:11px;color:#94A3B8;margin-top:8px;">Prix estimé</div>
          <div style="font-size:26px;font-weight:800;color:#F59E0B;">${result.prixEstime} Ar</div>
          <button onclick="envoyerDemande()" style="width:100%;margin-top:12px;padding:14px;background:#F59E0B;color:#1A1A2E;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Confirmer la demande</button>
        </div>
      `;
    }
  } catch(e) { alert('Erreur estimation'); }
}

async function envoyerDemande() {
  var depart = localStorage.getItem('dagoos_trip_depart');
  var arrivee = localStorage.getItem('dagoos_trip_arrivee');
  var typeVehicule = document.getElementById('typeVehicule').value;
  var info = getPassengerInfo();

  try {
    var result = await apiPost('/public/actions', {
      organizationSlug: 'dagoos-fleet',
      type: 'COURSE_REQUEST',
      clientNom: info.name || 'Passager',
      clientTel: info.phone || '0000000000',
      details: { depart, arrivee, typeVehicule }
    });

    if (result && result.codeSuivi) {
      localStorage.setItem('dagoos_mobile_last_code', result.codeSuivi);
      alert('✅ Demande envoyée !\n\nCode de suivi : ' + result.codeSuivi);
      loadPage('suivi');
    }
  } catch(e) { alert('Erreur envoi'); }
}

window.init_course = init_course;
window.estimerPrix = estimerPrix;
window.envoyerDemande = envoyerDemande;
