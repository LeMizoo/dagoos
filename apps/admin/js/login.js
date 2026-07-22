const API_URL = 'https://dagoos-api.onrender.com/api';
const DASHBOARD_URL = 'dashboard.html';
const LANDING_URL = 'https://dago-mobility.pages.dev';

const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');
const loginBtn = document.getElementById('loginBtn');

const token = localStorage.getItem('dagoos_token');
const user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');

if (token && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')) {
    window.location.href = DASHBOARD_URL;
}

function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + type;
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showMessage('Veuillez remplir tous les champs', 'error');
        return;
    }
    
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    showMessage('Connexion en cours...', 'info');
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        
        if (response.ok) {
            if (data.user.role !== 'SUPER_ADMIN' && data.user.role !== 'ADMIN') {
                showMessage('⛔ Accès réservé aux administrateurs', 'error');
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
                return;
            }
            localStorage.setItem('dagoos_token', data.token);
            localStorage.setItem('dagoos_user', JSON.stringify(data.user));
            showMessage('✅ Connexion réussie !', 'success');
            setTimeout(() => { window.location.href = DASHBOARD_URL; }, 1000);
        } else {
            showMessage('❌ ' + (data.error || 'Email ou mot de passe incorrect'), 'error');
        }
    } catch (error) {
        showMessage('❌ Erreur de connexion au serveur', 'error');
    }
    
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
});

// Toggle password
function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}
