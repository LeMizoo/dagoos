var API_URL = DAGOOS_CONFIG.apiUrl;

document.addEventListener('DOMContentLoaded', function() {
  var loginBtn = document.getElementById('loginBtn');
  var codeInput = document.getElementById('codeInput');
  var pinInput = document.getElementById('pinInput');

  if (loginBtn) {
    loginBtn.addEventListener('click', login);
  }
  if (pinInput) {
    pinInput.addEventListener('keyup', function(e) {
      if (e.key === 'Enter') login();
    });
  }
});

async function login() {
  var codeInput = document.getElementById('codeInput');
  var pinInput = document.getElementById('pinInput');
  var loginBtn = document.getElementById('loginBtn');

  var code = codeInput ? codeInput.value.trim() : '';
  var pin = pinInput ? pinInput.value.trim() : '';

  if (!code || !pin) {
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
      window.location.href = '/dashboard.html';
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
