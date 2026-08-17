var API_URL = DAGOOS_CONFIG.apiUrl;

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

async function login() {
  var codeInput = document.getElementById('driverCode');
  var loginBtn = document.getElementById('loginBtn');

  // Lire le PIN depuis les inputs individuels
  var pinInputs = document.querySelectorAll('#pinInputs input');
  var pin = '';
  pinInputs.forEach(function(input) {
    pin += input.value;
  });

  var code = codeInput ? codeInput.value.trim() : '';

  if (!code || pin.length < 4) {
    alert('Veuillez saisir votre code chauffeur et votre code PIN.');
    return;
  }

  try {
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
