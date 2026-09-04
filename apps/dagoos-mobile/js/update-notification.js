// Notification de mise à jour PWA - Version professionnelle
(function() {
  let updateReady = false;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        updateReady = true;
        showUpdateBanner();
      }
    });

    // Vérifier aussi au chargement si une mise à jour est en attente
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        updateReady = true;
        showUpdateBanner();
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              updateReady = true;
              showUpdateBanner();
            }
          });
        }
      });
    });
  }

  function showUpdateBanner() {
    // Éviter les doublons
    if (document.getElementById('dagoos-update-banner')) return;

    // Créer l'overlay semi-transparent
    const overlay = document.createElement('div');
    overlay.id = 'dagoos-update-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      animation: fadeIn 0.2s ease-out;
    `;

    // Créer la carte de dialogue
    const card = document.createElement('div');
    card.id = 'dagoos-update-banner';
    card.style.cssText = `
      background: #ffffff;
      color: #1a1a2e;
      border-radius: 16px;
      padding: 28px 24px;
      max-width: 360px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      font-family: system-ui, -apple-system, sans-serif;
      animation: slideIn 0.3s ease-out;
      text-align: center;
    `;

    card.innerHTML = `
      <div style="
        width: 64px;
        height: 64px;
        background: #fef3c7;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
        font-size: 32px;
      ">🔄</div>
      
      <h3 style="
        font-size: 18px;
        font-weight: 700;
        margin: 0 0 8px;
        color: #1a1a2e;
      ">Mise à jour disponible</h3>
      
      <p style="
        font-size: 14px;
        color: #6b7280;
        margin: 0 0 20px;
        line-height: 1.5;
      ">Une nouvelle version de DAGOOS est disponible. Mettez à jour pour profiter des dernières améliorations.</p>
      
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button onclick="document.getElementById('dagoos-update-overlay').remove()" style="
          background: #f3f4f6;
          color: #4b5563;
          border: none;
          padding: 12px 20px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        ">Plus tard</button>
        
        <button onclick="window.location.reload()" style="
          background: #1a1a2e;
          color: #ffffff;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(26, 26, 46, 0.3);
        ">Mettre à jour</button>
      </div>
    `;

    // Ajouter les styles d'animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideIn {
        from { transform: translateY(20px) scale(0.95); opacity: 0; }
        to { transform: translateY(0) scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }
})();
