function init_reservations() {
  var app = document.getElementById('app');
  app.innerHTML = `
    <div style="background:#252540;padding:16px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:50;border-bottom:1px solid rgba(245,158,11,0.2);">
      <span style="font-size:24px;">🚌</span>
      <div style="font-size:16px;font-weight:800;color:#F59E0B;">Départs inter-urbains</div>
    </div>
    <div style="padding:16px;">
      <div id="departList" style="margin-bottom:16px;"></div>
      <button onclick="chargerDeparts()" style="width:100%;padding:14px;background:#F59E0B;color:#1A1A2E;border:none;border-radius:8px;font-weight:700;cursor:pointer;">🔄 Actualiser</button>
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

    // Extraire les départs publiés des organisations actives
    orgs.forEach(function(org) {
      if (org.departs && Array.isArray(org.departs)) {
        org.departs.forEach(function(d) {
          if (d.statut === 'PUBLISHED' || d.statut === 'EMBARQUEMENT') {
            departs.push({
              id: d.id,
              pointDepart: d.pointDepart,
              destination: d.destination,
              date: d.date,
              heure: d.heure,
              prix: d.prix,
              placesTotal: d.placesTotal,
              statut: d.statut,
              organization: org.name
            });
          }
        });
      }
    });

    if (departs.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:30px;color:#94A3B8;">Aucun départ disponible</div>';
      return;
    }

    var html = '';
    departs.forEach(function(depart) {
      html += `
        <div style="background:#252540;border-radius:12px;padding:16px;margin-bottom:10px;border:1px solid rgba(245,158,11,0.2);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div style="font-size:15px;font-weight:700;color:#fff;">${depart.pointDepart} → ${depart.destination}</div>
            <span style="background:rgba(245,158,11,0.15);color:#F59E0B;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;">${depart.statut || 'DISPONIBLE'}</span>
          </div>
          <div style="display:flex;gap:16px;font-size:11px;color:#94A3B8;margin-bottom:8px;">
            <span>📅 ${new Date(depart.date).toLocaleDateString('fr-FR')}</span>
            <span>🕐 ${depart.heure || '--:--'}</span>
            <span>💺 ${depart.placesTotal || 1} places</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:18px;font-weight:800;color:#F59E0B;">${depart.prix || 0} Ar</div>
            <button onclick="reserver('${depart.id}')" style="padding:10px 16px;background:#F59E0B;color:#1A1A2E;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Réserver</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  } catch(e) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:#E74C3C;">Erreur de chargement</div>';
  }
}

async function reserver(departId) {
  var passagerNom = prompt('Votre nom :');
  if (!passagerNom) return;

  var telephone = prompt('Votre téléphone :');
  if (!telephone) return;

  var place = prompt('Numéro de place :');
  if (!place) return;

  try {
    var result = await apiPost('/public/reservations', {
      departId: departId,
      passagerNom: passagerNom,
      telephone: telephone,
      place: place
    });

    if (result && result.id) {
      alert('✅ Réservation confirmée !');
      chargerDeparts();
    } else {
      alert('❌ Erreur de réservation');
    }
  } catch(e) {
    alert('❌ Erreur réseau');
  }
}

window.init_reservations = init_reservations;
window.chargerDeparts = chargerDeparts;
window.reserver = reserver;
