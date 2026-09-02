function init_home() {
  var app = document.getElementById('app');
  app.innerHTML = `
    <div style="background:#064E3B;padding:16px;display:flex;align-items:center;gap:12px;">
      <img src="/b-trans.svg" style="width:36px;height:36px;object-fit:contain;border-radius:8px;">
      <div>
        <div style="font-size:16px;font-weight:800;color:#10B981;">DAGOO'S</div>
        <div style="font-size:10px;color:#94A3B8;">Chez les potes, ça roule.</div>
      </div>
    </div>
    <div style="padding:16px;">
      <div style="background:#064E3B;border-radius:12px;padding:16px;margin-bottom:12px;">
        <input id="depart" placeholder="Adresse de départ" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#0A1F18;color:#fff;margin-bottom:8px;">
        <input id="arrivee" placeholder="Adresse d'arrivée" style="width:100%;padding:12px;border-radius:8px;border:1px solid #333;background:#0A1F18;color:#fff;margin-bottom:12px;">
        <button onclick="goToCourse()" style="width:100%;padding:14px;background:#10B981;color:#0A1F18;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Estimer le prix</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
        <div onclick="loadPage('course')" style="background:#064E3B;border-radius:12px;padding:20px;text-align:center;cursor:pointer;">
          <span style="font-size:32px;">🏍️</span>
          <div style="font-size:13px;font-weight:600;margin-top:8px;">Taxi Moto</div>
        </div>
        <div onclick="loadPage('course')" style="background:#064E3B;border-radius:12px;padding:20px;text-align:center;cursor:pointer;">
          <span style="font-size:32px;">🚕</span>
          <div style="font-size:13px;font-weight:600;margin-top:8px;">Taxi</div>
        </div>
      </div>
    </div>
  `;
}

function goToCourse() {
  var depart = document.getElementById('depart').value;
  var arrivee = document.getElementById('arrivee').value;
  if (depart && arrivee) {
    localStorage.setItem('dagoos_trip_depart', depart);
    localStorage.setItem('dagoos_trip_arrivee', arrivee);
  }
  loadPage('course');
}

window.init_home = init_home;
window.goToCourse = goToCourse;
