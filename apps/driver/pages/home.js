function init_home() {
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    document.getElementById('mainContent').innerHTML = 
        '<div style="background:#F1C40F;color:#1A1A2E;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;font-weight:600;">' +
            '<span>🟢 En ligne</span><span id="currentTime"></span>' +
        '</div>' +
        '<div style="padding:24px;">' +
            '<div class="stats-grid">' +
                '<div class="stat-card"><div class="stat-number">0</div><div class="stat-label">Courses aujourd\'hui</div></div>' +
                '<div class="stat-card"><div class="stat-number">0 Ar</div><div class="stat-label">Revenus</div></div>' +
            '</div>' +
            '<div class="card"><div class="card-header"><h3><i class="fas fa-motorcycle"></i> Courses récentes</h3></div><div style="text-align:center;padding:40px;color:#6C757D;">Aucune course</div></div>' +
        '</div>';
    updateTime();
    setInterval(updateTime, 30000);
}

function updateTime() {
    var now = new Date();
    var el = document.getElementById('currentTime');
    if (el) el.textContent = now.toLocaleTimeString('fr');
}
