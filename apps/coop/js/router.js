var user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
if (!localStorage.getItem('dagoos_token') || user.role !== 'COOPERATIVE') { window.location.href = 'index.html'; }

document.getElementById('sidebarUser').textContent = '🏢 ' + (user.name || user.email);

function logout() { localStorage.clear(); window.location.href = 'index.html'; }

function loadPage(page) {
    var main = document.getElementById('mainContent');
    var script = document.createElement('script');
    script.src = 'pages/' + page + '.js';
    script.onload = function() {
        if (typeof window['init_' + page] === 'function') window['init_' + page]();
    };
    document.querySelectorAll('.sidebar-nav a[data-page]').forEach(function(l) { l.classList.remove('active'); });
    var link = document.querySelector('[data-page="' + page + '"]');
    if (link) link.classList.add('active');
    var oldScript = document.querySelector('script[data-page]');
    if (oldScript) oldScript.remove();
    script.setAttribute('data-page', page);
    main.innerHTML = '<p style="text-align:center;padding:40px;">Chargement...</p>';
    document.body.appendChild(script);
}

document.querySelectorAll('.sidebar-nav a[data-page]').forEach(function(link) {
    link.addEventListener('click', function(e) { e.preventDefault(); loadPage(link.dataset.page); });
});

loadPage('home');
