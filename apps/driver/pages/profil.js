function init_profil() {
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    var main = document.getElementById('mainContent');
    main.innerHTML = 
        '<div style="background:linear-gradient(135deg,#F1C40F,#F39C12);color:#1A1A2E;padding:14px 16px;">' +
            '<h1 style="font-size:16px;"><i class="fas fa-user"></i> Profil</h1>' +
        '</div>' +
        '<div style="padding:12px;max-width:500px;margin:0 auto;">' +
            '<div class="card" style="background:#1E293B;border-radius:12px;padding:14px;">' +
                '<div style="text-align:center;margin-bottom:16px;">' +
                    '<div style="width:60px;height:60px;background:#DAA520;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;font-size:24px;">👤</div>' +
                    '<h3 style="color:#DAA520;">' + (user.name || 'Chauffeur') + '</h3>' +
                '</div>' +
                '<p style="color:#94A3B8;"><strong>Code:</strong> ' + (user.driverCode || 'N/A') + '</p>' +
                '<p style="color:#94A3B8;"><strong>Organisation:</strong> ' + (user.organization || 'N/A') + '</p>' +
                '<p style="color:#94A3B8;"><strong>Rôle:</strong> Chauffeur</p>' +
                '<button onclick="logout()" style="width:100%;padding:12px;background:#EF4444;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;margin-top:16px;">🚪 Déconnexion</button>' +
            '</div>' +
        '</div>';
}
