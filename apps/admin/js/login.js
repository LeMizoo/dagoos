// ========================================
// DAGOO'S ADMIN - LOGIN
// ========================================

const API_URL = 'https://dagoos-api.onrender.com/api';
const DASHBOARD_URL = 'dashboard.html';
const LANDING_URL = 'https://dago-mobility.pages.dev';

console.log('🔐 Dagoo\'s Admin - Login');

const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');
const loginBtn = document.getElementById('loginBtn');
const btnText = document.getElementById('btnText');
const loader = document.getElementById('loader');

// Vérifier si déjà connecté
const token = localStorage.getItem('dagoos_token');
const user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');

if (token && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN')) {
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
    
    if (!email || !password) {
        showMessage('Veuillez remplir tous les champs', 'error');
        return;
    }
    
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
            // Vérifier le rôle
            if (data.user.role !== 'SUPER_ADMIN' && data.user.role !== 'ADMIN') {
                showMessage('⛔ Accès réservé aux administrateurs', 'error');
                setLoading(false);
                return;
            }
            
            // Sauvegarder le token
            localStorage.setItem('dagoos_token', data.token);
            localStorage.setItem('dagoos_user', JSON.stringify(data.user));
            
            showMessage('✅ Connexion réussie ! Redirection...', 'success');
            
            setTimeout(() => {
                window.location.href = DASHBOARD_URL;
            }, 1000);
        } else {
            showMessage('❌ ' + (data.error || 'Email ou mot de passe incorrect'), 'error');
        }
    } catch (error) {
        showMessage('❌ Erreur de connexion au serveur', 'error');
        console.error(error);
    }
    
    setLoading(false);
});
