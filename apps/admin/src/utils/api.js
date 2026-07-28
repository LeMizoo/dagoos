// DAGOO'S - Utilitaires API
const API_URL = DAGOOS_CONFIG.apiUrl;
const token = localStorage.getItem('dagoos_token');

async function apiGet(endpoint) {
  const res = await fetch(API_URL + endpoint, {
    headers: { Authorization: 'Bearer ' + token }
  });
  return res.json();
}

async function apiPost(endpoint, data) {
  const res = await fetch(API_URL + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function apiPut(endpoint, data) {
  const res = await fetch(API_URL + endpoint, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function apiPatch(endpoint, data) {
  const res = await fetch(API_URL + endpoint, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify(data)
  });
  return res.json();
}
