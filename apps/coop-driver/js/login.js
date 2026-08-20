var API_URL = DAGOOS_CONFIG.apiUrl;
var selectedType = 'COOP';

// Vérifier si un code chauffeur est déjà mémorisé
function checkSavedCode() {
  var savedCode = localStorage.getItem('dagoo_driver_code');
  var savedOrg = localStorage.getItem('dagoo_driver_org');
  
  if (savedCode && savedOrg) {
    var codeSection = document.getElementById('codeSection');
    var savedCodeSection = document.getElementById('savedCodeSection');
    var savedCodeDisplay = document.getElementById('savedCodeDisplay');
    
    if (codeSection && savedCodeSection && savedCodeDisplay) {
      codeSection.style.display = 'none';
      savedCodeSection.style.display = 'block';
      savedCodeDisplay.textContent = savedCode;
    }
  }
}

// Afficher le champ code pour changer de chauffeur
function showCodeInput() {
  var codeSection = document.getElementById('codeSection');
  var savedCodeSection = document.getElementById('savedCodeSection');
  
  if (codeSection && savedCodeSection) {
    codeSection.style.display = 'block';
    savedCodeSection.style.display = 'none';
    document.getElementById('driverCode').focus();
  }
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', function() {
  checkSavedCode();
});

function selectDriverType(type) {
    selectedType = type;
    var btnFleet = document.getElementById('btnFleet');
    var btnCoop = document.getElementById('btnCoop');
    
    if (type === 'FLEET') {
        btnFleet.style.background = '#DAA520';
        btnFleet.style.color = '#1A1A2E';
        btnCoop.style.background = '#1E293B';
        btnCoop.style.color = '#DAA520';
    } else {
        btnCoop.style.background = '#DAA520';
        btnCoop.style.color = '#1A1A2E';
        btnFleet.style.background = '#1E293B';
        btnFleet.style.color = '#DAA520';
    }
    
    localStorage.setItem('dagoo_driver_type', type);
}

document.addEventListener('DOMContentLoaded', function() {
  var loginBtn = document.getElementById('loginBtn');
  var codeInput = document.getElementById('driverCode');

  if (loginBtn) {
    loginBtn.addEventListener('click', login);
  }

  // PIN : écouter les inputs individuels dans #pinInputs
  var pinInputs = document.querySelectorAll('#pinInputs input');
  pinInputs.forEach(function(input) {
    input.addEventListener('keyup', function(e) {
      if (e.key === 'Enter') login();
      // Auto-focus vers le prochain input
      if (input.value.length === 1 && input.nextElementSibling) {
        input.nextElementSibling.focus();
      }
    });
  });
});

async function waitForConfig() {
  return new Promise((resolve) => {
    if (window.DAGOOS_CONFIG && window.DAGOOS_CONFIG.apiUrl) {
      resolve();
      return;
    }
    var attempts = 0;
    var maxAttempts = 20;
    var interval = setInterval(function() {
      attempts++;
      if (window.DAGOOS_CONFIG && window.DAGOOS_CONFIG.apiUrl) {
        clearInterval(interval);
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        resolve();
      }
    }, 250);
  });
}

async function login() {
  var codeInput = document.getElementById('driverCode');
  var loginBtn = document.getElementById('loginBtn');

  // Lire le PIN depuis les inputs individuels
  var pinInputs = document.querySelectorAll('#pinInputs input');
  var pin = '';
  pinInputs.forEach(function(input) {
    pin += input.value;
  });
  
  // Nettoyer : ne garder que les chiffres
  pin = pin.replace(/\D/g, '');
  
  // Si le PIN est incomplet, vérifier si un input contient plusieurs chiffres
  if (pin.length < 4) {
    pinInputs.forEach(function(input) {
      if (input.value.length > 1) {
        pin = input.value.replace(/\D/g, '');
      }
    });
  }

  var code = codeInput ? codeInput.value.trim() : '';
  
  // Si le champ code est masqué, utiliser le code mémorisé
  if (!code) {
    code = localStorage.getItem('dagoo_driver_code') || '';
  }

  if (!code) {
    alert('Veuillez saisir votre code chauffeur.');
    showCodeInput();
    return;
  }
  
  if (pin.length < 4) {
    alert('Veuillez saisir votre code PIN (4 chiffres).');
    return;
  }

  try {
    await waitForConfig();
    API_URL = DAGOOS_CONFIG.apiUrl;
    loginBtn.disabled = true;
    loginBtn.textContent = 'Connexion en cours...';

    var response = await fetch(API_URL + '/auth/driver-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code, pin: pin })
    });

    var data = await response.json();

    if (response.ok && data.token) {
      localStorage.removeItem('dagoo_driver_token');
      localStorage.removeItem('dagoos_user');
      localStorage.setItem('dagoo_driver_token', data.token);
      localStorage.setItem('dagoo_driver_user', JSON.stringify(data.user));
      localStorage.setItem('dagoo_driver_type', selectedType);
      localStorage.setItem('dagoo_driver_code', code);
      localStorage.setItem('dagoo_driver_org', data.user.organization || '');
      window.location.href = '/dashboard';
    } else {
      alert(data.error || data.message || 'Identifiants invalides');
      loginBtn.disabled = false;
      loginBtn.textContent = 'Se connecter';
    }
  } catch (err) {
    console.error('Erreur connexion:', err);
    alert('Erreur de connexion avec le serveur backend.');
    loginBtn.disabled = false;
    loginBtn.textContent = 'Se connecter';
  }
}
