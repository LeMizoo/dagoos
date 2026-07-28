// DAGOO'S - Paramètres
async function init_parametres() {
  const main = document.getElementById('mainContent');
  main.innerHTML = `
    <div class="topbar"><h1>⚙️ Paramètres</h1></div>
    <div class="card" style="padding:24px;">
      <h3>Configuration</h3>
      <p style="color:#6C757D;">API : ${DAGOOS_CONFIG.apiUrl}</p>
      <p style="color:#6C757D;">Version : 2.0.0</p>
    </div>`;
}
