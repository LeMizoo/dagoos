const API_URL = 'https://dagoos-api.onrender.com/api';
const DASHBOARD_URL = 'dashboard.html';

const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');
const loginBtn = document.getElementById('loginBtn');
const orgSelect = document.getElementById('organization');
const codePrefix = document.getElementById('codePrefix');
const driverCodeInput = document.getElementById('driverCode');
const pinInputs = document.querySelectorAll('#pinInputs input');

// ===== STRUCTURE DES CODES =====
// Format : [TYPE]-[CODE_ENTITE][NUMERO]
// Exemples : FL-AL001 (Flotte Alasora, chauffeur 001)
//            CO-TN001 (Coop Tana, chauffeur 001)

// ===== CHARGER LES ORGANISATIONS =====
async function loadOrganizations() {
    try {
        const response = await fetch(`${API_URL}/organizations`);
        if (response.ok) {
            const orgs = await response.json();
            orgs.forEach(org => {
                const option = document.createElement('option');
                option.value = org.id;
                const typePrefix = org.type === 'COOPERATIVE' ? 'CO' : 'FL';
                const entityCode = org.code;
                option.textContent = `${org.type === 'COOPERATIVE' ? '🏢' : '🚛'} ${org.name} (${typePrefix}-${entityCode}XXX)`;
                option.dataset.prefix = `${typePrefix}-${entityCode}`;
                orgSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.log('Mode démo');
        const defaults = [
            { name: 'Flotte Alasora', type: 'FLEET_MANAGER', code: 'AL' },
            { name: 'Flotte Rasoa', type: 'FLEET_MANAGER', code: 'RA' },
            { name: 'Coop Tana', type: 'COOPERATIVE', code: 'TN' }
        ];
        defaults.forEach(org => {
            const option = document.createElement('option');
            option.value = org.code;
            const typePrefix = org.type === 'COOPERATIVE' ? 'CO' : 'FL';
            option.textContent = `${org.type === 'COOPERATIVE' ? '🏢' : '🚛'} ${org.name} (${typePrefix}-${org.code}XXX)`;
            option.dataset.prefix = `${typePrefix}-${org.code}`;
            orgSelect.appendChild(option);
        });
    }
}

// ===== MISE À JOUR DU PRÉFIXE =====
orgSelect.addEventListener('change', () => {
    const selected = orgSelect.options[orgSelect.selectedIndex];
    const prefix = selected.dataset.prefix || '--';
    codePrefix.textContent = prefix;
    // Vider le champ code
    driverCodeInput.value = '';
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
    // Prendre uniquement les chiffres/lettres après le préfixe
    let driverNumber = driverCodeInput.value.trim().toUpperCase();
    // Si l'utilisateur a tapé le code complet (ex: FL-AL001), extraire juste la partie numéro
    if (driverNumber.includes('-')) {
        const parts = driverNumber.split('-');
        driverNumber = parts[parts.length - 1];
    }
    // Enlever le préfixe si l'utilisateur l'a inclus
    if (driverNumber.startsWith(prefix.replace('FL-', '').replace('CO-', ''))) {
        driverNumber = driverNumber.substring(prefix.replace('FL-', '').replace('CO-', '').length);
    }
    return `${prefix}${driverNumber}`;
}

// ===== LOGIN =====
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const organizationId = orgSelect.value;
    const rawInput = driverCodeInput.value.trim();
    const pin = getPin();
    
    if (!organizationId) {
        showMessage('Veuillez sélectionner votre flotte/coopérative', 'error');
        return;
    }
    if (!rawInput) {
        showMessage('Veuillez entrer votre numéro chauffeur', 'error');
        return;
    }
    if (pin.length !== 4) {
        showMessage('Veuillez entrer votre PIN à 4 chiffres', 'error');
        return;
    }
    
    const fullCode = getFullCode();
    
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    showMessage(`Vérification du code ${fullCode}...`, 'info');
    
    try {
        const response = await fetch(`${API_URL}/auth/driver-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: fullCode, pin })
        });
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('dagoos_token', data.token);
            localStorage.setItem('dagoos_user', JSON.stringify(data.user));
            showMessage('✅ Bienvenue ' + (data.user.name || fullCode) + ' !', 'success');
            setTimeout(() => { window.location.href = DASHBOARD_URL; }, 1000);
        } else {
            showMessage('❌ ' + (data.error || 'Code ou PIN incorrect'), 'error');
        }
    } catch (error) {
        showMessage('❌ Erreur de connexion', 'error');
    }
    
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
});

function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + type;
}

// ===== INIT =====
loadOrganizations();
