var API_URL = DAGOOS_CONFIG.apiUrl;

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var msg = document.getElementById('message');
    var name = document.getElementById('name').value.trim();
    var email = document.getElementById('email').value.trim();
    var phone = document.getElementById('phone').value.trim();
    var password = document.getElementById('password').value;
    var confirm = document.getElementById('confirmPassword').value;
    
    if (password !== confirm) { msg.className = 'message error'; msg.textContent = '❌ Les mots de passe ne correspondent pas'; return; }
    if (password.length < 6) { msg.className = 'message error'; msg.textContent = '❌ 6 caractères minimum'; return; }
    
    msg.className = 'message info'; msg.textContent = '⏳ Création en cours...';
    
    try {
        var res = await fetch(API_URL + '/auth/register', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, email: email, phone: phone, password: password, role: "FLEET_MANAGER", plan: document.querySelector("input[name=plan]:checked").value })
        });
        var data = await res.json();
        if (res.ok) {
            msg.className = 'message success';
            msg.innerHTML = '✅ Compte créé ! <a href="index.html" style="color:#1A5276;font-weight:600;">Se connecter</a>';
            this.reset();
        } else {
            msg.className = 'message error'; msg.textContent = '❌ ' + (data.error || 'Erreur');
        }
    } catch (err) { msg.className = 'message error'; msg.textContent = '❌ Erreur réseau'; }
});

function togglePassword(id, icon) {
    var inp = document.getElementById(id);
    if (inp.type === 'password') { inp.type = 'text'; icon.classList.replace('fa-eye', 'fa-eye-slash'); }
    else { inp.type = 'password'; icon.classList.replace('fa-eye-slash', 'fa-eye'); }
}
