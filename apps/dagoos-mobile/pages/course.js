// ============================================
// COURSE.JS — Miroir exact de la landing
// ============================================

var positionGPS = null;
var adresseGPS = '';
var mode = 'choisir';
var flottesDisponibles = [];

async function chargerFlottes() {
  try {
    var orgs = await apiGet('/public/organizations');
    if (Array.isArray(orgs)) {
      flottesDisponibles = orgs.filter(function(o) { return o.type === 'FLEET_MANAGER'; });
      return flottesDisponibles;
    }
  } catch(e) {}
  return [];
}

window.chargerFlottes = chargerFlottes;

function init_course() {
  var depart = localStorage.getItem('dagoos_trip_depart') || '';
  var arrivee = localStorage.getItem('dagoos_trip_arrivee') || '';
  var info = getPassengerInfo();
  mode = 'choisir';
  positionGPS = null;

  var app = document.getElementById('app');
  app.innerHTML = `
    <div style="background:#252540;padding:16px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:24px;">🚕</span>
      <div style="font-size:16px;font-weight:800;color:#F59E0B;">Demander un taxi</div>
    </div>
    <div style="padding:16px;">
      <p style="text-align:center;color:#94A3B8;font-size:12px;margin-bottom:12px;">Choisissez comment vous voulez être mis en relation</p>

      <!-- Mode de mise en relation -->
      <div style="display:flex;gap:8px;margin-bottom:16px;justify-content:center;">
        <button id="btnChoisir" onclick="setMode('choisir')" style="padding:8px 12px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid #F59E0B;background:#F59E0B;color:#1A1A2E;cursor:pointer;">Choisir une flotte</button>
        <button id="btnToutes" onclick="setMode('toutes')" style="padding:8px 12px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid #F59E0B;background:#252540;color:#F59E0B;cursor:pointer;">Toutes les flottes</button>
        <button id="btnProche" onclick="setMode('proche')" style="padding:8px 12px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid #F59E0B;background:#252540;color:#F59E0B;cursor:pointer;">La plus proche</button>
      </div>

      <div style="background:#252540;border-radius:14px;padding:16px;">
        <input id="clientNom" placeholder="Votre nom" value="${info.name || ''}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
        <input id="clientTel" placeholder="Votre téléphone" value="${info.phone || ''}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
        <input id="depart" placeholder="Adresse de départ" value="${depart}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
        <input id="arrivee" placeholder="Adresse d'arrivée" value="${arrivee}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">

        <select id="typeVehicule" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
          <option value="moto">🏍️ Taxi moto</option>
          <option value="voiture">🚕 Taxi voiture</option>
        </select>

        <div id="flotteContainer" style="margin-bottom:8px;"></div>
        <div id="positionContainer" style="margin-bottom:8px;"></div>
        <div id="estimationResult" style="margin-top:12px;"></div>

        <button id="btnSubmit" onclick="envoyerDemande()" style="width:100%;padding:14px;background:#F59E0B;color:#1A1A2E;border:none;border-radius:8px;font-weight:700;cursor:pointer;margin-top:12px;">Demander un taxi</button>
      </div>
    </div>
  `;

  chargerFlottes().then(function() { updateUI(); });
}

function setMode(nouveauMode) {
  mode = nouveauMode;
  updateUI();
}

function updateUI() {
  var btnChoisir = document.getElementById('btnChoisir');
  var btnToutes = document.getElementById('btnToutes');
  var btnProche = document.getElementById('btnProche');
  var flotteContainer = document.getElementById('flotteContainer');
  var positionContainer = document.getElementById('positionContainer');
  var btnSubmit = document.getElementById('btnSubmit');

  // Mettre à jour les boutons
  [btnChoisir, btnToutes, btnProche].forEach(function(btn) {
    if (btn) {
      btn.style.background = '#252540';
      btn.style.color = '#F59E0B';
      btn.style.border = '1px solid #F59E0B';
    }
  });

  var btnActif = mode === 'choisir' ? btnChoisir : mode === 'toutes' ? btnToutes : btnProche;
  if (btnActif) {
    btnActif.style.background = '#F59E0B';
    btnActif.style.color = '#1A1A2E';
  }

  // Afficher le dropdown flotte si mode = choisir
  if (flotteContainer) {
    if (mode === 'choisir') {
      var optionsHtml = '<option value="">-- Choisir une flotte --</option>';
      flottesDisponibles.forEach(function(f) {
        optionsHtml += '<option value="' + f.slug + '">' + f.name + '</option>';
      });
      flotteContainer.innerHTML = `
        <select id="flotte" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;" onchange="estimerPrix()">
          ${optionsHtml}
        </select>
        <p style="text-align:center;color:#94A3B8;font-size:11px;margin-bottom:8px;">💡 Choisissez une flotte puis saisissez départ et arrivée pour voir l'estimation</p>
      `;
    } else {
      flotteContainer.innerHTML = '';
    }
  }

  // Afficher le bouton géolocalisation si mode = proche
  if (positionContainer) {
    if (mode === 'proche') {
      positionContainer.innerHTML = `
        <button onclick="detecterPosition()" type="button" style="width:100%;padding:10px;background:#1E293B;color:#94A3B8;border:1px solid #333;border-radius:8px;font-size:12px;cursor:pointer;">📍 Détecter ma position</button>
        <div id="posDetectee"></div>
      `;
    } else {
      positionContainer.innerHTML = '';
    }
  }

  // Mettre à jour le texte du bouton
  if (btnSubmit) {
    if (mode === 'toutes') {
      btnSubmit.textContent = 'Envoyer à toutes les flottes';
    } else if (mode === 'proche') {
      btnSubmit.textContent = 'Trouver la flotte la plus proche';
    } else {
      btnSubmit.textContent = 'Demander un taxi';
    }
  }
}

function detecterPosition() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        positionGPS = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        var departInput = document.getElementById('depart');
        if (departInput) {
          departInput.value = 'Position détectée (' + pos.coords.latitude.toFixed(4) + ', ' + pos.coords.longitude.toFixed(4) + ')';
        }
        var posDiv = document.getElementById('posDetectee');
        if (posDiv) {
          posDiv.innerHTML = '<p style="text-align:center;color:#22C55E;font-size:12px;margin-top:8px;">✅ Position détectée : ' + pos.coords.latitude.toFixed(4) + ', ' + pos.coords.longitude.toFixed(4) + '</p>';
        }
        estimerPrix();
      },
      function() { alert('❌ Géolocalisation refusée'); }
    );
  } else {
    alert('❌ Géolocalisation non supportée');
  }
}

async function estimerPrix() {
  var depart = document.getElementById('depart').value;
  var arrivee = document.getElementById('arrivee').value;
  var typeVehicule = document.getElementById('typeVehicule').value;
  var container = document.getElementById('estimationResult');

  // En mode proche, on utilise la première flotte disponible
  var flotte = '';
  if (mode === 'proche') {
    flotte = flottesDisponibles.length > 0 ? flottesDisponibles[0].slug : '';
  } else {
    var flotteSelect = document.getElementById('flotte');
    flotte = flotteSelect ? flotteSelect.value : '';
  }

  if (!depart || !arrivee) return;

  localStorage.setItem('dagoos_trip_depart', depart);
  localStorage.setItem('dagoos_trip_arrivee', arrivee);

  if (!flotte) {
    if (container) container.innerHTML = '';
    return;
  }

  try {
    var result = await apiPost('/public/estimate', {
      organizationSlug: flotte,
      depart: depart,
      arrivee: arrivee,
      typeVehicule: typeVehicule
    });

    if (result && result.prixEstime && container) {
      container.innerHTML = `
        <div style="background:#1E293B;border-radius:12px;padding:16px;border:1px solid #F59E0B;">
          <p style="text-align:center;color:#F59E0B;font-size:13px;font-weight:600;">Estimation</p>
          <div style="font-size:11px;color:#94A3B8;">Distance approximative</div>
          <div style="font-size:22px;font-weight:800;color:#F59E0B;">${result.distanceKm} km</div>
          <div style="font-size:11px;color:#94A3B8;margin-top:8px;">Prix de la course</div>
          <div style="font-size:26px;font-weight:800;color:#F59E0B;">${Number(result.prixEstime).toLocaleString('fr-FR')} Ar</div>
          <input id="offreClient" type="number" placeholder="Votre offre (Ar)" min="0" style="width:100%;margin-top:8px;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;text-align:center;">
          <p style="text-align:center;color:#94A3B8;font-size:10px;margin-top:4px;">💡 Proposez votre prix — le chauffeur accepte ou refuse</p>
        </div>
      `;
    }
  } catch(e) { alert('Erreur estimation'); }
}

async function envoyerDemande() {
  var nom = document.getElementById('clientNom').value.trim();
  var tel = document.getElementById('clientTel').value.trim();
  var depart = document.getElementById('depart').value;
  var arrivee = document.getElementById('arrivee').value;
  var typeVehicule = document.getElementById('typeVehicule').value;
  var offreClient = document.getElementById('offreClient') ? document.getElementById('offreClient').value : null;

  if (!nom || !tel) { alert('Remplissez votre nom et téléphone'); return; }
  if (!depart || !arrivee) { alert('Remplissez départ et arrivée'); return; }

  // Sauvegarder les infos passager
  setPassengerInfo({ name: nom, phone: tel });

  var details = {
    depart: depart,
    arrivee: arrivee,
    typeVehicule: typeVehicule,
    mode: mode
  };

  if (positionGPS) {
    details.position = positionGPS;
  }

  if (offreClient && Number(offreClient) > 0) {
    details.offreClient = Number(offreClient);
  }

  try {
    if (mode === 'toutes') {
      // Envoyer à toutes les flottes
      var sent = 0;
      for (var i = 0; i < flottesDisponibles.length; i++) {
        try {
          var res = await apiPost('/public/actions', {
            organizationSlug: flottesDisponibles[i].slug,
            type: 'COURSE_REQUEST',
            clientNom: nom,
            clientTel: tel,
            details: details
          });
          if (res && res.ok !== false) sent++;
        } catch(e) {}
      }
      alert('✅ Demande envoyée à ' + sent + ' flotte(s) !');
      loadPage('suivi');
    } else if (mode === 'proche') {
      if (flottesDisponibles.length === 0) {
        alert('Aucune flotte disponible');
        return;
      }
      var result = await apiPost('/public/actions', {
        organizationSlug: flottesDisponibles[0].slug,
        type: 'COURSE_REQUEST',
        clientNom: nom,
        clientTel: tel,
        details: details
      });
      if (result && result.codeSuivi) {
        localStorage.setItem('dagoos_mobile_last_code', result.codeSuivi);
        alert('✅ Demande envoyée !\n\nCode de suivi : ' + result.codeSuivi);
        loadPage('suivi');
      } else {
        alert('❌ ' + (result.error || 'Erreur envoi'));
      }
    } else {
      // Mode choisir
      var flotteSelect = document.getElementById('flotte');
      var flotte = flotteSelect ? flotteSelect.value : '';
      if (!flotte) { alert('Veuillez choisir une flotte'); return; }

      var result = await apiPost('/public/actions', {
        organizationSlug: flotte,
        type: 'COURSE_REQUEST',
        clientNom: nom,
        clientTel: tel,
        details: details
      });
      if (result && result.codeSuivi) {
        localStorage.setItem('dagoos_mobile_last_code', result.codeSuivi);
        alert('✅ Demande envoyée !\n\nCode de suivi : ' + result.codeSuivi);
        loadPage('suivi');
      } else {
        alert('❌ ' + (result.error || 'Erreur envoi'));
      }
    }
  } catch(e) { alert('❌ Erreur réseau'); }
}

window.init_course = init_course;
window.setMode = setMode;
window.estimerPrix = estimerPrix;
window.envoyerDemande = envoyerDemande;
window.detecterPosition = detecterPosition;
window.chargerFlottes = chargerFlottes;
