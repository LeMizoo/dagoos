var dagooBranding = null;

async function chargerBrandingOrganisation(slug) {
  if (!slug) return null;

  try {
    var org = await apiGet('/public/organizations/' + encodeURIComponent(slug));

    if (org && org.id) {
      dagooBranding = org;
      localStorage.setItem('dagoos_mobile_branding', JSON.stringify(org));
      appliquerBrandingMobile(org);
      return org;
    }
  } catch (e) {
    console.warn('Branding organisation indisponible');
  }

  return null;
}

function getBrandingMobile() {
  try {
    return dagooBranding ||
      JSON.parse(localStorage.getItem('dagoos_mobile_branding') || 'null');
  } catch (e) {
    return null;
  }
}

function appliquerBrandingMobile(org) {
  if (!org) return;

  var primary = /^#[0-9A-Fa-f]{6}$/.test(org.primaryColor || '')
    ? org.primaryColor
    : '#F59E0B';

  var secondary = /^#[0-9A-Fa-f]{6}$/.test(org.secondaryColor || '')
    ? org.secondaryColor
    : '#252540';

  document.documentElement.style.setProperty('--dagoo-primary', primary);
  document.documentElement.style.setProperty('--dagoo-secondary', secondary);

  var header = document.getElementById('dagoo-org-branding');

  if (!header) {
    header = document.createElement('div');
    header.id = 'dagoo-org-branding';
    header.style.cssText =
      'padding:10px 16px;display:flex;align-items:center;gap:10px;' +
      'background:var(--dagoo-secondary);border-bottom:1px solid rgba(255,255,255,.08);';

    var app = document.getElementById('app');
    if (app) app.prepend(header);
  }

  header.innerHTML = '';

  if (org.logo) {
    var img = document.createElement('img');
    img.src = org.logo;
    img.alt = org.name || 'Organisation';
    img.style.cssText =
      'width:38px;height:38px;border-radius:9px;object-fit:contain;background:#fff;';
    header.appendChild(img);
  }

  var text = document.createElement('div');

  var name = document.createElement('div');
  name.textContent = org.name || 'Dagoos';
  name.style.cssText =
    'font-weight:800;font-size:14px;color:#fff;';
  text.appendChild(name);

  if (org.slogan) {
    var slogan = document.createElement('div');
    slogan.textContent = org.slogan;
    slogan.style.cssText =
      'font-size:11px;color:rgba(255,255,255,.75);margin-top:2px;';
    text.appendChild(slogan);
  }

  header.appendChild(text);

  document.querySelectorAll('[data-dagoo-primary]').forEach(function(el) {
    el.style.background = primary;
  });
}
