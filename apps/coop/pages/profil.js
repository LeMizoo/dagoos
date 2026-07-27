function init_profil() {
    var main = document.getElementById('mainContent');
    var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
    main.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
            '<h1><i class="fas fa-user-circle"></i> Mon Profil</h1>' +
        '</div>' +
        '<div class="card" style="padding:24px;">' +
            '<div class="form-group"><label>Nom</label><input id="editName" value="' + (user.name || '') + '"></div>' +
            '<div class="form-group"><label>Email</label><input id="editEmail" value="' + (user.email || '') + '" disabled style="background:#F1F5F9;"></div>' +
            '<div class="form-group"><label>Téléphone</label><input id="editPhone" value="' + (user.phone || '') + '"></div>' +
            '<div class="form-group"><label>Nouveau mot de passe (laisser vide si inchangé)</label><input type="password" id="editPassword" placeholder="Min 6 caractères"></div>' +
            '<button class="btn btn-primary" onclick="saveProfil()"><i class="fas fa-save"></i> Enregistrer</button>' +
        '</div>';
}

function saveProfil() {
    var data = {
        name: document.getElementById('editName').value,
        phone: document.getElementById('editPhone').value
    };
    var password = document.getElementById('editPassword').value;
    if (password && password.length >= 6) data.password = password;
    
    apiPut('/auth/profile', data).then(function(res) {
        if (res.error) return alert('Erreur: ' + res.error);
        var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
        user.name = data.name;
        user.phone = data.phone;
        localStorage.setItem('dagoos_user', JSON.stringify(user));
        alert('Profil mis à jour !');
    });
}
