// ============================================
// RESERVATIONS.JS — Miroir exact de la landing
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

var selectedDepart = null;
var selectedPlaces = [];
var passagers = {};

function init_reservations() {
  var app = document.getElementById('app');
  app.innerHTML = `
    <div style="background:#252540;padding:16px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:50;border-bottom:1px solid rgba(245,158,11,0.2);">
      <i data-lucide="bus" style="font-size:22px;"></i>
      <div style="font-size:16px;font-weight:800;color:#F59E0B;">Départs inter-urbains</div>
    </div>
    <div style="padding:16px;">
      <div id="departList" style="margin-bottom:16px;"></div>
      <button onclick="chargerDeparts()" style="width:100%;padding:14px;background:#F59E0B;color:#1A1A2E;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i data-lucide="refresh-cw" style="font-size:18px;display:inline-block;vertical-align:middle;"></i> Actualiser</button>
      <button onclick="afficherGestion()" style="width:100%;margin-top:8px;padding:14px;background:#1E293B;color:#94A3B8;border:1px solid #333;border-radius:8px;font-weight:600;cursor:pointer;"><i data-lucide="clipboard-list" style="font-size:18px;display:inline-block;vertical-align:middle;"></i> Gérer ma réservation (OTP)</button>
      <div id="gestionContainer" style="margin-top:12px;"></div>
    </div>
  `;
  chargerDeparts();
}

async function chargerDeparts() {
  var container = document.getElementById('departList');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:30px;color:#94A3B8;">Chargement des départs...</div>';

  try {
    var result = await apiGet('/public/organizations');
    var orgs = Array.isArray(result) ? result : [];
    var departs = [];

    // Extraire TOUS les départs retournés par l'API
    orgs.forEach(function(org) {
      if (org.departs && Array.isArray(org.departs)) {
        org.departs.forEach(function(d) {
          departs.push({
            id: d.id,
            pointDepart: d.pointDepart,
            destination: d.destination,
            date: d.date,
            heure: d.heure,
            prix: d.prix,
            placesTotal: d.placesTotal || 26,
            statut: d.statut || 'PUBLISHED',
            organization: org.name,
            reservations: d.reservations || []
          });
        });
      }
    });

    if (departs.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:30px;color:#94A3B8;">Aucun départ disponible</div>';
      return;
    }

    container.innerHTML = '';

    departs.forEach(function(depart) {
      var placesReservees = depart.reservations.map(function(r) { return r.place; });
      var placesDisponibles = depart.placesTotal - placesReservees.length;

      var card = document.createElement('div');
      card.style.cssText = 'background:#252540;border-radius:12px;padding:16px;' +
        'margin-bottom:10px;border:1px solid rgba(245,158,11,0.2);';

      var row1 = document.createElement('div');
      row1.style.cssText = 'display:flex;justify-content:space-between;' +
        'align-items:center;margin-bottom:8px;';

      var trajet = document.createElement('div');
      trajet.style.cssText = 'font-size:15px;font-weight:700;color:#fff;';
      trajet.textContent = depart.pointDepart + ' \u2192 ' + depart.destination;

      var orgBadge = document.createElement('span');
      orgBadge.style.cssText = 'background:rgba(245,158,11,0.15);color:#F59E0B;' +
        'padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;';
      orgBadge.textContent = depart.organization || '';

      row1.appendChild(trajet);
      row1.appendChild(orgBadge);
      card.appendChild(row1);

      var row2 = document.createElement('div');
      row2.style.cssText = 'display:flex;gap:16px;font-size:11px;' +
        'color:#94A3B8;margin-bottom:8px;';

      var dateSpan = document.createElement('span');
      dateSpan.textContent = new Date(depart.date).toLocaleDateString('fr-FR');

      var heureSpan = document.createElement('span');
      heureSpan.textContent = depart.heure || '--:--';

      var placesSpan = document.createElement('span');
      placesSpan.textContent = placesDisponibles + ' / ' + depart.placesTotal + ' places';

      row2.appendChild(dateSpan);
      row2.appendChild(heureSpan);
      row2.appendChild(placesSpan);
      card.appendChild(row2);

      var row3 = document.createElement('div');
      row3.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';

      var prix = document.createElement('div');
      prix.style.cssText = 'font-size:18px;font-weight:800;color:#F59E0B;';
      prix.textContent = Number(depart.prix || 0).toLocaleString('fr-FR') + ' Ar';

      var btnReserver = document.createElement('button');
      btnReserver.textContent = 'R\u00e9server';
      btnReserver.style.cssText = 'padding:10px 16px;background:#F59E0B;' +
        'color:#1A1A2E;border:none;border-radius:8px;font-weight:700;cursor:pointer;';
      btnReserver.addEventListener('click', function() {
        selectionnerDepart(depart.id);
      });

      row3.appendChild(prix);
      row3.appendChild(btnReserver);
      card.appendChild(row3);

      container.appendChild(card);
    });
  } catch(e) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:#E74C3C;">Erreur de chargement</div>';
  }
}

function selectionnerDepart(departId) {
  // Recharger les départs pour avoir les données fraîches
  apiGet('/public/organizations').then(function(orgs) {
    var allDeparts = [];
    if (Array.isArray(orgs)) {
      orgs.forEach(function(org) {
        if (org.departs && Array.isArray(org.departs)) {
          org.departs.forEach(function(d) { allDeparts.push(d); });
        }
      });
    }

    var depart = allDeparts.find(function(d) { return d.id === departId; });
    if (!depart) { alert('Départ introuvable'); return; }

    selectedDepart = depart;
    selectedPlaces = [];
    passagers = {};

    afficherFormulaireReservation(depart);
  }).catch(function() {
    alert('Erreur de chargement');
  });
}

function afficherFormulaireReservation(depart) {
  var container = document.getElementById('departList');
  if (!container) return;

  var placesReservees = (depart.reservations || []).map(function(r) { return r.place; });
  var placesDisponibles = depart.placesTotal - placesReservees.length;

  // Générer la grille de places style bus
  // Labels alignés sur la landing : 1A, 2A, 3A, 4A, 1B, 2B...
  var rangees = ['A', 'B', 'C', 'D', 'E', 'F'];
  var gridHtml = '';

  // Chauffeur
  gridHtml += `
    <div style="text-align:center;margin-bottom:12px;">
      <span style="font-size:12px;color:#94A3B8;">🧑‍✈️ Conducteur</span>
    </div>
  `;

  // Fonction pour générer un bouton place avec label formaté
  function boutonPlace(label, estReservee, estSelectionnee) {
    var bg = estReservee ? '#EF4444' : estSelectionnee ? '#3B82F6' : '#1A1A2E';
    var color = estReservee ? '#fff' : estSelectionnee ? '#fff' : '#fff';
    var cursor = estReservee ? 'not-allowed' : 'pointer';
    return `
      <button data-place="${label}" style="width:44px;height:44px;border-radius:8px;border:1px solid #333;background:${bg};color:${color};font-size:11px;font-weight:700;cursor:${cursor};">${label}</button>
    `;
  }

  // Format exact landing:
  // Conducteur 1A 1B
  // 2A 2B | 2C 2D
  // 3A 3B | 3C 3D
  // 4A 4B | 4C 4D
  // 5A 5B | 5C 5D
  // 6A 6B | 6C 6D
  // 7A 7B | 7C

  // Rangée 1 : Conducteur + 1A 1B
  gridHtml += `
    <div style="display:flex;justify-content:center;gap:8px;margin-bottom:8px;">
      <span style="font-size:12px;color:#94A3B8;display:flex;align-items:center;">🧑‍✈️</span>
      ${boutonPlace('1A', placesReservees.indexOf('1A') !== -1, selectedPlaces.indexOf('1A') !== -1)}
      ${boutonPlace('1B', placesReservees.indexOf('1B') !== -1, selectedPlaces.indexOf('1B') !== -1)}
    </div>
  `;

  // Rangées 2 à 7
  var rangeesLabels = [
    ['2A', '2B', '2C', '2D'],
    ['3A', '3B', '3C', '3D'],
    ['4A', '4B', '4C', '4D'],
    ['5A', '5B', '5C', '5D'],
    ['6A', '6B', '6C', '6D'],
    ['7A', '7B', '7C', null],
  ];

  for (var r = 0; r < rangeesLabels.length; r++) {
    var gaucheHtml = '';
    var droiteHtml = '';

    rangeesLabels[r].forEach(function(label, index) {
      if (!label) return;
      var estRes = placesReservees.indexOf(label) !== -1;
      var estSel = selectedPlaces.indexOf(label) !== -1;
      var btn = boutonPlace(label, estRes, estSel);

      if (index < 2) {
        gaucheHtml += btn;
      } else {
        droiteHtml += btn;
      }
    });

    gridHtml += `
      <div style="display:flex;justify-content:center;gap:16px;margin-bottom:8px;">
        <div style="display:flex;gap:8px;">${gaucheHtml}</div>
        <span style="width:20px;"></span>
        <div style="display:flex;gap:8px;">${droiteHtml}</div>
      </div>
    `;
  }

  container.innerHTML = `
    <div style="background:#252540;border-radius:14px;padding:16px;border:1px solid #F59E0B;">
      <button onclick="chargerDeparts()" style="background:none;border:none;color:#94A3B8;font-size:12px;cursor:pointer;margin-bottom:12px;"><i data-lucide="arrow-left" style="font-size:18px;display:inline-block;vertical-align:middle;"></i> Retour aux départs</button>

      <h3 style="font-size:18px;font-weight:800;color:#F59E0B;margin-bottom:8px;text-align:center;">1. Choisissez vos places</h3>

      <div style="text-align:center;margin-bottom:16px;">
        <p style="font-size:12px;color:#94A3B8;margin-bottom:4px;">${depart.pointDepart} → ${depart.destination}</p>
        <p style="font-size:11px;color:#94A3B8;"><i data-lucide="calendar" style="font-size:18px;display:inline-block;vertical-align:middle;"></i> ${new Date(depart.date).toLocaleDateString('fr-FR')} à ${depart.heure || '--:--'}</p>
      </div>

      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:2px;margin-bottom:16px;">
        ${gridHtml}
      </div>

      <div style="display:flex;justify-content:center;gap:16px;font-size:11px;margin-bottom:16px;">
        <span style="color:#22C55E;">● ${placesDisponibles} disponible(s)</span>
        <span style="color:#EF4444;">● ${placesReservees.length} réservée(s)</span>
        <span style="color:#3B82F6;">● ${selectedPlaces.length} sélectionnée(s)</span>
        <span style="color:#EF4444;">● ${placesReservees.length} réservée(s)</span>
        <span style="color:#3B82F6;">● ${selectedPlaces.length} sélectionnée(s)</span>
      </div>

      <h3 style="font-size:16px;font-weight:800;color:#F59E0B;margin-bottom:12px;text-align:center;">2. Informations passagers</h3>

      <div id="passagersForm">
        ${selectedPlaces.length === 0 ? '<p style="text-align:center;color:#94A3B8;font-size:12px;">Sélectionnez des places ci-dessus</p>' : ''}
        ${selectedPlaces.map(function(place) {
          return `
            <div style="margin-bottom:8px;">
              <label style="font-size:11px;color:#94A3B8;display:block;margin-bottom:4px;">Place ${place} — Nom du passager</label>
              <input id="passager_${place}" data-place="${place}" placeholder="Nom du passager place ${place}" value="${escapeHtmlLocal(passagers[place])}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;">
            </div>
          `;
        }).join('')}
      </div>

      <div style="margin-bottom:8px;">
        <label style="font-size:11px;color:#94A3B8;display:block;margin-bottom:4px;">Votre téléphone</label>
        <input id="resTel" type="tel" placeholder="Téléphone" value="${escapeHtmlLocal(getPassengerInfo().phone)}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;">
      </div>

      <div style="margin-bottom:12px;">
        <label style="font-size:11px;color:#94A3B8;display:block;margin-bottom:4px;">Référence de paiement (optionnel)</label>
        <input id="resPaiementRef" placeholder="Référence paiement" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;">
      </div>

      <button onclick="confirmerReservation()" style="width:100%;padding:14px;background:#F59E0B;color:#1A1A2E;border:none;border-radius:8px;font-weight:700;cursor:pointer;"><i data-lucide="save" style="font-size:18px;display:inline-block;vertical-align:middle;"></i> Enregistrer la réservation (${selectedPlaces.length} place(s))</button>
    </div>
  `;

  // P7-E2-FIX : rattachement des clics sur les boutons de place
  // (délégation d'événements — les boutons sont générés dynamiquement)
  var placeButtons = container.querySelectorAll('button[data-place]');
  placeButtons.forEach(function(btn) {
    // Ignorer les places déjà réservées (cursor: not-allowed, pas d'action)
    if (btn.style.cursor === 'not-allowed') return;

    btn.addEventListener('click', function() {
      togglePlace(btn.dataset.place);
    });
  });

  // P7-E2-FIX : rattachement des inputs passagers
  var passagerInputs = container.querySelectorAll('input[data-place]');
  passagerInputs.forEach(function(input) {
    input.addEventListener('change', function() {
      passagers[input.dataset.place] = input.value;
    });
  });
}

function togglePlace(place) {
  if (selectedPlaces.indexOf(place) !== -1) {
    selectedPlaces = selectedPlaces.filter(function(p) { return p !== place; });
    delete passagers[place];
  } else {
    selectedPlaces.push(place);
    selectedPlaces.sort(function(a, b) { return Number(a) - Number(b); });
  }

  afficherFormulaireReservation(selectedDepart);
}

async function confirmerReservation() {
  if (!selectedDepart || selectedPlaces.length === 0) {
    alert('Veuillez sélectionner au moins une place');
    return;
  }

  var tel = document.getElementById('resTel').value.trim();
  if (!tel) { alert('Veuillez saisir votre téléphone'); return; }

  var paiementRef = document.getElementById('resPaiementRef').value.trim() || null;

  var passagersList = selectedPlaces.map(function(place) {
    var nom = passagers[place] || '';
    if (!nom.trim()) {
      nom = document.getElementById('passager_' + place) ? document.getElementById('passager_' + place).value.trim() : '';
    }
    return { passagerNom: nom.trim(), place: place };
  });

  var missing = passagersList.filter(function(p) { return !p.passagerNom; });
  if (missing.length > 0) {
    alert('Nom du passager requis pour la place ' + missing[0].place);
    return;
  }

  try {
    var result = await apiPost('/public/reservations/batch', {
      departId: selectedDepart.id,
      telephone: tel,
      paiementRef: paiementRef,
      passagers: passagersList
    });

    if (result && result.error === 'Places déjà réservées') {
      alert('Certaines places viennent d\u00eatre r\u00e9serv\u00e9es. Rechargement...');
      // Recharger les départs pour mettre à jour les places
      chargerDeparts();
      return;
    }

    if (result && (result.otpCode || result.reservationId || result.id)) {
      // Sauvegarder le téléphone
      setPassengerInfo({ name: passagersList[0].passagerNom, phone: tel });

      var otp = result.otpCode || '';

      // Sauvegarder le code OTP en mémoire locale
      if (otp) {
        localStorage.setItem('dagoos_mobile_last_otp', otp);
        localStorage.setItem('dagoos_mobile_last_code', otp);
      }

      alert('Réservation en attente !\n\nCode OTP : ' + (otp || 'N/A') + '\n\nConservez ce code pour gérer votre réservation.');
      selectedPlaces = [];
      passagers = {};
      chargerDeparts();
    } else {
      alert((result.error || 'Erreur de réservation'));
    }
  } catch(e) {
    alert('Erreur réseau');
  }
}

function afficherGestion() {
  var container = document.getElementById('gestionContainer');
  if (!container) return;

  if (container.innerHTML !== '') {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div style="background:#252540;border-radius:14px;padding:16px;border:1px solid #333;">
      <h3 style="font-size:16px;font-weight:800;color:#F59E0B;margin-bottom:12px;text-align:center;"><i data-lucide="clipboard-list" style="font-size:18px;display:inline-block;vertical-align:middle;"></i> Gérer ma réservation</h3>

      <input id="manageTel" placeholder="Téléphone" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
      <input id="manageNom" placeholder="Nom du passager" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
      <input id="manageOtp" placeholder="Code OTP" value="${localStorage.getItem('dagoos_mobile_last_otp') || ''}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:12px;">

      <button onclick="gererReservation()" style="width:100%;padding:14px;background:#F59E0B;color:#1A1A2E;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Vérifier</button>

      <div id="manageResult" style="margin-top:12px;"></div>
    </div>
  `;
}

async function gererReservation() {
  var tel = document.getElementById('manageTel').value.trim();
  var nom = document.getElementById('manageNom').value.trim();
  var otp = document.getElementById('manageOtp').value.trim();
  var resultContainer = document.getElementById('manageResult');

  if (!tel || !nom) {
    alert('Téléphone et nom requis');
    return;
  }

  try {
    var result = await apiPost('/public/reservations/manage', {
      telephone: tel,
      passagerNom: nom,
      otpCode: otp
    });

    if (result && result.reservations) {
      var html = '<h4 style="font-size:14px;font-weight:700;color:#F59E0B;margin-bottom:8px;">Vos réservations</h4>';
      result.reservations.forEach(function(r) {
        html += `
          <div style="background:#1A1A2E;border-radius:8px;padding:12px;margin-bottom:8px;border:1px solid #333;">
            <p style="font-size:13px;font-weight:600;color:#fff;margin-bottom:4px;">${r.depart?.pointDepart || ''} → ${r.depart?.destination || ''}</p>
            <p style="font-size:11px;color:#94A3B8;margin-bottom:4px;"><i data-lucide="calendar" style="font-size:18px;display:inline-block;vertical-align:middle;"></i> ${r.depart ? new Date(r.depart.date).toLocaleDateString('fr-FR') : ''} à ${r.depart?.heure || '--:--'}</p>
            <p style="font-size:11px;color:#94A3B8;margin-bottom:4px;"><i data-lucide="armchair" style="font-size:18px;display:inline-block;vertical-align:middle;"></i> Place : ${r.place || '-'}</p>
            <p style="font-size:11px;color:#94A3B8;">Statut : ${r.statut || '-'}</p>
          </div>
        `;
      });
      resultContainer.innerHTML = html;
    } else if (result && result.error) {
      resultContainer.innerHTML = '';
      var errP = document.createElement('p');
      errP.style.cssText = 'text-align:center;color:#EF4444;font-size:12px;';
      errP.textContent = result.error || 'Erreur';
      resultContainer.appendChild(errP);
    } else {
      resultContainer.innerHTML = '<p style="text-align:center;color:#94A3B8;font-size:12px;">Aucune réservation trouvée</p>';
    }
  } catch(e) {
    resultContainer.innerHTML = '<p style="text-align:center;color:#EF4444;font-size:12px;">Erreur réseau</p>';
  }
}

window.init_reservations = init_reservations;
window.chargerDeparts = chargerDeparts;
window.selectionnerDepart = selectionnerDepart;
window.togglePlace = togglePlace;
window.confirmerReservation = confirmerReservation;
window.afficherGestion = afficherGestion;
window.gererReservation = gererReservation;
