// Notification de mise à jour PWA
(function() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        showUpdateNotification(event.data.message);
      }
    });
  }

  function showUpdateNotification(message) {
    // Éviter les doublons
    if (document.getElementById('dagoos-update-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'dagoos-update-banner';
    banner.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      background: #f39c12;
      color: #000;
      padding: 14px 18px;
      border-radius: 12px;
      z-index: 10000;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      font-family: system-ui, -apple-system, sans-serif;
      animation: slideUp 0.3s ease-out;
    `;

    banner.innerHTML = `
      <span style="flex: 1; font-size: 14px; font-weight: 500;">🔄 ${message}</span>
      <button onclick="window.location.reload()" style="
        background: #000;
        color: #fff;
        border: none;
        padding: 10px 18px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        white-space: nowrap;
      ">Redémarrer</button>
    `;

    // Ajouter le style d'animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUp {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(banner);
  }
})();
