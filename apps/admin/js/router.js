// ========================================
// DAGO ADMIN - ROUTER
// ========================================

var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
if (!localStorage.getItem('dagoos_token') || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    window.location.href = 'index.html';
}

document.getElementById('sidebarUser').textContent = '👑 ' + (user.name || user.email);
document.getElementById('sidebarAvatar').textContent = (user.name || 'A')[0].toUpperCase();

function logout() { localStorage.clear(); window.location.href = 'https://dago-mobility.pages.dev'; }

function setTheme(t) {
    document.body.classList.remove('dark');
    document.querySelectorAll('.sidebar-footer .theme-btns button').forEach(function(b) { b.classList.remove('active'); });
    if (t === 'dark') { document.body.classList.add('dark'); document.getElementById('theme-dark').classList.add('active'); }
    else if (t === 'light') { document.getElementById('theme-light').classList.add('active'); }
    else { document.getElementById('theme-system').classList.add('active'); }
    localStorage.setItem('dago_theme', t);
}

function loadPage(page) {
    var main = document.getElementById('mainInner');
    var script = document.createElement('script');
    script.src = 'pages/' + page + '.js';
    script.onload = function() {
        if (typeof window['init_' + page] === 'function') {
            window['init_' + page]();
        }
    };
    document.querySelectorAll('.sidebar-nav a[data-page]').forEach(function(l) { l.classList.remove('active'); });
    var link = document.querySelector('[data-page="' + page + '"]');
    if (link) link.classList.add('active');
    
    // Nettoyer l'ancien script de page
    var oldScript = document.querySelector('script[data-page]');
    if (oldScript) oldScript.remove();
    script.setAttribute('data-page', page);
    main.innerHTML = '<p style="text-align:center;padding:40px;">Chargement...</p>';
    document.body.appendChild(script);
}

document.querySelectorAll('.sidebar-nav a[data-page]').forEach(function(link) {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        loadPage(link.dataset.page);
    });
});

loadPage('home');
