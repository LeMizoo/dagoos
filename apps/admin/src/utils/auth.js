// DAGOO'S - Authentification
function checkAuth() {
  const token = localStorage.getItem('dagoos_token');
  const user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
  if (!token || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    window.location.replace('index.html');
    return null;
  }
  return user;
}

function logout() {
  localStorage.clear();
  window.location.replace(DAGOOS_CONFIG.landingUrl);
}
