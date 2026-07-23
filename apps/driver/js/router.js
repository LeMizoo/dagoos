var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
if (!localStorage.getItem('dagoos_token') || user.role !== 'DRIVER') { window.location.href = 'index.html'; }

function logout() { localStorage.clear(); window.location.href = 'https://dago-mobility.pages.dev'; }

function loadPage(page) {
    var main = document.getElementById('mainContent');
    var script = document.createElement('script');
    script.src = 'pages/' + page + '.js';
    script.onload = function() {
        if (typeof window['init_' + page] === 'function') window['init_' + page]();
    };
    var oldScript = document.querySelector('script[data-page]');
    if (oldScript) oldScript.remove();
    script.setAttribute('data-page', page);
    document.body.appendChild(script);
}

loadPage('home');
