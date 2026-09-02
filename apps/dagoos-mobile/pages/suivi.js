function init_suivi() {
  var lastCode = localStorage.getItem('dagoos_mobile_last_code') || '';

  var app = document.getElementById('app');
  app.innerHTML = `
    <div style="background:#252540;padding:16px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:24px;">📋</span>
      <div style="font-size:16px;font-weight:800;color:#F59E0B;">Suivi de demande</div>
    </div>
    <div style="padding:16px;">
      <div style="background:#252540;border-radius:12px;padding:16px;">
        <input id="codeSuivi" placeholder="Code de suivi" value="${lastCode}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#1A1A2E;color:#fff;margin-bottom:12px;">
        <button onclick="suivre()" style="width:100%;padding:14px;background:#F59E0B;color:#1A1A2E;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Rechercher</button>
      </div>
      <div id="suiviResult" style="margin-top:12px;"></div>
    </div>
  `;

  if (lastCode) suivre();
}

async function suivre() {
  var code = document.getElementById('codeSuivi').value.trim();
  if (!code) { alert('Entrez un code'); return; }
  localStorage.setItem('dagoos_mobile_last_code', code);

  try {
    var result = await apiGet('/public/suivi/' + code);
    var container = document.getElementById('suiviResult');

    if (result && result.statut) {
      container.innerHTML = `
        <div style="background:#252540;border-radius:12px;padding:16px;">
          <div style="text-align:center;margin-bottom:12px;">
            <span style="font-size:40px;">📦</span>
            <div style="font-size:18px;font-weight:800;color:#F59E0B;margin-top:8px;">${result.statut}</div>
          </div>
          <div style="font-size:11px;color:#94A3B8;">Client</div>
          <div style="font-weight:600;">${result.clientNom || '-'}</div>
          <div style="font-size:11px;color:#94A3B8;margin-top:8px;">Départ</div>
          <div style="font-weight:600;">${result.depart || '-'}</div>
          <div style="font-size:11px;color:#94A3B8;margin-top:8px;">Arrivée</div>
          <div style="font-weight:600;">${result.arrivee || '-'}</div>
        </div>
      `;
    } else {
      container.innerHTML = '<div style="background:#252540;border-radius:12px;padding:16px;text-align:center;">Demande introuvable</div>';
    }
  } catch(e) {
    document.getElementById('suiviResult').innerHTML = '<div style="background:#252540;border-radius:12px;padding:16px;text-align:center;">Erreur de recherche</div>';
  }
}

window.init_suivi = init_suivi;
window.suivre = suivre;
