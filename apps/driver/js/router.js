function getAuthHeaders() {
  var token = localStorage.getItem('dagoo_driver_token');
  var headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  return headers;
}

async function apiFetch(endpoint, options) {
  options = options || {};
  var url = DAGOOS_CONFIG.apiUrl + endpoint;
  
  var config = {
    method: options.method || 'GET',
    headers: getAuthHeaders()
  };

  if (options.body) {
    config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  try {
    var response = await fetch(url, config);
    
    if (response.status === 401) {
      localStorage.removeItem('dagoo_driver_token');
      localStorage.removeItem('dagoo_driver_user');
      window.location.href = '/index.html';
      return null;
    }

    var contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch (err) {
    console.error('Erreur API (' + endpoint + '):', err);
    throw err;
  }
}
