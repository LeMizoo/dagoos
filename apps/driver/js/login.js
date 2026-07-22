const API_URL = 'https://dagoos-api.onrender.com/api';
const DASHBOARD_URL = 'dashboard.html';

const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');
const loginBtn = document.getElementById('loginBtn');
const orgSelect = document.getElementById('organization');
const codePrefix = document.getElementById('codePrefix');
const pinInputs = document.querySelectorAll('#pinInputs input');

// ===== CHARGER LES ORGANISATIONS (FLEET_MANAGER + COOPERATIVE) =====
async function loadOrganizations() {
    try {
        const response = await fetch(`${API_URL}/organizations`);
        if (response.ok) {
            const orgs = await response.json();
            orgs.forEach(org => {
                const option = document.createElement('option');
                option.value = org.id;
                option.textContent = `${org.type === 'COOPERATIVE' ? '🏢' : '🚛'} ${org.name}`;
                option.dataset.prefix = org.codePrefix || org.name.substring(0,2).toUpperCase();
                orgSelect.appendChild(option);
            });
        } else {
            // Fallback : quelques options par défaut
            const defaults = [
                { id: 'demo-fl', name: 'Flotte Démo', prefix: 'FL', type: 'FLEET_MANAGER' },
                { id: 'demo-co', name: 'Coop Démo', prefix: 'CO', type: 'COOPERATIVE' }
            ];
            defaults.forEach(org => {
                const option = document.createElement('option');
                option.value = org.id;
                option.textContent = `${org.type === 'COOPERATIVE' ? '🏢' : '🚛'} ${org.name}`;
                option.dataset.prefix = org.prefix;
                orgSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.log('Organisations non disponibles, mode démo');
        const option = document.createElement('option');
        option.value = 'demo';
        option.textContent = '🚛 Flotte Démo';
        option.dataset.prefix = 'FL';
        orgSelect.appendChild(option);
    }
}

// ===== MISE À JOUR DU PRÉFIXE =====
orgSelect.addEventListener('change', () => {
    const selected = orgSelect.options[orgSelect.selectedIndex];
    codePrefix.textContent = selected.dataset.prefix || '--';
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

// ===== LOGIN =====
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const organizationId = orgSelect.value;
    const driverCode = document.getElementById('driverCode').value.trim().toUpperCase();
    const pin = getPin();
    
    if (!organizationId) {
        showMessage('Veuillez sélectionner votre flotte/coopérative', 'error');
        return;
    }
    if (!driverCode) {
        showMessage('Veuillez entrer votre code chauffeur', 'error');
        return;
    }
    if (pin.length !== 4) {
        showMessage('Veuillez entrer votre PIN à 4 chiffres', 'error');
        return;
    }
    
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    showMessage('Connexion en cours...', 'info');
    
    try {
        const response = await fetch(`${API_URL}/auth/driver-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ organizationId, code: driverCode, pin })
        });
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('dagoos_token', data.token);
            localStorage.setItem('dagoos_user', JSON.stringify(data.user));
            showMessage('✅ Connexion réussie !', 'success');
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
