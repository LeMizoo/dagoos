var API_URL = 'https://dagoos-api.onrender.com/api';

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var msg = document.getElementById('message');
    var name = document.getElementById('name').value.trim();
    var email = document.getElementById('email').value.trim();
    var phone = document.getElementById('phone').value.trim();
    var password = document.getElementById('password').value;
    var confirm = document.getElementById('confirmPassword').value;
    
    if (password !== confirm) { msg.className = 'message error'; msg.textContent = '<i class="fas fa-times-circle"></i> Les mots de passe ne correspondent pas'; return; }
    if (password.length < 6) { msg.className = 'message error'; msg.textContent = '<i class="fas fa-times-circle"></i> 6 caractères minimum'; return; }
    
    msg.className = 'message info'; msg.textContent = '<i class="fas fa-hourglass-half"></i> Création en cours...';
    
    try {
        var res = await fetch(API_URL + '/auth/register', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, email: email, phone: phone, password: password, role: 'FLEET_MANAGER' })
        });
        var data = await res.json();
        if (res.ok) {
            msg.className = 'message success';
            msg.innerHTML = '<i class="fas fa-check-circle"></i> Compte créé ! <a href="index.html" style="color:#1A5276;font-weight:600;">Se connecter</a>';
            this.reset();
        } else {
            msg.className = 'message error'; msg.textContent = '<i class="fas fa-times-circle"></i> ' + (data.error || 'Erreur');
        }
    } catch (err) { msg.className = 'message error'; msg.textContent = '<i class="fas fa-times-circle"></i> Erreur réseau'; }
});

function togglePassword(id, icon) {
    var inp = document.getElementById(id);
    if (inp.type === 'password') { inp.type = 'text'; icon.classList.replace('fa-eye', 'fa-eye-slash'); }
    else { inp.type = 'password'; icon.classList.replace('fa-eye-slash', 'fa-eye'); }
}
