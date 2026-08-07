// ===== DAGOO'S DRIVER - LOGIN =====
const API_URL = DAGOOS_CONFIG.apiUrl;

document.addEventListener('DOMContentLoaded', () => {
  loadOrganizations();
  setupPinInputs();
  document.getElementById('loginBtn').addEventListener('click', login);
});

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
      const select = document.getElementById('organization');
      select.innerHTML = '<option value="">— Sélectionner votre entité —</option>';
      orgs.forEach(org => {
        const option = document.createElement('option');
        option.value = org.id;
        option.textContent = `${org.type === 'COOPERATIVE' ? '🏢' : '🚛'} ${org.name}`;
        select.appendChild(option);
      });
    }
  } catch (error) {
    showMessage('Erreur de chargement des organisations', 'error');
  }
}

// ===== GESTION DES INPUTS PIN =====
function setupPinInputs() {
  const pinInputs = document.querySelectorAll('#pinInputs input');
  pinInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      if (e.target.value.length === 1 && index < pinInputs.length - 1) {
        pinInputs[index + 1].focus();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        pinInputs[index - 1].focus();
      }
    });
  });
}

// ===== CONNEXION =====
async function login() {
  const code = document.getElementById('driverCode').value.trim().toUpperCase();
  const pinInputs = document.querySelectorAll('#pinInputs input');
  const pin = Array.from(pinInputs).map(i => i.value).join('');

  if (!code) { showMessage('Veuillez entrer votre code chauffeur', 'error'); return; }
  if (pin.length !== 4) { showMessage('Veuillez entrer votre PIN à 4 chiffres', 'error'); return; }

  try {
    const response = await fetch(`${API_URL}/auth/driver-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, pin }),
    });
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('dagoos_token', data.token);
      localStorage.setItem('dagoos_user', JSON.stringify(data.user));
      showMessage('✅ Bienvenue ' + (data.user.name || code) + ' !', 'success');
      setTimeout(() => { window.location.replace('dashboard.html'); }, 800);
    } else {
      showMessage('❌ ' + (data.error || 'Code ou PIN incorrect'), 'error');
    }
  } catch (error) {
    showMessage('❌ Erreur de connexion au serveur', 'error');
  }
}

function showMessage(msg, type) {
  const div = document.getElementById('message');
  div.textContent = msg;
  div.className = 'message ' + (type || '');
  div.style.display = 'block';
}
