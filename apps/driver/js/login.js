// DAGOO'S DRIVER - LOGIN SIMPLIFIÉ
var API_URL = DAGOOS_CONFIG.apiUrl;

document.addEventListener('DOMContentLoaded', function() {
  var codeInput = document.getElementById('driverCode');
  var pinInputs = document.querySelectorAll('#pinInputs input');
  var loginBtn = document.getElementById('loginBtn');
  var messageDiv = document.getElementById('message');

  if (!codeInput || !loginBtn) {
    console.error('Éléments du formulaire introuvables');
    return;
  }

  // Gestion des inputs PIN
  pinInputs.forEach(function(input, index) {
    input.addEventListener('input', function(e) {
      if (e.target.value.length === 1 && index < pinInputs.length - 1) {
        pinInputs[index + 1].focus();
      }
    });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        pinInputs[index - 1].focus();
      }
    });
  });

  // Focus sur le code au chargement
  codeInput.focus();

  // Login au clic
  loginBtn.addEventListener('click', login);

  // Login avec Entrée
  codeInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') login();
  });

  async function login() {
    var code = codeInput.value.trim().toUpperCase();
    var pin = Array.from(pinInputs).map(function(i) { return i.value; }).join('');

    if (!code) { showMessage('Veuillez entrer votre code chauffeur', 'error'); return; }
    if (pin.length !== 4) { showMessage('Veuillez entrer votre PIN à 4 chiffres', 'error'); return; }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Connexion...';

    try {
      var response = await fetch(API_URL + '/auth/driver-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code, pin: pin }),
      });
      var data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('dagoos_token', data.token);
        localStorage.setItem('dagoos_user', JSON.stringify(data.user));
        showMessage('✅ Bienvenue ' + (data.user.name || code) + ' !', 'success');
        setTimeout(function() { window.location.replace('dashboard.html'); }, 800);
      } else {
        showMessage('❌ ' + (data.error || 'Code ou PIN incorrect'), 'error');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Se connecter';
      }
    } catch (error) {
      showMessage('❌ Erreur de connexion au serveur', 'error');
      loginBtn.disabled = false;
      loginBtn.textContent = 'Se connecter';
    }
  }

  function showMessage(msg, type) {
    messageDiv.textContent = msg;
    messageDiv.className = 'message ' + (type || '');
    messageDiv.style.display = 'block';
  }
});
