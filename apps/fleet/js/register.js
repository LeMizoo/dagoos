const API_URL = 'https://dagoos-api.onrender.com/api';
const LOGIN_URL = 'index.html';
const DEFAULT_LOGO = 'https://dago-mobility.pages.dev/assets/logo/b-trans.png';

const registerForm = document.getElementById('registerForm');
const messageDiv = document.getElementById('message');
const logoInput = document.getElementById('logoInput');
const logoPreview = document.getElementById('logoPreview');

let logoBase64 = null;

// Preview logo
logoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            logoBase64 = ev.target.result;
            logoPreview.innerHTML = `<img src="${logoBase64}" alt="Logo">`;
        };
        reader.readAsDataURL(file);
    }
});

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
    
    if (password !== confirmPassword) { showMessage('❌ Les mots de passe ne correspondent pas', 'error'); return; }
    if (password.length < 6) { showMessage('❌ Mot de passe trop court (min 6 caractères)', 'error'); return; }
    
    showMessage('⏳ Création du compte...', 'info');
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name, email, phone, password, 
                role: 'FLEET_MANAGER',
                logo: logoBase64 || DEFAULT_LOGO
            })
        });
        const data = await response.json();
        
        if (response.ok) {
            showMessage('✅ Compte créé ! <a href="' + LOGIN_URL + '" style="color:#1A5276;font-weight:600;">Se connecter</a>', 'success');
            registerForm.reset();
            logoPreview.innerHTML = '<i class="fas fa-building" style="color:#CCC;font-size:20px;"></i>';
            logoBase64 = null;
        } else {
            showMessage('❌ ' + (data.error || 'Erreur'), 'error');
        }
    } catch (error) {
        showMessage('❌ Erreur de connexion', 'error');
    }
});

function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input.type === 'password') { input.type = 'text'; icon.classList.replace('fa-eye', 'fa-eye-slash'); }
    else { input.type = 'password'; icon.classList.replace('fa-eye-slash', 'fa-eye'); }
}

function togglePassword(id, iconId) {
    var inp = document.getElementById(id);
    var icon = document.getElementById(iconId);
    if (inp.type === 'password') { inp.type = 'text'; icon.classList.replace('fa-eye', 'fa-eye-slash'); }
    else { inp.type = 'password'; icon.classList.replace('fa-eye-slash', 'fa-eye'); }
}
