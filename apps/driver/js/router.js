var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
var token = localStorage.getItem('dagoos_token');
if (!token || user.role !== 'DRIVER') { window.location.href = 'index.html'; }

function apiGet(e) { return fetch('https://dagoos-api.onrender.com/api'+e,{headers:{Authorization:'Bearer '+token}}).then(function(r){return r.json()}); }
function apiPost(e,d) { return fetch('https://dagoos-api.onrender.com/api'+e,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(d)}).then(function(r){return r.json()}); }

function logout() { localStorage.clear(); window.location.href = 'https://dago-mobility.pages.dev'; }

var currentPage = 'home';

function loadPage(page) {
    currentPage = page;
    var main = document.getElementById('mainContent');
    var script = document.createElement('script');
    script.src = 'pages/' + page + '.js';
    script.onload = function() {
        if (typeof window['init_' + page] === 'function') window['init_' + page]();
    };
    main.innerHTML = '<p style="text-align:center;padding:40px;color:#94A3B8;">Chargement...</p>';
    document.body.appendChild(script);
    
    // Mettre à jour la bottom nav
    document.querySelectorAll('.bottom-nav button').forEach(function(b) { b.classList.remove('active'); });
    var activeBtn = document.querySelector('.bottom-nav button[data-page="' + page + '"]');
    if (activeBtn) activeBtn.classList.add('active');
}

loadPage('home');
// force deploy v3
