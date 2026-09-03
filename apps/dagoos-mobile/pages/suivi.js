// ============================================
// SUIVI.JS — Aligné sur la landing
// ============================================

function init_suivi() {
  var lastCode = localStorage.getItem('dagoos_mobile_last_code') || '';

  var app = document.getElementById('app');
  app.innerHTML = `
    <div style="background:#252540;padding:16px;display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:50;border-bottom:1px solid rgba(245,158,11,0.2);">
      <span style="font-size:24px;">📋</span>
      <div style="font-size:16px;font-weight:800;color:#F59E0B;">Suivi de demande</div>
    </div>
    <div style="padding:16px;">
      <div style="background:#252540;border-radius:12px;padding:16px;">
        <input id="codeSuivi" placeholder="Entrez votre code (ex: DG-XXXX)" value="${lastCode}" style="width:100%;padding:14px;border-radius:8px;border:1px solid #F59E0B;background:#1A1A2E;color:#F59E0B;font-size:16px;text-align:center;margin-bottom:12px;text-transform:uppercase;">
        <button onclick="suivre()" style="width:100%;padding:14px;background:#F59E0B;color:#1A1A2E;border:none;border-radius:8px;font-weight:700;cursor:pointer;">🔍 Rechercher</button>
      </div>
      <div id="suiviResult" style="margin-top:12px;"></div>
    </div>
  `;

  if (lastCode) suivre();
}

async function suivre() {
  var code = document.getElementById('codeSuivi').value.trim().toUpperCase();
  if (!code) { alert('Entrez un code de suivi'); return; }
  localStorage.setItem('dagoos_mobile_last_code', code);

  var container = document.getElementById('suiviResult');
  container.innerHTML = '<div style="text-align:center;padding:20px;color:#94A3B8;">Recherche...</div>';

  try {
    var result = await apiGet('/public/suivi/' + code);

    if (result && result.statut) {
      var statutLabels = {
        'NEW': '⏳ En attente',
        'ACCEPTED': '✅ Acceptée',
        'REJECTED': '❌ Refusée',
        'IN_PROGRESS': '🕐 En cours',
        'COMPLETED': '✅ Terminée',
        'CANCELLED': '❌ Annulée'
      };

      var statutMessages = {
        'NEW': 'Votre demande est en attente. Les chauffeurs sont notifiés. Patientez quelques instants.',
        'ACCEPTED': 'Un chauffeur a accepté votre demande ! Restez joignable sur votre téléphone.',
        'REJECTED': 'Votre demande a été refusée. Vous pouvez réessayer avec une autre flotte.',
        'IN_PROGRESS': 'Votre course est en cours de traitement.',
        'COMPLETED': 'Votre course est terminée. Merci de votre confiance !',
        'CANCELLED': 'Votre course a été annulée.'
      };

      var statutNegociationLabels = {
        'PRIX_SUGGERE': 'Prix suggéré',
        'OFFRE_CLIENT': 'Offre client en attente',
        'CONTRE_OFFRE_CHAUFFEUR': 'Contre-offre du chauffeur',
        'ACCEPTED': 'Acceptée',
        'REJECTED': 'Refusée'
      };

      var statutColor = result.statut === 'ACCEPTED' ? '#22C55E' : result.statut === 'REJECTED' ? '#EF4444' : '#F59E0B';
      var statutLabel = statutLabels[result.statut] || result.statut;
      var statutMessage = statutMessages[result.statut] || '';

      container.innerHTML = `
        <div style="background:#252540;border-radius:14px;padding:20px;border:1px solid rgba(245,158,11,0.3);">
          <div style="text-align:center;margin-bottom:16px;">
            <span style="font-size:50px;">${result.statut === 'ACCEPTED' ? '✅' : result.statut === 'REJECTED' ? '❌' : '⏳'}</span>
            <div style="font-size:20px;font-weight:800;margin-top:8px;color:${statutColor};">${statutLabel}</div>
            ${statutMessage ? '<div style="font-size:12px;color:#94A3B8;margin-top:8px;line-height:1.5;">' + statutMessage + '</div>' : ''}
          </div>

          <div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:12px;">
            <div style="font-size:11px;color:#94A3B8;">Client</div>
            <div style="font-weight:600;margin-bottom:8px;">${result.clientNom || '-'}</div>

            <div style="font-size:11px;color:#94A3B8;">Trajet</div>
            <div style="font-weight:600;margin-bottom:8px;">${result.depart || '-'} → ${result.arrivee || '-'}</div>

            <div style="font-size:11px;color:#94A3B8;">Prix estimé</div>
            <div style="font-weight:600;margin-bottom:8px;color:#F59E0B;">${Number(result.prixEstime || 0).toLocaleString('fr-FR')} Ar</div>

            ${result.offreClient ? `
              <div style="font-size:11px;color:#94A3B8;">Votre offre</div>
              <div style="font-weight:600;margin-bottom:8px;color:#22C55E;">${Number(result.offreClient).toLocaleString('fr-FR')} Ar</div>
            ` : ''}

            ${result.contreOffreChauffeur ? `
              <div style="font-size:11px;color:#94A3B8;">Contre-offre chauffeur</div>
              <div style="font-weight:600;margin-bottom:8px;color:#3B82F6;">${Number(result.contreOffreChauffeur).toLocaleString('fr-FR')} Ar</div>
            ` : ''}

            ${result.statutNegociation ? `
              <div style="font-size:11px;color:#94A3B8;">Négociation</div>
              <div style="font-weight:600;margin-bottom:8px;">${statutNegociationLabels[result.statutNegociation] || result.statutNegociation}</div>
            ` : ''}
          </div>
        </div>
      `;
    } else {
      container.innerHTML = '<div style="text-align:center;padding:30px;color:#94A3B8;">Aucune demande trouvée avec ce code</div>';
    }
  } catch(e) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:#E74C3C;">Erreur de recherche</div>';
  }
}

window.init_suivi = init_suivi;
window.suivre = suivre;
