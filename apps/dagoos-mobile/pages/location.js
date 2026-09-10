// ============================================
// LOCATION.JS — Urbain + Inter-urbain + Long_haul
// ============================================

var locationEstimation = null;
var modeLocation = 'urbain';

function init_location() {
  var info = getPassengerInfo();

  var app = document.getElementById('app');
  app.innerHTML = `
    <div style="background:#252540;padding:16px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:50;border-bottom:1px solid rgba(245,158,11,0.2);">
      <span style="font-size:24px;"><i data-lucide="bus" style="font-size:24px;"></i></span>
      <div style="font-size:16px;font-weight:800;color:#F59E0B;">Location de véhicules</div>
    </div>
    <div style="padding:16px;">
      <p id="locSubtitle" style="text-align:center;color:#94A3B8;font-size:12px;margin-bottom:12px;">Location de véhicules en ville</p>

      <div style="display:flex;gap:8px;margin-bottom:16px;justify-content:center;">
        <button id="btnUrbain" onclick="setModeLocation('urbain')" style="padding:8px 12px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid #F59E0B;background:#F59E0B;color:#1A1A2E;cursor:pointer;">Urbain</button>
        <button id="btnLongHaul" onclick="setModeLocation('long_haul')" style="padding:8px 12px;border-radius:20px;font-size:11px;font-weight:600;border:1px solid #F59E0B;background:#252540;color:#F59E0B;cursor:pointer;">Inter-urbain</button>
      </div>

      <div style="background:#252540;border-radius:14px;padding:16px;margin-bottom:12px;">
        <input id="locNom" placeholder="Votre nom" value="${info.name || ''}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
        <input id="locTel" placeholder="Votre téléphone" value="${info.phone || ''}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">

        <div id="serviceContainer" style="margin-bottom:8px;"></div>
        <div id="vehiculeContainer" style="margin-bottom:8px;"></div>

        <select id="locFlotte" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
          <option value="">-- Choisir une organisation --</option>
        </select>

        <select id="locTrajet" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
          <option value="A_B">A → B (aller simple)</option>
          <option value="A_B_A">A → B → A (aller-retour même jour)</option>
          <option value="A_B_A_MULTI">A → B → A (multi-jours)</option>
        </select>

        <input id="locDepart" placeholder="Adresse de départ" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;" onchange="estimerLocationMobile()">
        <input id="locArrivee" placeholder="Adresse d'arrivée" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;" onchange="estimerLocationMobile()">

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
          <div>
            <label style="font-size:10px;color:#94A3B8;display:block;margin-bottom:4px;">Date aller</label>
            <input id="locDateAller" type="date" style="width:100%;padding:10px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;" onchange="estimerLocationMobile()">
          </div>
          <div>
            <label style="font-size:10px;color:#94A3B8;display:block;margin-bottom:4px;">Heure départ</label>
            <input id="locHeureDepart" type="time" value="08:00" style="width:100%;padding:10px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;">
          </div>
        </div>

        <div id="retourContainer" style="display:none;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
          <div>
            <label style="font-size:10px;color:#94A3B8;display:block;margin-bottom:4px;">Date retour</label>
            <input id="locDateRetour" type="date" style="width:100%;padding:10px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;" onchange="estimerLocationMobile()">
          </div>
          <div>
            <label style="font-size:10px;color:#94A3B8;display:block;margin-bottom:4px;">Heure retour</label>
            <input id="locHeureRetour" type="time" value="18:00" style="width:100%;padding:10px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;">
          </div>
        </div>

        <select id="locCarburant" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;" onchange="estimerLocationMobile()">
          <option value="AVEC">Avec carburant</option>
          <option value="SANS">Sans carburant</option>
        </select>

        <div id="descriptionContainer" style="display:none;margin-bottom:12px;">
          <label style="font-size:10px;color:#94A3B8;display:block;margin-bottom:4px;">📦 Description de la marchandise</label>
          <textarea id="locDescription" placeholder="Décrivez votre marchandise (nature, quantité, poids approximatif, particularités...)" rows="3" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;resize:vertical;font-family:inherit;font-size:13px;"></textarea>
        </div>

        <div id="photosContainer" style="display:none;margin-bottom:12px;">
          <label style="font-size:10px;color:#94A3B8;display:block;margin-bottom:4px;">📸 Photos (optionnel, max 5)</label>
          <input id="locPhotos" type="file" accept="image/*" multiple style="width:100%;padding:10px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;font-size:11px;">
          <div id="photosPreview" style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;"></div>
          <p id="photosStatus" style="font-size:10px;color:#94A3B8;margin-top:6px;"></p>
        </div>

        <div id="passagersContainer" style="display:none;margin-bottom:12px;">
          <input id="locNbPassagers" type="number" placeholder="Nombre de passagers" min="1" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;">
        </div>

        <div id="locEstimationResult" style="margin-bottom:12px;"></div>

        <button onclick="demanderLocationMobile()" style="width:100%;padding:14px;background:#F59E0B;color:#1A1A2E;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Envoyer la demande</button>
      </div>
    </div>
  `;

  chargerOrganisations();

  // Init photos listeners (Etape 2)
  setTimeout(initPhotosListeners, 100);
}

function setModeLocation(nouveauMode) {
  modeLocation = nouveauMode;
  var btnUrbain = document.getElementById('btnUrbain');
  var btnLongHaul = document.getElementById('btnLongHaul');
  var subtitle = document.getElementById('locSubtitle');
  var retourContainer = document.getElementById('retourContainer');
  var passagersContainer = document.getElementById('passagersContainer');
  var trajetSelect = document.getElementById('locTrajet');

  [btnUrbain, btnLongHaul].forEach(function(btn) {
    if (btn) {
      btn.style.background = '#252540';
      btn.style.color = '#F59E0B';
    }
  });

  var btnActif = modeLocation === 'urbain' ? btnUrbain : btnLongHaul;
  if (btnActif) {
    btnActif.style.background = '#F59E0B';
    btnActif.style.color = '#1A1A2E';
  }

  // Mettre à jour le sous-titre
  if (subtitle) {
    subtitle.textContent = modeLocation === 'urbain'
      ? 'Location de véhicules en ville'
      : 'Transport longue distance inter-urbain';
  }

  // Afficher/masquer les champs selon le mode
  if (retourContainer) {
    retourContainer.style.display = modeLocation === 'urbain' ? 'none' : 'grid';
  }
  if (passagersContainer) {
    passagersContainer.style.display = modeLocation === 'urbain' ? 'none' : 'block';
  }

  // Ajuster les options de trajet
  if (trajetSelect) {
    if (modeLocation === 'urbain') {
      trajetSelect.innerHTML = '<option value="A_B">A → B (aller simple)</option>';
    } else {
      trajetSelect.innerHTML = `
        <option value="A_B">A → B (aller simple)</option>
        <option value="A_B_A">A → B → A (aller-retour même jour)</option>
        <option value="A_B_A_MULTI">A → B → A (multi-jours)</option>
      `;
    }
  }

  chargerOrganisations();
}

function chargerOrganisations() {
  apiGet('/public/organizations').then(function(orgs) {
    var select = document.getElementById('locFlotte');
    if (select && Array.isArray(orgs)) {
      var typeFiltre = modeLocation === 'urbain' ? 'FLEET_MANAGER' : 'COOPERATIVE';
      var orgsFiltrees = orgs.filter(function(o) { return o.type === typeFiltre; });

      select.innerHTML = '<option value="">-- Choisir une organisation --</option>';
      orgsFiltrees.forEach(function(f) {
        var opt = document.createElement('option');
        opt.value = f.slug;
        opt.textContent = f.name;
        select.appendChild(opt);
      });
      if (orgsFiltrees.length === 1) select.value = orgsFiltrees[0].slug;
    }
    updateUI();
  }).catch(function() {});
}

function updateUI() {
  var serviceContainer = document.getElementById('serviceContainer');
  var vehiculeContainer = document.getElementById('vehiculeContainer');

  if (modeLocation === 'long_haul') {
    serviceContainer.innerHTML = `
      <label style="font-size:10px;color:#94A3B8;display:block;margin-bottom:4px;">👥 Type de service</label>
      <select id="locTypeService" onchange="updateVehiculeOptions()" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
        <option value="passagers">Transport passagers</option>
        <option value="marchandises">Marchandises</option>
        <option value="demenagement">Déménagement</option>
        <option value="depannage">Dépannage</option>
        <option value="fret">Fret lourd</option>
      </select>
    `;

    updateVehiculeOptions();
  } else {
    serviceContainer.innerHTML = '';
    vehiculeContainer.innerHTML = `
      <select id="locType" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">
        <option value="moto">Moto</option>
        <option value="voiture">Voiture</option>
        <option value="bus">Bus</option>
        <option value="minivan">Mini Van</option>
        <option value="tricycle">Tricycle</option>
      </select>
    `;
  }
}

function updateVehiculeOptions() {
  var vehiculeContainer = document.getElementById('vehiculeContainer');
  var passagersContainer = document.getElementById('passagersContainer');
  var descriptionContainer = document.getElementById('descriptionContainer');

  var service = document.getElementById('locTypeService') ? document.getElementById('locTypeService').value : 'passagers';

  // Afficher/masquer les champs selon le service
  if (passagersContainer) {
    passagersContainer.style.display = service === 'passagers' ? 'block' : 'none';
  }

  // Description pour marchandises, déménagement, dépannage, fret
  var servicesAvecDescription = ['marchandises', 'demenagement', 'depannage', 'fret'];
  if (descriptionContainer) {
    descriptionContainer.style.display = servicesAvecDescription.includes(service) ? 'block' : 'none';
  }

  // Photos pour les mêmes services
  var photosContainer = document.getElementById('photosContainer');
  if (photosContainer) {
    photosContainer.style.display = servicesAvecDescription.includes(service) ? 'block' : 'none';
  }

  // Réinitialiser les photos si on change de service
  if (photosContainer && photosContainer.style.display === 'none') {
    var photoInput = document.getElementById('locPhotos');
    var preview = document.getElementById('photosPreview');
    if (photoInput) photoInput.value = '';
    if (preview) preview.innerHTML = '';
    window._photosSelectionnees = [];
  }

  if (!vehiculeContainer) return;

  var vehiclesByService = {
    'passagers': [
      { value: 'bus', label: 'Bus' },
      { value: 'minivan', label: 'Mini Van' }
    ],
    'marchandises': [
      { value: 'fourgon', label: 'Fourgon' },
      { value: 'camion', label: 'Camion' },
      { value: 'camion_frigo', label: 'Camion frigorifique' },
      { value: 'semi_remorque', label: 'Semi-remorque' }
    ],
    'demenagement': [
      { value: 'fourgon', label: 'Fourgon' },
      { value: 'camion', label: 'Camion' }
    ],
    'depannage': [
      { value: 'depanneuse', label: 'Dépanneuse' }
    ],
    'fret': [
      { value: 'camion', label: 'Camion' },
      { value: 'semi_remorque', label: 'Semi-remorque' }
    ]
  };

  var vehicles = vehiclesByService[service] || vehiclesByService['passagers'];

  var options = '';
  for (var i = 0; i < vehicles.length; i++) {
    options += '<option value="' + vehicles[i].value + '">' + vehicles[i].label + '</option>';
  }

  vehiculeContainer.innerHTML = '<label style="font-size:10px;color:#94A3B8;display:block;margin-bottom:4px;">🚌 Véhicule compatible</label><select id="locType" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:8px;">' + options + '</select>';
}

async function estimerLocationMobile() {
  var depart = document.getElementById('locDepart').value;
  var arrivee = document.getElementById('locArrivee').value;
  var typeVehicule = document.getElementById('locType') ? document.getElementById('locType').value : 'bus';
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
    var typeService = document.getElementById('locTypeService')
      ? document.getElementById('locTypeService').value
      : null;

    var nbPassagers = document.getElementById('locNbPassagers')
      ? document.getElementById('locNbPassagers').value
      : null;

    var description = document.getElementById('locDescription')
      ? document.getElementById('locDescription').value.trim()
      : null;

    var result = await apiPost('/public/estimate-location', {
      organizationSlug: flotte,
      type: modeLocation === 'long_haul' ? 'LONG_HAUL' : 'CAR_RENTAL',
      typeVehicule: typeVehicule,
      typeTrajet: typeTrajet,
      typeService: typeService,
      nbPassagers: typeService === 'passagers'
        ? (Number(nbPassagers) || 1)
        : undefined,
      description: description || undefined,
      depart: depart,
      arrivee: arrivee,
      dateAller: dateAller || null,
      dateRetour: dateRetour || null,
      carburant: carburant
    });

    locationEstimation = result;

    if (!result || !container) return;

    // Cas 1 : Estimation calculée (PER_KM, FIXED, BAREME, PER_DAY)
    if (result.status === 'ESTIMATED' && result.price) {
      container.innerHTML = `
        <div style="background:#1E293B;border-radius:12px;padding:16px;border:1px solid #F59E0B;">
          <p style="text-align:center;color:#F59E0B;font-size:13px;font-weight:600;">Estimation</p>
          <div style="font-size:11px;color:#94A3B8;">Distance</div>
          <div style="font-size:22px;font-weight:800;color:#F59E0B;">${result.distanceKm} km</div>
          ${result.nbJours > 1 ? '<div style="font-size:11px;color:#94A3B8;margin-top:6px;">Nombre de jours</div><div style="font-weight:600;">' + result.nbJours + ' jours</div>' : ''}
          <div style="font-size:11px;color:#94A3B8;margin-top:8px;">Prix estimé</div>
          <div style="font-size:26px;font-weight:800;color:#F59E0B;">${Number(result.price).toLocaleString('fr-FR')} Ar</div>
          ${result.details && result.details.pricingMethod ? '<p style="text-align:center;color:#94A3B8;font-size:10px;margin-top:8px;">Tarif ' + result.details.pricingMethod + '</p>' : ''}
        </div>
      `;
    }
    // Cas 2 : Négociation requise (NEGOTIATED)
    else if (result.status === 'NEGOTIATION_REQUIRED') {
      container.innerHTML = `
        <div style="background:#1E293B;border-radius:12px;padding:16px;border:1px solid #3B82F6;">
          <p style="text-align:center;color:#3B82F6;font-size:13px;font-weight:600;">💬 Prix à négocier</p>
          <div style="font-size:11px;color:#94A3B8;">Distance</div>
          <div style="font-size:22px;font-weight:800;color:#3B82F6;">${result.distanceKm} km</div>
          <div style="font-size:12px;color:#CBD5E1;margin-top:12px;line-height:1.5;text-align:center;">
            Le transporteur va vous contacter avec un prix personnalisé pour ce service.
          </div>
          <p style="text-align:center;color:#94A3B8;font-size:10px;margin-top:8px;">Service : ${result.typeService || result.pricingModel}</p>
        </div>
      `;
    }
    // Cas fallback (ancienne API)
    else if (result.prixEstime) {
      container.innerHTML = `
        <div style="background:#1E293B;border-radius:12px;padding:16px;border:1px solid #F59E0B;">
          <p style="text-align:center;color:#F59E0B;font-size:13px;font-weight:600;">Estimation</p>
          <div style="font-size:11px;color:#94A3B8;">Distance</div>
          <div style="font-size:22px;font-weight:800;color:#F59E0B;">${result.distanceKm} km</div>
          <div style="font-size:11px;color:#94A3B8;margin-top:8px;">Prix</div>
          <div style="font-size:26px;font-weight:800;color:#F59E0B;">${Number(result.prixEstime).toLocaleString('fr-FR')} Ar</div>
        </div>
      `;
    }
  } catch(e) {
    if (container) container.innerHTML = '';
  }
}

// ============================================================
// UTILITAIRES PHOTOS - Étape 2 (Cloudinary)
// ============================================================

var MAX_PHOTOS = 5;
var MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
var COMPRESSION_MAX_WIDTH = 1920;
var COMPRESSION_QUALITY = 0.8;

var servicesAvecPhotos = ['marchandises', 'demenagement', 'depannage', 'fret'];

window._photosSelectionnees = [];

// ------------------------------------------------------------
// Compresse une image via Canvas
// ------------------------------------------------------------
function compresserImage(file) {
  return new Promise(function(resolve, reject) {
    var reader = new FileReader();

    reader.onload = function(e) {
      var img = new Image();

      img.onload = function() {
        var canvas = document.createElement('canvas');
        var width = img.width;
        var height = img.height;

        // Redimensionner si trop large
        if (width > COMPRESSION_MAX_WIDTH) {
          height = Math.round((height * COMPRESSION_MAX_WIDTH) / width);
          width = COMPRESSION_MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir en JPEG compressé
        var dataUri = canvas.toDataURL('image/jpeg', COMPRESSION_QUALITY);

        console.log('[PHOTO] Compression:',
          Math.round(file.size / 1024) + ' KB → ' +
          Math.round(dataUri.length * 0.75 / 1024) + ' KB (estimé)');

        resolve(dataUri);
      };

      img.onerror = function() {
        reject(new Error('Impossible de charger l\'image'));
      };

      img.src = e.target.result;
    };

    reader.onerror = function() {
      reject(new Error('Impossible de lire le fichier'));
    };

    reader.readAsDataURL(file);
  });
}

// ------------------------------------------------------------
// Upload une photo vers Cloudinary
// ------------------------------------------------------------
async function uploadPhoto(file, typeService) {
  try {
    // 1. Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Photo trop volumineuse (max 5 MB)');
    }

    // 2. Vérifier le format
    var type = file.type.toLowerCase();
    var formatsOk = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!formatsOk.includes(type)) {
      throw new Error('Format non supporté: ' + type);
    }

    // 3. Compresser
    var dataUri = await compresserImage(file);

    // 4. Upload vers Cloudinary
    var result = await apiPost('/public/upload-photo', {
      image: dataUri,
      typeService: typeService
    });

    if (result && result.success && result.url) {
      console.log('[PHOTO] ✅ Uploadée:', result.url);
      return result.url;
    }

    throw new Error(result.error || 'Upload échoué');

  } catch(e) {
    console.error('[PHOTO] ❌ Erreur:', e.message);
    throw e;
  }
}

// ------------------------------------------------------------
// Affiche les miniatures des photos sélectionnées
// ------------------------------------------------------------
function afficherPhotosPreview(files) {
  var preview = document.getElementById('photosPreview');
  var status = document.getElementById('photosStatus');

  if (!preview) return;

  preview.innerHTML = '';

  if (!files || files.length === 0) {
    if (status) status.textContent = '';
    return;
  }

  var count = Math.min(files.length, MAX_PHOTOS);

  for (var i = 0; i < count; i++) {
    var file = files[i];

    (function(index, f) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var container = document.createElement('div');
        container.style.cssText = 'position:relative;width:60px;height:60px;border-radius:6px;overflow:hidden;border:1px solid #444;';

        var img = document.createElement('img');
        img.src = e.target.result;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;';

        var btn = document.createElement('button');
        btn.innerHTML = '×';
        btn.style.cssText = 'position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:#EF4444;color:#fff;border:none;font-size:14px;line-height:1;cursor:pointer;padding:0;';
        btn.onclick = function() { supprimerPhoto(index); };

        container.appendChild(img);
        container.appendChild(btn);
        preview.appendChild(container);
      };
      reader.readAsDataURL(f);
    })(i, file);
  }

  if (status) {
    status.textContent = count + ' photo' + (count > 1 ? 's' : '') + ' sélectionnée' + (count > 1 ? 's' : '');
  }
}

// ------------------------------------------------------------
// Supprime une photo de la sélection
// ------------------------------------------------------------
function supprimerPhoto(index) {
  var input = document.getElementById('locPhotos');
  if (!input || !input.files) return;

  // Créer un nouveau FileList sans la photo index
  var dt = new DataTransfer();
  var files = input.files;

  for (var i = 0; i < files.length; i++) {
    if (i !== index) {
      dt.items.add(files[i]);
    }
  }

  input.files = dt.files;
  afficherPhotosPreview(dt.files);
}

// ------------------------------------------------------------
// Gère la sélection de photos par l'utilisateur
// ------------------------------------------------------------
function onPhotosSelected(event) {
  var files = event.target.files;

  if (files.length > MAX_PHOTOS) {
    alert('Maximum ' + MAX_PHOTOS + ' photos. Seules les ' + MAX_PHOTOS + ' premières seront prises.');

    // Tronquer à MAX_PHOTOS
    var dt = new DataTransfer();
    for (var i = 0; i < MAX_PHOTOS; i++) {
      dt.items.add(files[i]);
    }
    event.target.files = dt.files;
    files = dt.files;
  }

  afficherPhotosPreview(files);
}

// ------------------------------------------------------------
// Upload toutes les photos sélectionnées
// ------------------------------------------------------------
async function uploaderToutesLesPhotos(typeService) {
  var input = document.getElementById('locPhotos');

  if (!input || !input.files || input.files.length === 0) {
    return [];
  }

  if (!servicesAvecPhotos.includes(typeService)) {
    return [];
  }

  var status = document.getElementById('photosStatus');
  var files = Array.from(input.files).slice(0, MAX_PHOTOS);
  var urls = [];

  for (var i = 0; i < files.length; i++) {
    if (status) {
      status.textContent = 'Upload photo ' + (i + 1) + '/' + files.length + '...';
    }

    try {
      var url = await uploadPhoto(files[i], typeService);
      urls.push(url);
    } catch(e) {
      alert('Erreur upload photo ' + (i + 1) + ': ' + e.message);
      throw e;
    }
  }

  if (status) {
    status.textContent = '✅ ' + urls.length + ' photo' + (urls.length > 1 ? 's' : '') + ' uploadée' + (urls.length > 1 ? 's' : '');
  }

  return urls;
}

// ------------------------------------------------------------
// Initialise les événements photos (appelé après render)
// ------------------------------------------------------------
function initPhotosListeners() {
  var input = document.getElementById('locPhotos');
  if (input && !input._photosInit) {
    input.addEventListener('change', onPhotosSelected);
    input._photosInit = true;
    console.log('[PHOTO] Listeners initialisés');
  }
}

async function demanderLocationMobile() {
  var nom = document.getElementById('locNom').value.trim();
  var tel = document.getElementById('locTel').value.trim();
  var depart = document.getElementById('locDepart').value;
  var arrivee = document.getElementById('locArrivee').value;
  var typeVehicule = document.getElementById('locType') ? document.getElementById('locType').value : 'bus';
  var typeTrajet = document.getElementById('locTrajet').value;
  var dateAller = document.getElementById('locDateAller').value;
  var dateRetour = document.getElementById('locDateRetour').value;
  var heureDepart = document.getElementById('locHeureDepart').value;
  var heureRetour = document.getElementById('locHeureRetour').value;
  var carburant = document.getElementById('locCarburant').value;
  var nbPassagers = document.getElementById('locNbPassagers').value;
  var description = document.getElementById('locDescription') ? document.getElementById('locDescription').value.trim() : null;
  var flotte = document.getElementById('locFlotte').value;
  var typeService = document.getElementById('locTypeService') ? document.getElementById('locTypeService').value : null;

  if (!nom || !tel) { alert('Remplissez votre nom et téléphone'); return; }
  if (!flotte) { alert('Choisissez une organisation'); return; }
  if (!depart || !arrivee) { alert('Remplissez départ et arrivée'); return; }

  setPassengerInfo({ name: nom, phone: tel });

  // Upload des photos avant l'envoi (Etape 2)
  var photosUrls = [];
  if (typeService && servicesAvecPhotos && servicesAvecPhotos.includes(typeService)) {
    try {
      photosUrls = await uploaderToutesLesPhotos(typeService);
    } catch(e) {
      alert('Erreur lors de l\'upload des photos: ' + e.message);
      return;
    }
  }

  try {
    var result = await apiPost('/public/actions', {
      organizationSlug: flotte,
      type: modeLocation === 'long_haul' ? 'LONG_HAUL' : 'CAR_RENTAL',
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
        nbPassagers: typeService === 'passagers' ? (Number(nbPassagers) || 1) : undefined,
        description: description || undefined,
        photos: photosUrls.length > 0 ? photosUrls : undefined,
        ...(typeService && { typeService })
      }
    });

    if (result && (result.codeSuivi || result.actionId)) {
      var code = result.codeSuivi || result.actionId;
      localStorage.setItem('dagoos_mobile_last_code', code);
      alert('Demande envoyée !\n\nCode de suivi : ' + code);
      loadPage('suivi');
    } else {
      alert(result.error || 'Erreur lors de la demande');
    }
  } catch(e) {
    alert('Erreur réseau');
  }
}

window.init_location = init_location;
window.compresserImage = compresserImage;
window.uploadPhoto = uploadPhoto;
window.supprimerPhoto = supprimerPhoto;
window.initPhotosListeners = initPhotosListeners;
window.setModeLocation = setModeLocation;
window.estimerLocationMobile = estimerLocationMobile;
window.demanderLocationMobile = demanderLocationMobile;
window.chargerOrganisations = chargerOrganisations;
