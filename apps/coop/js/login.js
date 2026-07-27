var API_URL = 'https://dagoos-api.onrender.com/api';
var DASHBOARD_URL = 'dashboard.html';

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    var msg = document.getElementById('message');
    var email = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;
    msg.className = 'message info'; msg.textContent = 'Connexion...';
    try {
        var res = await fetch(API_URL + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, password: password }) });
        var data = await res.json();
        if (res.ok) {
            if (data.user.role !== 'COOPERATIVE' && data.user.role !== 'SUPER_ADMIN' && data.user.role !== 'ADMIN') {
                msg.className = 'message error'; msg.textContent = '⛔ Accès réservé aux coopératives'; return;
            }
            localStorage.setItem('dagoos_token', data.token);
            localStorage.setItem('dagoos_user', JSON.stringify(data.user));
            msg.className = 'message success'; msg.textContent = '✅ Connexion réussie !';
            setTimeout(function() { window.location.href = DASHBOARD_URL; }, 1000);
        } else {
            msg.className = 'message error'; msg.textContent = '❌ ' + (data.error || 'Email ou mot de passe incorrect');
        }
    } catch (err) { msg.className = 'message error'; msg.textContent = '❌ Erreur réseau'; }
});

function togglePassword(id, icon) {
    var inp = document.getElementById(id);
    if (inp.type === 'password') { inp.type = 'text'; icon.classList.replace('fa-eye', 'fa-eye-slash'); }
    else { inp.type = 'password'; icon.classList.replace('fa-eye-slash', 'fa-eye'); }
}
