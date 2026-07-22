const API_URL = 'https://dagoos-api.onrender.com/api';
const DASHBOARD_URL = 'dashboard.html';
const LANDING_URL = 'https://dago-mobility.pages.dev';

const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');
const loginBtn = document.getElementById('loginBtn');
const btnText = document.getElementById('btnText');
const loader = document.getElementById('loader');

const token = localStorage.getItem('dagoos_token');
const user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');

if (token && user.role === 'COOPERATIVE') {
    window.location.href = DASHBOARD_URL;
}

function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + type;
}

function setLoading(loading) {
    if (loading) {
        btnText.style.display = 'none';
        loader.style.display = 'block';
        loginBtn.disabled = true;
    } else {
        btnText.style.display = 'inline';
        loader.style.display = 'none';
        loginBtn.disabled = false;
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    setLoading(true);
    showMessage('Connexion en cours...', 'info');
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        
        if (response.ok) {
            if (data.user.role !== 'COOPERATIVE' && data.user.role !== 'SUPER_ADMIN' && data.user.role !== 'ADMIN') {
                showMessage('⛔ Accès réservé aux coopératives', 'error');
                setLoading(false);
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
        showMessage('❌ Erreur de connexion', 'error');
    }
    setLoading(false);
});
