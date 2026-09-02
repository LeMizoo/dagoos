async function apiFetch(endpoint, options) {
  options = options || {};
  var url = DAGOOS_CONFIG.apiUrl + endpoint;
  var config = {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  };

  if (options.body !== undefined) {
    config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }

  try {
    var response = await fetch(url, config);
    var contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) return await response.json();
    return await response.text();
  } catch (err) {
    console.error('Erreur API (' + endpoint + '):', err);
    throw err;
  }
}

window.apiGet = function(endpoint) { return apiFetch(endpoint); };
window.apiPost = function(endpoint, body) {
  return apiFetch(endpoint, { method: 'POST', body: body });
};
