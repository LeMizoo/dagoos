// ============================================
// COURSE.JS — Miroir exact de la landing
// ============================================

// P7-E2-FIX : helper local (fallback si escape.js pas chargé).
function escapeHtmlLocal(value) {
  if (window.escapeHtml) return window.escapeHtml(value);
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
    <div style="background:#FFFFFF;padding:16px;display:flex;align-items:center;gap:12px;">
      <i data-lucide="car" style="font-size:22px;"></i>
      <div style="font-size:16px;font-weight:800;color:#D99A00;">Demander un taxi</div>
    </div>
    <div style="padding:16px;">
      <p style="text-align:center;color:#64748B;font-size:12px;margin-bottom:12px;">Choisissez comment vous voulez être mis en relation</p>

      <!-- Mode de mise en relation -->
      <div style="display:flex;gap:8px;margin-bottom:16px;justify-content:center;">
        <button id="btnChoisir" onclick="setMode('choisir')" style="padding:8px 12px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid #D99A00;background:#D99A00;color:#F7F8FA;cursor:pointer;">Choisir une flotte</button>
        <button id="btnToutes" onclick="setMode('toutes')" style="padding:8px 12px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid #D99A00;background:#FFFFFF;color:#D99A00;cursor:pointer;">Toutes les flottes</button>
        <button id="btnProche" onclick="setMode('proche')" style="padding:8px 12px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid #D99A00;background:#FFFFFF;color:#D99A00;cursor:pointer;">La plus proche</button>
      </div>

      <div style="background:#FFFFFF;border-radius:14px;padding:16px;">
        <input id="clientNom" placeholder="Votre nom" value="${escapeHtmlLocal(info.name)}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #E2E8F0;background:#F7F8FA;color:#1E293B;margin-bottom:8px;">
        <input id="clientTel" placeholder="Votre téléphone" value="${escapeHtmlLocal(info.phone)}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #E2E8F0;background:#F7F8FA;color:#1E293B;margin-bottom:8px;">
        <input id="depart" placeholder="Adresse de départ" value="${escapeHtmlLocal(depart)}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #E2E8F0;background:#F7F8FA;color:#1E293B;margin-bottom:8px;">
        <input id="arrivee" placeholder="Adresse d'arrivée" value="${escapeHtmlLocal(arrivee)}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #E2E8F0;background:#F7F8FA;color:#1E293B;margin-bottom:8px;">

        <select id="typeVehicule" style="width:100%;padding:12px;border-radius:8px;border:1px solid #E2E8F0;background:#F7F8FA;color:#1E293B;margin-bottom:8px;">
          <option value="moto"><i data-lucide="bike" style="font-size:18px;display:inline-block;vertical-align:middle;"></i> Taxi moto</option>
          <option value="voiture"><i data-lucide="car" style="font-size:18px;display:inline-block;vertical-align:middle;"></i> Taxi voiture</option>
        </select>

        <div id="flotteContainer" style="margin-bottom:8px;"></div>
        <div id="positionContainer" style="margin-bottom:8px;"></div>
        <div id="estimationResult" style="margin-top:12px;"></div>

        <button id="btnSubmit" onclick="envoyerDemande()" style="width:100%;padding:14px;background:#D99A00;color:#F7F8FA;border:none;border-radius:8px;font-weight:700;cursor:pointer;margin-top:12px;">Demander un taxi</button>
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
      btn.style.background = '#FFFFFF';
      btn.style.color = '#D99A00';
      btn.style.border = '1px solid #D99A00';
    }
  });

  var btnActif = mode === 'choisir' ? btnChoisir : mode === 'toutes' ? btnToutes : btnProche;
  if (btnActif) {
    btnActif.style.background = '#D99A00';
    btnActif.style.color = '#F7F8FA';
  }

  // Afficher le dropdown flotte si mode = choisir
  if (flotteContainer) {
    if (mode === 'choisir') {
      var optionsHtml = '<option value="">-- Choisir une flotte --</option>';
      flottesDisponibles.forEach(function(f) {
        optionsHtml += '<option value="' + escapeHtmlLocal(f.slug) + '">' + escapeHtmlLocal(f.name) + '</option>';
      });
      flotteContainer.innerHTML = `
        <select id="flotte" style="width:100%;padding:12px;border-radius:8px;border:1px solid #E2E8F0;background:#F7F8FA;color:#1E293B;margin-bottom:8px;" onchange="localStorage.setItem('dagoos_selected_fleet_slug', this.value); chargerBrandingOrganisation(this.value); estimerPrix()">
          ${optionsHtml}
        </select>
        <p style="text-align:center;color:#64748B;font-size:11px;margin-bottom:8px;"><i data-lucide="lightbulb" style="font-size:18px;display:inline-block;vertical-align:middle;"></i> Choisissez une flotte puis saisissez départ et arrivée pour voir l'estimation</p>
      `;
    } else {
      flotteContainer.innerHTML = '';
    }
  }

  // Afficher le bouton géolocalisation si mode = proche
  if (positionContainer) {
    if (mode === 'proche') {
      positionContainer.innerHTML = `
        <button onclick="detecterPosition()" type="button" style="width:100%;padding:10px;background:#F1F5F9;color:#64748B;border:1px solid #E2E8F0;border-radius:8px;font-size:12px;cursor:pointer;"><i data-lucide="map-pin" style="font-size:18px;display:inline-block;vertical-align:middle;"></i> Détecter ma position</button>
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
          posDiv.innerHTML = '<p style="text-align:center;color:#16A34A;font-size:12px;margin-top:8px;"><i data-lucide="check-circle" style="font-size:18px;display:inline-block;vertical-align:middle;"></i> Position détectée : ' + pos.coords.latitude.toFixed(4) + ', ' + pos.coords.longitude.toFixed(4) + '</p>';
        }
        estimerPrix();
      },
      function() { alert('Géolocalisation refusée'); }
    );
  } else {
    alert('Géolocalisation non supportée');
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
        <div style="background:#F1F5F9;border-radius:12px;padding:16px;border:1px solid #D99A00;">
          <p style="text-align:center;color:#D99A00;font-size:13px;font-weight:600;">Estimation</p>
          <div style="font-size:11px;color:#64748B;">Distance approximative</div>
          <div style="font-size:22px;font-weight:800;color:#D99A00;">${result.distanceKm} km</div>
          <div style="font-size:11px;color:#64748B;margin-top:8px;">Prix de la course</div>
          <div style="font-size:26px;font-weight:800;color:#D99A00;">${Number(result.prixEstime).toLocaleString('fr-FR')} Ar</div>
          <input id="offreClient" type="number" placeholder="Votre offre (Ar)" min="0" style="width:100%;margin-top:8px;padding:12px;border-radius:8px;border:1px solid #E2E8F0;background:#F7F8FA;color:#1E293B;text-align:center;">
          <p style="text-align:center;color:#64748B;font-size:10px;margin-top:4px;"><i data-lucide="lightbulb" style="font-size:18px;display:inline-block;vertical-align:middle;"></i> Proposez votre prix — le chauffeur accepte ou refuse</p>
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
      alert('Demande envoyée à ' + sent + ' flotte(s) !');
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
        alert('Demande envoyée !\n\nCode de suivi : ' + result.codeSuivi);
        loadPage('suivi');
      } else {
        alert((result.error || 'Erreur envoi'));
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
        alert('Demande envoyée !\n\nCode de suivi : ' + result.codeSuivi);
        loadPage('suivi');
      } else {
        alert((result.error || 'Erreur envoi'));
      }
    }
  } catch(e) { alert('Erreur réseau'); }
}

window.init_course = init_course;
window.setMode = setMode;
window.estimerPrix = estimerPrix;
window.envoyerDemande = envoyerDemande;
window.detecterPosition = detecterPosition;
window.chargerFlottes = chargerFlottes;
