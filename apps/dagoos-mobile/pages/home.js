function init_home() {
  var app = document.getElementById('app');

  app.innerHTML = `
    <div style="background:var(--bg-surface);padding:16px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:50;">
      <div>
        <img src="/icons/dagoos-logo.png" style="width:36px;height:36px;object-fit:contain;border-radius:8px;" alt="DAGOO'S">
        <div style="font-size:16px;font-weight:800;color:var(--accent);">DAGOO'S</div>
        <div style="font-size:10px;color:var(--text-secondary);">Chez les potes, ça roule.</div>
      </div>
    </div>

    <div style="padding:16px;">
      <h2 style="font-size:18px;font-weight:800;margin-bottom:12px;">Choisissez un service</h2>

      <!-- NOS PARTENAIRES - CARROUSEL 3D -->
      <div style="margin-bottom:24px;overflow:hidden;position:relative;">
        <div style="text-align:center;margin-bottom:12px;">
          <div style="font-size:9px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">
            ⭐ Nos partenaires
          </div>
          <p style="font-size:10px;color:var(--text-secondary);line-height:1.4;">
            Des flottes et coopératives qui utilisent DAGOO'S
          </p>
        </div>

        <!-- RECHERCHE D'ORGANISATION -->
        <div
          id="recherchePartenaire"
          style="
            margin:0 auto 16px;
            max-width:420px;
            position:relative;
          "
        >
          <div
            style="
              position:relative;
              display:flex;
              align-items:center;
              background:var(--bg-soft);
              border:1px solid rgba(255,255,255,.10);
              border-radius:14px;
              min-height:46px;
              box-sizing:border-box;
              box-shadow:0 6px 18px rgba(0,0,0,.12);
            "
          >
            <span
              aria-hidden="true"
              style="
                width:42px;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:17px;
                color:var(--text-secondary);
                flex-shrink:0;
              "
            >⌕</span>

            <input
              id="partenaireRechercheInput"
              type="search"
              autocomplete="off"
              autocapitalize="none"
              spellcheck="false"
              placeholder="Rechercher une organisation..."
              aria-label="Rechercher une organisation"
              style="
                flex:1;
                min-width:0;
                height:44px;
                border:0;
                outline:none;
                background:transparent;
                color:var(--text-primary);
                font-size:13px;
                font-family:inherit;
                padding:0 4px;
                -webkit-appearance:none;
              "
            >

            <button
              id="partenaireRechercheClear"
              type="button"
              aria-label="Effacer la recherche"
              style="
                display:none;
                width:34px;
                height:34px;
                margin-right:6px;
                border:0;
                border-radius:50%;
                background:rgba(255,255,255,.08);
                color:var(--text-muted);
                font-size:18px;
                line-height:1;
                cursor:pointer;
                flex-shrink:0;
              "
            >×</button>
          </div>

          <div
            id="partenaireRechercheResultats"
            style="
              display:none;
              margin-top:8px;
              background:var(--bg-surface);
              border:1px solid rgba(255,255,255,.08);
              border-radius:14px;
              overflow:hidden;
              box-shadow:0 12px 30px rgba(0,0,0,.28);
              text-align:left;
              position:relative;
              z-index:40;
            "
          ></div>
        </div>

        <div
          id="partenairesScene"
          style="
            position:relative;
            height:260px;
            display:flex;
            align-items:center;
            justify-content:center;
            overflow:hidden;
            perspective:1200px;
            touch-action:pan-y;
          "
        >
          <button
            id="partenairePrev"
            type="button"
            aria-label="Partenaire précédent"
            style="
              position:absolute;
              left:4px;
              top:50%;
              transform:translateY(-50%);
              z-index:30;
              width:36px;
              height:36px;
              border-radius:50%;
              border:1px solid rgba(255,255,255,.15);
              background:rgba(255,255,255,.08);
              color:var(--text-primary);
              font-size:22px;
              display:flex;
              align-items:center;
              justify-content:center;
              cursor:pointer;
            "
          >‹</button>

          <div
            id="partenaires3D"
            style="
              position:relative;
              width:100%;
              height:220px;
              transform-style:preserve-3d;
            "
          >
            <div style="
              text-align:center;
              padding-top:80px;
              color:var(--text-secondary);
              font-size:11px;
            ">
              Chargement...
            </div>
          </div>

          <button
            id="partenaireNext"
            type="button"
            aria-label="Partenaire suivant"
            style="
              position:absolute;
              right:4px;
              top:50%;
              transform:translateY(-50%);
              z-index:30;
              width:36px;
              height:36px;
              border-radius:50%;
              border:1px solid rgba(255,255,255,.15);
              background:rgba(255,255,255,.08);
              color:var(--text-primary);
              font-size:22px;
              display:flex;
              align-items:center;
              justify-content:center;
              cursor:pointer;
            "
          >›</button>
        </div>

        <div style="text-align:center;margin-top:4px;">
          <span id="partenairesCompteur" style="font-size:11px;color:var(--text-secondary);font-weight:600;"></span>
        </div>
      </div>

      <!-- Taxi Urbain -->
      <div onclick="loadPage('course')" style="background:var(--bg-surface);border-radius:14px;padding:16px;margin-bottom:10px;cursor:pointer;display:flex;align-items:center;gap:14px;border:1px solid rgba(16,185,129,0.2);">
        <i data-lucide="car" style="font-size:22px;"></i>
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:700;color:var(--text-primary);">Demandez un taxi</div>
          <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">Taxi ou moto à proximité, suivi en direct</div>
          <div style="display:flex;gap:8px;margin-top:6px;">
            <span style="font-size:9px;background:rgba(16,185,129,0.15);color:var(--accent);padding:3px 8px;border-radius:20px;">Géolocalisation</span>
            <span style="font-size:9px;background:rgba(16,185,129,0.15);color:var(--accent);padding:3px 8px;border-radius:20px;">Rapide</span>
          </div>
        </div>
        <span style="color:var(--accent);font-size:20px;">→</span>
      </div>

      <!-- Départs Inter-urbains -->
      <div onclick="loadPage('reservations')" style="background:var(--bg-surface);border-radius:14px;padding:16px;margin-bottom:10px;cursor:pointer;display:flex;align-items:center;gap:14px;border:1px solid rgba(16,185,129,0.2);">
        <i data-lucide="bus" style="font-size:22px;"></i>
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:700;color:var(--text-primary);">Départs inter-urbains</div>
          <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">Consultez les départs et réservez votre place</div>
          <div style="display:flex;gap:8px;margin-top:6px;">
            <span style="font-size:9px;background:rgba(16,185,129,0.15);color:var(--accent);padding:3px 8px;border-radius:20px;">Réservation</span>
            <span style="font-size:9px;background:rgba(16,185,129,0.15);color:var(--accent);padding:3px 8px;border-radius:20px;">Confort</span>
          </div>
        </div>
        <span style="color:var(--accent);font-size:20px;">→</span>
      </div>

      <!-- Location Urbaine -->
      <div onclick="loadPage('location')" style="background:var(--bg-surface);border-radius:14px;padding:16px;margin-bottom:10px;cursor:pointer;display:flex;align-items:center;gap:14px;border:1px solid rgba(16,185,129,0.2);">
        <i data-lucide="bus" style="font-size:22px;"></i>
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:700;color:var(--text-primary);">Location urbaine</div>
          <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">Bus, minivan ou tricycle pour vos événements</div>
          <div style="display:flex;gap:8px;margin-top:6px;">
            <span style="font-size:9px;background:rgba(16,185,129,0.15);color:var(--accent);padding:3px 8px;border-radius:20px;">Avec chauffeur</span>
            <span style="font-size:9px;background:rgba(16,185,129,0.15);color:var(--accent);padding:3px 8px;border-radius:20px;">Flexible</span>
          </div>
        </div>
        <span style="color:var(--accent);font-size:20px;">→</span>
      </div>

      <!-- Location Inter-urbaine -->
      <div onclick="loadPage('location')" style="background:var(--bg-surface);border-radius:14px;padding:16px;margin-bottom:10px;cursor:pointer;display:flex;align-items:center;gap:14px;border:1px solid rgba(16,185,129,0.2);">
        <span style="font-size:32px;">🗺️</span>
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:700;color:var(--text-primary);">Location inter-urbaine</div>
          <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">Déplacements vers tout Madagascar</div>
          <div style="display:flex;gap:8px;margin-top:6px;">
            <span style="font-size:9px;background:rgba(16,185,129,0.15);color:var(--accent);padding:3px 8px;border-radius:20px;">Longue distance</span>
            <span style="font-size:9px;background:rgba(16,185,129,0.15);color:var(--accent);padding:3px 8px;border-radius:20px;">Multi-jours</span>
          </div>
        </div>
        <span style="color:var(--accent);font-size:20px;">→</span>
      </div>

      <!-- Suivi -->
      <div onclick="loadPage('suivi')" style="background:var(--bg-surface);border-radius:14px;padding:16px;cursor:pointer;display:flex;align-items:center;gap:14px;border:1px solid rgba(16,185,129,0.2);">
        <i data-lucide="clipboard-list" style="font-size:22px;"></i>
        <div style="flex:1;">
          <div style="font-size:15px;font-weight:700;color:var(--text-primary);">Suivre ma demande</div>
          <div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">Vérifiez le statut avec votre code de suivi</div>
        </div>
        <span style="color:var(--accent);font-size:20px;">→</span>
      </div>

    </div>
  `;

  // Le home général DAGOO'S ne réapplique pas le branding d'une flotte sélectionnée.

  // Appeler chargerPartenaires après un délai pour s'assurer que le DOM est prêt
  setTimeout(function() {
    chargerPartenaires();
  }, 100);
}


// ============================================
// SECTION NOS PARTENAIRES
// ============================================

var partenairesData = [];
var partenaireIndex = 0;
var partenaireTimer = null;
var partenaireTouchStartX = null;
var partenaireTouchStartY = null;


// ============================================================
// Chargement des partenaires
// ============================================================

async function chargerPartenaires() {
  var orgs = await apiGetSafe('/public/organizations', null);

  if (orgs === null) {
    afficherErreurPartenaires(
      'Impossible de charger les partenaires'
    );
    return;
  }

  if (!Array.isArray(orgs) || orgs.length === 0) {
    afficherErreurPartenaires('Aucun partenaire disponible');
    return;
  }

  // Premium en premier, puis Standard, Basic et Freemium.
  var prioritePlan = {
    'Premium': 0,
    'Standard': 1,
    'Basic': 2,
    'Freemium': 3
  };

  // Filtrer : uniquement les organisations avec au moins 1 service actif
  var orgsAvecServices = orgs.filter(function(org) {
    return Array.isArray(org.organizationServices) &&
           org.organizationServices.length > 0;
  });

  partenairesData = orgsAvecServices.slice().sort(function(a, b) {
    var pa = prioritePlan[a.plan] !== undefined
      ? prioritePlan[a.plan]
      : 99;

    var pb = prioritePlan[b.plan] !== undefined
      ? prioritePlan[b.plan]
      : 99;

    return pa - pb;
  });

  partenaireIndex = 0;

  // Nombre TOTAL réel d'organisations.
  var compteur = document.getElementById('partenairesCompteur');

  if (compteur) {
    compteur.textContent =
      partenairesData.length + ' organisations partenaires';
  }

  afficherPartenaires3D();
  initialiserRecherchePartenaires();
  installerControlesPartenaires();
  demarrerRotationPartenaires();
}


// ============================================================
// Affichage des 5 cartes visibles
// Positions : -2, -1, 0, +1, +2
// ============================================================

// P7-E2-FIX : afficherPartenaires3D refondu en DOM.
// Plus aucun innerHTML avec interpolation, plus de onclick inline.
function afficherPartenaires3D() {
  var scene = document.getElementById('partenaires3D');
  if (!scene || !partenairesData.length) return;

  var positions = [-2, -1, 0, 1, 2];

  scene.innerHTML = '';

  positions.forEach(function(position) {
    var index = (partenaireIndex + position + partenairesData.length) % partenairesData.length;
    var org = partenairesData[index];

    var angle = position * 25;
    var translateX = position * 105;
    var translateZ = -Math.abs(position) * 150;
    var scale = position === 0 ? 1 : 0.75;
    var opacity = position === 0 ? 1 : 0.5;
    var zIndex = 5 - Math.abs(position);

    var typeLabel = org.type === 'FLEET_MANAGER' ? 'URBAIN' : 'INTERURBAIN';

    var serviceLabels = (org.organizationServices || []).map(function(s) {
      return s.service;
    }).join(' · ');

    var planLabel = (org.plan || 'Freemium').toUpperCase();

    var badgeStyle;
    if (org.plan === 'Premium') {
      badgeStyle = 'background:var(--accent);color:var(--bg-page);';
    } else if (org.plan === 'Standard') {
      badgeStyle = 'background:var(--info-fg);color:var(--text-on-accent);';
    } else {
      badgeStyle = 'background:var(--bg-surface);color:var(--text-secondary);';
    }

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.partenaireIndex = String(index);
    btn.setAttribute('aria-label', 'Voir ' + org.name);
    btn.style.cssText =
      'position:absolute;left:50%;top:50%;width:180px;min-height:190px;' +
      'margin-left:-90px;margin-top:-95px;padding:18px 14px;border-radius:20px;' +
      'border:1px solid rgba(255,255,255,.08);background:var(--bg-surface);color:var(--text-primary);' +
      'cursor:pointer;text-align:center;' +
      'transform:translateX(' + translateX + 'px) ' +
      'translateZ(' + translateZ + 'px) ' +
      'rotateY(' + (-angle) + 'deg) scale(' + scale + ');' +
      'transform-style:preserve-3d;' +
      'z-index:' + zIndex + ';' +
      'opacity:' + opacity + ';' +
      'filter:' + (position === 0 ? 'blur(0px)' : 'blur(1px)') + ';' +
      'transition:transform .7s ease,opacity .7s ease,filter .7s ease;' +
      'box-shadow:' + (position === 0
        ? '0 12px 30px rgba(0,0,0,.28)'
        : '0 6px 18px rgba(0,0,0,.15)') + ';';

    btn.addEventListener('click', function() {
      ouvrirPartenaire(org.slug);
    });

    // Logo
    if (org.logo && window.isValidImageUrl && window.isValidImageUrl(org.logo)) {
      var img = document.createElement('img');
      img.src = org.logo;
      img.alt = '';
      img.style.cssText =
        'width:64px;height:64px;border-radius:16px;object-fit:contain;' +
        'background:var(--bg-surface);padding:6px;margin:0 auto 12px;display:block;';
      btn.appendChild(img);
    } else {
      var fallback = document.createElement('div');
      fallback.style.cssText =
        'width:64px;height:64px;border-radius:16px;background:var(--bg-soft);' +
        'display:flex;align-items:center;justify-content:center;' +
        'font-size:30px;margin:0 auto 12px;';
      fallback.textContent = org.type === 'FLEET_MANAGER' ? '🚕' : '🚌';
      btn.appendChild(fallback);
    }

    // Nom
    var nameDiv = document.createElement('div');
    nameDiv.style.cssText =
      'font-size:14px;font-weight:700;margin-bottom:7px;' +
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    nameDiv.textContent = org.name;
    btn.appendChild(nameDiv);

    // Badges (plan + type)
    var badgesDiv = document.createElement('div');
    badgesDiv.style.cssText =
      'display:flex;gap:5px;justify-content:center;flex-wrap:wrap;';

    var planSpan = document.createElement('span');
    planSpan.style.cssText =
      badgeStyle + 'padding:3px 9px;border-radius:20px;font-size:8px;font-weight:700;';
    planSpan.textContent = planLabel;
    badgesDiv.appendChild(planSpan);

    var typeSpan = document.createElement('span');
    typeSpan.style.cssText =
      'background:var(--bg-soft);color:var(--text-secondary);padding:3px 9px;border-radius:20px;' +
      'font-size:8px;font-weight:600;';
    typeSpan.textContent = typeLabel;
    badgesDiv.appendChild(typeSpan);

    btn.appendChild(badgesDiv);

    // Services (optionnel)
    if (serviceLabels) {
      var servicesDiv = document.createElement('div');
      servicesDiv.style.cssText =
        'margin-top:8px;padding-top:8px;' +
        'border-top:1px solid rgba(255,255,255,.06);font-size:8px;' +
        'color:var(--text-secondary);line-height:1.4;text-align:center;';
      servicesDiv.textContent = serviceLabels;
      btn.appendChild(servicesDiv);
    }

    scene.appendChild(btn);
  });
}



// ============================================================
// Contrôles précédent / suivant + swipe mobile
// ============================================================

// ============================================================
// RECHERCHE D'ORGANISATION
// ============================================================

function normaliserTextePartenaire(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}


function obtenirTypePartenaire(org) {
  return org && org.type === 'FLEET_MANAGER'
    ? 'URBAIN'
    : 'INTERURBAIN';
}


function obtenirIconePartenaire(org) {
  return org && org.type === 'FLEET_MANAGER'
    ? '🚕'
    : '🚌';
}


function obtenirStyleBadgePlanPartenaire(plan) {
  if (plan === 'Premium') {
    return 'background:var(--accent);color:var(--bg-page);';
  }

  if (plan === 'Standard') {
    return 'background:var(--info-fg);color:var(--text-on-accent);';
  }

  return 'background:var(--bg-surface);color:var(--text-secondary);';
}


function rechercherPartenaires(query) {

  var texte = normaliserTextePartenaire(query);

  if (!texte) {
    return [];
  }

  return partenairesData
    .filter(function(org) {

      var contenu = [
        org.name,
        org.slug,
        org.plan,
        obtenirTypePartenaire(org),
        org.type
      ]
        .map(normaliserTextePartenaire)
        .join(' ');

      return contenu.indexOf(texte) !== -1;
    })
    .slice(0, 8);
}


function afficherResultatsRecherchePartenaires(resultats, query) {

  var container =
    document.getElementById('partenaireRechercheResultats');

  if (!container) {
    return;
  }

  if (!query) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  if (!resultats.length) {
    container.innerHTML =
      '<div style="' +
        'padding:16px 14px;' +
        'text-align:center;' +
        'color:var(--text-secondary);' +
        'font-size:11px;' +
      '">' +
        'Aucune organisation trouvée' +
      '</div>';

    container.style.display = 'block';
    return;
  }

  var html = '';

  resultats.forEach(function(org) {

    var nom = window.escapeHtml(
      org.name || 'Organisation'
    );

    var slug = window.escapeHtml(
      org.slug || ''
    );

    var plan = window.escapeHtml(
      (org.plan || 'Freemium').toUpperCase()
    );

    var type = obtenirTypePartenaire(org);

    var logoHtml;

    if (
      org.logo &&
      window.isValidImageUrl &&
      window.isValidImageUrl(org.logo)
    ) {
      logoHtml =
        '<img' +
          ' src="' + window.escapeHtml(org.logo) + '"' +
          ' alt=""' +
          ' style="' +
            'width:42px;' +
            'height:42px;' +
            'border-radius:11px;' +
            'object-fit:contain;' +
            'background:var(--bg-surface);' +
            'padding:4px;' +
            'box-sizing:border-box;' +
            'flex-shrink:0;' +
          '"' +
        '>';
    } else {
      logoHtml =
        '<div style="' +
          'width:42px;' +
          'height:42px;' +
          'border-radius:11px;' +
          'background:var(--bg-soft);' +
          'display:flex;' +
          'align-items:center;' +
          'justify-content:center;' +
          'font-size:20px;' +
          'flex-shrink:0;' +
        '">' +
          obtenirIconePartenaire(org) +
        '</div>';
    }

    html +=
      '<button' +
        ' type="button"' +
        ' class="partenaireRechercheResultat"' +
        ' data-slug="' + slug + '"' +
        ' style="' +
          'width:100%;' +
          'display:flex;' +
          'align-items:center;' +
          'gap:11px;' +
          'padding:10px 12px;' +
          'border:0;' +
          'border-bottom:1px solid rgba(255,255,255,.06);' +
          'background:transparent;' +
          'color:var(--text-on-accent);' +
          'text-align:left;' +
          'cursor:pointer;' +
          'font-family:inherit;' +
        '"' +
      '>' +

        logoHtml +

        '<div style="' +
          'min-width:0;' +
          'flex:1;' +
        '">' +

          '<div style="' +
            'font-size:12px;' +
            'font-weight:700;' +
            'color:var(--text-on-accent);' +
            'white-space:nowrap;' +
            'overflow:hidden;' +
            'text-overflow:ellipsis;' +
            'margin-bottom:4px;' +
          '">' +
            nom +
          '</div>' +

          '<div style="' +
            'display:flex;' +
            'align-items:center;' +
            'gap:5px;' +
            'flex-wrap:wrap;' +
          '">' +

            '<span style="' +
              obtenirStyleBadgePlanPartenaire(org.plan) +
              'padding:2px 7px;' +
              'border-radius:20px;' +
              'font-size:8px;' +
              'font-weight:700;' +
            '">' +
              plan +
            '</span>' +

            '<span style="' +
              'background:var(--bg-soft);' +
              'color:var(--text-secondary);' +
              'padding:2px 7px;' +
              'border-radius:20px;' +
              'font-size:8px;' +
              'font-weight:600;' +
            '">' +
              type +
            '</span>' +

          '</div>' +

        '</div>' +

        '<span style="' +
          'font-size:20px;' +
          'color:var(--text-secondary);' +
          'flex-shrink:0;' +
        '">›</span>' +

      '</button>';
  });

  container.innerHTML = html;
  container.style.display = 'block';
}


function initialiserRecherchePartenaires() {

  var input =
    document.getElementById('partenaireRechercheInput');

  var clear =
    document.getElementById('partenaireRechercheClear');

  var resultats =
    document.getElementById('partenaireRechercheResultats');

  if (!input || !clear || !resultats) {
    return;
  }

  if (input.dataset.ready === 'true') {
    return;
  }

  input.dataset.ready = 'true';

  input.addEventListener('input', function() {

    var query = input.value.trim();

    clear.style.display =
      query ? 'flex' : 'none';

    var matches =
      rechercherPartenaires(query);

    afficherResultatsRecherchePartenaires(
      matches,
      query
    );
  });

  clear.addEventListener('click', function() {

    input.value = '';

    clear.style.display = 'none';

    afficherResultatsRecherchePartenaires(
      [],
      ''
    );

    input.focus();
  });

  input.addEventListener('keydown', function(event) {

    if (event.key === 'Escape') {

      input.value = '';

      clear.style.display = 'none';

      afficherResultatsRecherchePartenaires(
        [],
        ''
      );

      input.blur();
    }
  });

  resultats.addEventListener('click', function(event) {

    var button =
      event.target.closest(
        '.partenaireRechercheResultat'
      );

    if (!button) {
      return;
    }

    var slug =
      button.getAttribute('data-slug');

    if (!slug) {
      return;
    }

    afficherResultatsRecherchePartenaires(
      [],
      ''
    );

    input.value = '';
    clear.style.display = 'none';

    ouvrirPartenaire(slug);
  });
}


function installerControlesPartenaires() {

  var prev = document.getElementById('partenairePrev');
  var next = document.getElementById('partenaireNext');
  var scene = document.getElementById('partenairesScene');

  if (prev) {
    prev.onclick = function() {
      rotationPartenaire(-1);
      redemarrerRotationPartenaires();
    };
  }

  if (next) {
    next.onclick = function() {
      rotationPartenaire(1);
      redemarrerRotationPartenaires();
    };
  }

  if (!scene || scene.dataset.swipeReady === 'true') {
    return;
  }

  scene.dataset.swipeReady = 'true';

  scene.addEventListener('touchstart', function(event) {
    if (!event.touches || !event.touches.length) {
      return;
    }

    partenaireTouchStartX = event.touches[0].clientX;
    partenaireTouchStartY = event.touches[0].clientY;
  }, { passive: true });

  scene.addEventListener('touchend', function(event) {
    if (
      partenaireTouchStartX === null ||
      !event.changedTouches ||
      !event.changedTouches.length
    ) {
      return;
    }

    var endX = event.changedTouches[0].clientX;
    var endY = event.changedTouches[0].clientY;

    var deltaX = endX - partenaireTouchStartX;
    var deltaY = endY - partenaireTouchStartY;

    partenaireTouchStartX = null;
    partenaireTouchStartY = null;

    // On ne déclenche que sur un vrai swipe horizontal.
    if (
      Math.abs(deltaX) < 45 ||
      Math.abs(deltaX) < Math.abs(deltaY)
    ) {
      return;
    }

    if (deltaX < 0) {
      rotationPartenaire(1);
    } else {
      rotationPartenaire(-1);
    }

    redemarrerRotationPartenaires();
  }, { passive: true });
}


// ============================================================
// Rotation
// ============================================================

function rotationPartenaire(direction) {

  if (!partenairesData.length) {
    return;
  }

  partenaireIndex =
    (
      partenaireIndex +
      direction +
      partenairesData.length
    ) % partenairesData.length;

  afficherPartenaires3D();
}


// ============================================================
// Rotation automatique
// ============================================================

function demarrerRotationPartenaires() {

  if (partenaireTimer) {
    clearInterval(partenaireTimer);
  }

  partenaireTimer = setInterval(function() {
    rotationPartenaire(1);
  }, 3500);
}


function redemarrerRotationPartenaires() {

  if (partenaireTimer) {
    clearInterval(partenaireTimer);
  }

  demarrerRotationPartenaires();
}


// ============================================================
// Erreur / état vide
// ============================================================

function afficherErreurPartenaires(message) {

  var scene = document.getElementById('partenaires3D');

  if (!scene) {
    return;
  }

  scene.innerHTML =
    '<div style="' +
      'text-align:center;' +
      'padding-top:80px;' +
      'color:var(--text-secondary);' +
      'font-size:11px;' +
    '">' +
      message +
    '</div>';
}


// ============================================================
// Navigation vers le partenaire
// ============================================================

function ouvrirPartenaire(slug) {

  if (!slug) {
    return;
  }

  localStorage.setItem(
    'dagoos_selected_fleet_slug',
    slug
  );

  chargerBrandingOrganisation(slug).then(function() {
    loadPage('course');
  });
}


window.chargerPartenaires = chargerPartenaires;
window.ouvrirPartenaire = ouvrirPartenaire;

window.init_home = init_home;
