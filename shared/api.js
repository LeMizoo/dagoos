// ========================================
// DAGO - API SHARED
// ========================================
var API_URL = 'https://dagoos-api.onrender.com/api';

function apiGet(endpoint) {
    var token = localStorage.getItem('dagoos_token');
    return fetch(API_URL + endpoint, {
        headers: { Authorization: 'Bearer ' + token }
    }).then(function(r) {
        if (r.status === 401) { localStorage.clear(); window.location.href = 'index.html'; }
        return r.json();
    });
}

function apiPost(endpoint, data) {
    var token = localStorage.getItem('dagoos_token');
    return fetch(API_URL + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(data)
    }).then(function(r) { return r.json(); });
}

function apiPut(endpoint, data) {
    var token = localStorage.getItem('dagoos_token');
    return fetch(API_URL + endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(data)
    }).then(function(r) { return r.json(); });
}

function apiPatch(endpoint, data) {
    var token = localStorage.getItem('dagoos_token');
    return fetch(API_URL + endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(data)
    }).then(function(r) { return r.json(); });
}
