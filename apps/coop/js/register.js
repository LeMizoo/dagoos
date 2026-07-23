const API_URL = 'https://dagoos-api.onrender.com/api';
const LOGIN_URL = 'index.html';

const registerForm = document.getElementById('registerForm');
const messageDiv = document.getElementById('message');

function showMessage(text, type) {
    messageDiv.innerHTML = text;
    messageDiv.className = 'message ' + type;
}

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        showMessage('<i class="fas fa-times-circle"></i> Les mots de passe ne correspondent pas', 'error');
        return;
    }
    if (password.length < 6) {
        showMessage('<i class="fas fa-times-circle"></i> Le mot de passe doit contenir au moins 6 caractères', 'error');
        return;
    }
    
    showMessage('<i class="fas fa-hourglass-half"></i> Création du compte en cours...', 'info');
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password, role: 'COOPERATIVE' })
        });
        const data = await response.json();
        
        if (response.ok) {
            showMessage('<i class="fas fa-check-circle"></i> Compte créé avec succès ! <a href="' + LOGIN_URL + '" style="color:#27AE60;font-weight:600;">Se connecter</a>', 'success');
            registerForm.reset();
        } else {
            showMessage('<i class="fas fa-times-circle"></i> ' + (data.error || 'Erreur lors de l\'inscription'), 'error');
        }
    } catch (error) {
        showMessage('<i class="fas fa-times-circle"></i> Erreur de connexion au serveur', 'error');
    }
});

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
