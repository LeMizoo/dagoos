async function apiFetch(endpoint, options) {
  options = options || {};

  var url = DAGOOS_CONFIG.apiUrl + endpoint;
  var timeoutMs = options.timeout || 30000;
  var maxAttempts = options.retry === false ? 1 : 2;
  var attempt = 0;

  while (attempt < maxAttempts) {
    attempt++;

    var controller = new AbortController();

    var timeout = setTimeout(function() {
      controller.abort();
    }, timeoutMs);

    var config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      signal: controller.signal
    };

    if (options.body !== undefined) {
      config.body = typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body);
    }

    try {
      var response = await fetch(url, config);
      var contentType = response.headers.get('content-type') || '';
      var data;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        var message = 'Erreur HTTP ' + response.status;

        if (data && typeof data === 'object' && data.error) {
          message = data.error;
        }

        var apiError = new Error(message);
        apiError.status = response.status;
        apiError.data = data;
        apiError.endpoint = endpoint;

        throw apiError;
      }

      return data;
    } catch (err) {
      if (err && err.name === 'AbortError') {
        if (attempt < maxAttempts) {
          console.warn(
            'Timeout API (' + endpoint + ') après ' +
            Math.round(timeoutMs / 1000) +
            ' secondes. Nouvelle tentative...'
          );

          await new Promise(function(resolve) {
            setTimeout(resolve, 500);
          });

          continue;
        }

        var timeoutError = new Error(
          'La requête API a expiré après ' +
          Math.round(timeoutMs / 1000) +
          ' secondes et une nouvelle tentative.'
        );

        timeoutError.code = 'API_TIMEOUT';
        timeoutError.endpoint = endpoint;
        timeoutError.isTimeout = true;

        console.error(
          'Timeout API définitif (' + endpoint + '):',
          timeoutError
        );

        throw timeoutError;
      }

      console.error('Erreur API (' + endpoint + '):', err);
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}

window.apiGet = function(endpoint, options) {
  return apiFetch(endpoint, options);
};

window.apiPost = function(endpoint, body, options) {
  options = options || {};
  options.method = 'POST';
  options.body = body;

  return apiFetch(endpoint, options);
};

window.apiGetSafe = async function(endpoint, fallback, options) {
  try {
    return await apiGet(endpoint, options);
  } catch (err) {
    var kind = err && err.isTimeout ? 'timeout' : 'erreur';

    console.warn(
      '[apiSafe] ' + endpoint +
      ' indisponible (' + kind + '):',
      err && err.message ? err.message : err
    );

    return fallback;
  }
};

window.apiPostSafe = async function(endpoint, body, fallback, options) {
  try {
    return await apiPost(endpoint, body, options);
  } catch (err) {
    var kind = err && err.isTimeout ? 'timeout' : 'erreur';

    console.warn(
      '[apiSafe] ' + endpoint +
      ' indisponible (' + kind + '):',
      err && err.message ? err.message : err
    );

    return fallback;
  }
};
