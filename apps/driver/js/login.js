const API_URL = DAGOOS_CONFIG.apiUrl;
const DASHBOARD_URL = 'dashboard.html';

const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');
const loginBtn = document.getElementById('loginBtn');
const orgSelect = document.getElementById('organization');
const codePrefix = document.getElementById('codePrefix');
const driverCodeInput = document.getElementById('driverCode');
const codeHint = document.getElementById('codeHint');
const pinInputs = document.querySelectorAll('#pinInputs input');

// ===== CHARGER LES ORGANISATIONS =====
async function loadOrganizations() {
    try {
        const response = await fetch(`${API_URL}/organizations`);
        if (response.ok) {
            const orgs = await response.json();
            if (!orgs || orgs.length === 0) {
                showMessage('Aucune organisation disponible', 'error');
                return;
            }
            orgSelect.innerHTML = '<option value="">— Sélectionner votre entité —</option>';
            orgs.forEach(org => {
                const option = document.createElement('option');
                option.value = org.id;
                const typePrefix = org.type === 'COOPERATIVE' ? 'CO' : 'FL';
                option.textContent = `${org.type === 'COOPERATIVE' ? '🏢' : '🚛'} ${org.name}`;
                option.dataset.prefix = `${typePrefix}-${org.code}`;
                option.dataset.type = typePrefix;
                orgSelect.appendChild(option);
            });
        } else {
            showMessage('Erreur chargement organisations', 'error');
        }
    } catch (error) {
        console.log('Organisations non disponibles:', error);
        showMessage('Service temporairement indisponible', 'error');
    }
}

// ===== MISE À JOUR DYNAMIQUE =====
orgSelect.addEventListener('change', () => {
    const selected = orgSelect.options[orgSelect.selectedIndex];
    const prefix = selected.dataset.prefix || '--';
    codePrefix.textContent = prefix + '-';
    driverCodeInput.value = '';
    driverCodeInput.placeholder = 'ex: 001';
    codeHint.textContent = `Votre code complet : ${prefix}-001`;
    driverCodeInput.focus();
});

// ===== GESTION DES INPUTS PIN =====
pinInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        const value = e.target.value;
        if (value.length === 1 && index < pinInputs.length - 1) {
            pinInputs[index + 1].focus();
        }
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0) {
            pinInputs[index - 1].focus();
        }
    });
});

function getPin() {
    let pin = '';
    pinInputs.forEach(input => { pin += input.value; });
    return pin;
}

// ===== CONSTRUIRE LE CODE COMPLET =====
function getFullCode() {
    const selected = orgSelect.options[orgSelect.selectedIndex];
    const prefix = selected.dataset.prefix || '';
    let driverNumber = driverCodeInput.value.trim().toUpperCase().replace(/-/g, '');
    return `${prefix}-${driverNumber}`;
}

// ===== LOGIN =====
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!orgSelect.value) {
        showMessage('Veuillez sélectionner votre entité', 'error');
        return;
    }
    
    const rawInput = driverCodeInput.value.trim();
    if (!rawInput) {
        showMessage('Veuillez entrer votre numéro chauffeur', 'error');
        return;
    }
    
    const pin = getPin();
    if (pin.length !== 4) {
        showMessage('Veuillez entrer votre PIN à 4 chiffres', 'error');
        return;
    }
    
    const fullCode = getFullCode();
    
    loginBtn.disabled = true;
    loginBtn.innerHTML = '⏳ Connexion...';
    showMessage(`Vérification de ${fullCode}...`, 'info');
    
    try {
        const response = await fetch(`${API_URL}/auth/driver-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: fullCode, pin })
        });
        const data = await response.json();
        
        if (response.ok) {
            // Stocker avant de rediriger
            localStorage.setItem('dagoos_token', data.token);
            localStorage.setItem('dagoos_user', JSON.stringify(data.user));
            showMessage('✅ Bienvenue ' + (data.user.name || fullCode) + ' !', 'success');
            // Redirection après un court délai
            setTimeout(() => { 
                window.location.replace(DASHBOARD_URL); 
            }, 800);
        } else {
            showMessage('❌ ' + (data.error || 'Code ou PIN incorrect'), 'error');
        }
    } catch (error) {
        showMessage('❌ Erreur de connexion au serveur', 'error');
    }
    
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
});

function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + type;
    // Cacher le message après 5 secondes
    setTimeout(() => {
        messageDiv.className = 'message';
    }, 5000);
}

// ===== INIT =====
loadOrganizations();
