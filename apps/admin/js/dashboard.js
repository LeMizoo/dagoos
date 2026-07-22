// ========================================
// DAGO ADMIN - DASHBOARD v2
// ========================================

const API_URL = 'https://dagoos-api.onrender.com/api';
const LANDING_URL = 'https://dago-mobility.pages.dev';
const LOGIN_URL = 'index.html';

let currentPage = 'dashboard';
let refreshInterval;

// ===== AUTH =====
const token = localStorage.getItem('dagoos_token');
const user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');

if (!token || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    window.location.href = LOGIN_URL;
}

document.getElementById('sidebarUser').textContent = '👋 ' + (user.name || user.email);

function logout() {
    localStorage.clear();
    window.location.href = LANDING_URL;
}

// ===== NAVIGATION =====
document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        currentPage = link.dataset.page;
        loadPage(currentPage);
    });
});

// ===== CHARGER PAGE =====
async function loadPage(page) {
    if (refreshInterval) clearInterval(refreshInterval);
    const main = document.getElementById('mainContent');
    
    switch(page) {
        case 'dashboard':
            main.innerHTML = getDashboardHTML();
            await loadDashboardStats();
            refreshInterval = setInterval(loadDashboardStats, 30000);
            break;
        case 'fleets':
            main.innerHTML = getFleetsHTML();
            await loadFleets();
            break;
        case 'coops':
            main.innerHTML = getCoopsHTML();
            await loadCoops();
            break;
        case 'payments':
            main.innerHTML = getPaymentsHTML();
            break;
        case 'settings':
            main.innerHTML = getSettingsHTML();
            await loadUsers();
            break;
    }
}

// ===== DASHBOARD HTML =====
function getDashboardHTML() {
    return `
        <div class="topbar">
            <div>
                <h1><i class="fas fa-chart-line" style="color:#F1C40F;"></i> Tableau de bord</h1>
                <p style="color:#6C757D;font-size:13px;margin-top:4px;" id="currentDate"></p>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
                <span id="apiStatus" style="font-size:12px;padding:4px 10px;border-radius:50px;"></span>
                <button onclick="loadDashboardStats()" style="padding:8px;background:#F1F5F9;border:none;border-radius:8px;cursor:pointer;" title="Rafraîchir">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <span style="font-size:11px;color:#AAA;" id="lastRefresh"></span>
            </div>
        </div>
        <div class="stats-grid" id="statsGrid">
            <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-dollar-sign"></i></div><div class="stat-info"><div class="stat-number" id="revenus">—</div><div class="stat-label">Revenus aujourd'hui</div></div></div>
            <div class="stat-card"><div class="stat-icon green"><i class="fas fa-shopping-cart"></i></div><div class="stat-info"><div class="stat-number" id="courses">—</div><div class="stat-label">Courses aujourd'hui</div></div></div>
            <div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-users"></i></div><div class="stat-info"><div class="stat-number" id="drivers">—</div><div class="stat-label">Chauffeurs</div></div></div>
            <div class="stat-card"><div class="stat-icon red"><i class="fas fa-building"></i></div><div class="stat-info"><div class="stat-number" id="orgs">—</div><div class="stat-label">Flottes & Coops</div></div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;" class="dashboard-grid">
            <div class="card">
                <div class="card-header"><h3><i class="fas fa-clock"></i> Activités récentes</h3></div>
                <div style="padding:0 24px 16px;max-height:300px;overflow-y:auto;" id="recentActivities">
                    <p style="text-align:center;color:#6C757D;padding:20px;">Chargement...</p>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h3><i class="fas fa-map-marker-alt"></i> Dernières inscriptions</h3></div>
                <div style="padding:0 24px 16px;max-height:300px;overflow-y:auto;" id="recentUsers">
                    <p style="text-align:center;color:#6C757D;padding:20px;">Chargement...</p>
                </div>
            </div>
        </div>
        <div style="text-align:center;padding:16px;color:#AAA;font-size:11px;">
            Dashboard v2.0 · Auto-refresh 30s · <span id="footerDate"></span>
        </div>
    `;
}

// ===== LOAD DASHBOARD STATS =====
async function loadDashboardStats() {
    const now = new Date();
    document.getElementById('currentDate') && (document.getElementById('currentDate').textContent = now.toLocaleDateString('fr', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    document.getElementById('lastRefresh') && (document.getElementById('lastRefresh').textContent = 'Mis à jour à ' + now.toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' }));
    document.getElementById('footerDate') && (document.getElementById('footerDate').textContent = now.toLocaleString('fr'));

    try {
        const [usersRes, orgsRes, driversRes] = await Promise.all([
            fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/organizations`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/drivers`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        const users = usersRes.ok ? await usersRes.json() : [];
        const orgs = orgsRes.ok ? await orgsRes.json() : [];
        const drivers = driversRes.ok ? await driversRes.json() : [];
        
        // Stats
        const fleets = orgs.filter(o => o.type === 'FLEET_MANAGER').length;
        const coops = orgs.filter(o => o.type === 'COOPERATIVE').length;
        
        if (document.getElementById('revenus')) document.getElementById('revenus').textContent = '0 Ar';
        if (document.getElementById('courses')) document.getElementById('courses').textContent = '0';
        if (document.getElementById('drivers')) document.getElementById('drivers').textContent = drivers.length;
        if (document.getElementById('orgs')) document.getElementById('orgs').textContent = `${fleets} / ${coops}`;
        
        // Sidebar counts
        document.getElementById('fleetCount').textContent = fleets;
        document.getElementById('coopCount').textContent = coops;
        
        // Recent users
        if (document.getElementById('recentUsers')) {
            const recent = users.slice(-8).reverse();
            document.getElementById('recentUsers').innerHTML = recent.length ? recent.map(u => `
                <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #F1F5F9;">
                    <div style="width:36px;height:36px;border-radius:50%;background:#DBEAFE;color:#1A5276;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;">${(u.name || '?')[0].toUpperCase()}</div>
                    <div style="flex:1;"><strong style="font-size:14px;">${u.name || 'N/A'}</strong><br><span style="font-size:12px;color:#6C757D;">${u.role} · ${new Date(u.createdAt).toLocaleDateString('fr')}</span></div>
                </div>
            `).join('') : '<p style="text-align:center;color:#6C757D;padding:20px;">Aucune inscription</p>';
        }
        
        // Recent activities (simulé pour l'instant)
        if (document.getElementById('recentActivities')) {
            document.getElementById('recentActivities').innerHTML = drivers.slice(0, 5).map(d => `
                <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #F1F5F9;">
                    <div style="font-size:18px;">🛵</div>
                    <div style="flex:1;"><strong style="font-size:14px;">${d.user?.name || d.driverCode}</strong><br><span style="font-size:12px;color:#6C757D;">${d.organization?.name || 'N/A'} · ${d.status === 'active' ? '🟢 Actif' : '🔴 Inactif'}</span></div>
                </div>
            `).join('') || '<p style="text-align:center;color:#6C757D;padding:20px;">Aucune activité</p>';
        }
        
        // API Status
        if (document.getElementById('apiStatus')) {
            document.getElementById('apiStatus').innerHTML = '🟢 API Online';
            document.getElementById('apiStatus').style.background = '#D1FAE5';
            document.getElementById('apiStatus').style.color = '#065F46';
        }
    } catch (e) {
        console.error('Erreur dashboard:', e);
        if (document.getElementById('apiStatus')) {
            document.getElementById('apiStatus').innerHTML = '🔴 API Offline';
            document.getElementById('apiStatus').style.background = '#FEE2E2';
            document.getElementById('apiStatus').style.color = '#991B1B';
        }
    }
}

// ===== FLOTTES =====
function getFleetsHTML() {
    return `
        <div class="topbar"><h1><i class="fas fa-truck"></i> Flottes</h1></div>
        <div class="card"><div class="card-header"><h3>Toutes les flottes</h3></div>
            <table><thead><tr><th>Nom</th><th>Code</th><th>Email</th><th>Chauffeurs</th><th>Plan</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody id="fleetsTable"><tr><td colspan="7" style="text-align:center;color:#6C757D;">Chargement...</td></tr></tbody></table>
        </div>`;
}

async function loadFleets() {
    try {
        const [orgsRes, driversRes] = await Promise.all([
            fetch(`${API_URL}/organizations`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/drivers`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const orgs = orgsRes.ok ? await orgsRes.json() : [];
        const drivers = driversRes.ok ? await driversRes.json() : [];
        const fleets = orgs.filter(o => o.type === 'FLEET_MANAGER');
        
        document.getElementById('fleetsTable').innerHTML = fleets.length ? fleets.map(f => {
            const driverCount = drivers.filter(d => d.organization?.code === f.code).length;
            return `<tr>
                <td><strong>${f.name}</strong></td><td><code>FL-${f.code}</code></td><td>${f.email || 'N/A'}</td>
                <td>${driverCount}</td>
                <td><span class="badge badge-info">Gratuit</span></td>
                <td><span class="badge badge-success">Actif</span></td>
                <td class="action-btns">
                    <button class="btn-view" title="Voir"><i class="fas fa-eye"></i></button>
                    <button class="btn-edit" title="Modifier"><i class="fas fa-edit"></i></button>
                    <button class="btn-suspend" title="Suspendre"><i class="fas fa-ban"></i></button>
                </td>
            </tr>`;
        }).join('') : '<tr><td colspan="7" style="text-align:center;color:#6C757D;">Aucune flotte</td></tr>';
    } catch (e) { console.error(e); }
}

// ===== COOPÉRATIVES =====
function getCoopsHTML() {
    return `
        <div class="topbar"><h1><i class="fas fa-building"></i> Coopératives</h1></div>
        <div class="card"><div class="card-header"><h3>Toutes les coopératives</h3></div>
            <table><thead><tr><th>Nom</th><th>Code</th><th>Email</th><th>Chauffeurs</th><th>Plan</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody id="coopsTable"><tr><td colspan="7" style="text-align:center;color:#6C757D;">Chargement...</td></tr></tbody></table>
        </div>`;
}

async function loadCoops() {
    try {
        const [orgsRes, driversRes] = await Promise.all([
            fetch(`${API_URL}/organizations`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/drivers`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const orgs = orgsRes.ok ? await orgsRes.json() : [];
        const drivers = driversRes.ok ? await driversRes.json() : [];
        const coops = orgs.filter(o => o.type === 'COOPERATIVE');
        
        document.getElementById('coopsTable').innerHTML = coops.length ? coops.map(c => {
            const driverCount = drivers.filter(d => d.organization?.code === c.code).length;
            return `<tr>
                <td><strong>${c.name}</strong></td><td><code>CO-${c.code}</code></td><td>${c.email || 'N/A'}</td>
                <td>${driverCount}</td>
                <td><span class="badge badge-info">Gratuit</span></td>
                <td><span class="badge badge-success">Actif</span></td>
                <td class="action-btns">
                    <button class="btn-view" title="Voir"><i class="fas fa-eye"></i></button>
                    <button class="btn-edit" title="Modifier"><i class="fas fa-edit"></i></button>
                    <button class="btn-suspend" title="Suspendre"><i class="fas fa-ban"></i></button>
                </td>
            </tr>`;
        }).join('') : '<tr><td colspan="7" style="text-align:center;color:#6C757D;">Aucune coopérative</td></tr>';
    } catch (e) { console.error(e); }
}

// ===== PAIEMENTS =====
function getPaymentsHTML() {
    return `
        <div class="topbar"><h1><i class="fas fa-credit-card"></i> Paiements</h1></div>
        <div class="card" style="text-align:center;padding:60px;">
            <i class="fas fa-credit-card" style="font-size:48px;color:#CCC;margin-bottom:16px;"></i>
            <h3 style="color:#6C757D;">Module de paiement</h3><p style="color:#AAA;">Bientôt disponible</p>
        </div>`;
}

// ===== PARAMÈTRES =====
function getSettingsHTML() {
    return `
        <div class="topbar"><h1><i class="fas fa-cog"></i> Paramètres</h1></div>
        <div class="card"><div class="card-header"><h3><i class="fas fa-users"></i> Utilisateurs</h3></div>
            <table><thead><tr><th>Nom</th><th>Email</th><th>Téléphone</th><th>Rôle</th><th>Date</th></tr></thead>
            <tbody id="usersTable"><tr><td colspan="5" style="text-align:center;color:#6C757D;">Chargement...</td></tr></tbody></table>
        </div>
        <div class="card" style="margin-top:24px;"><div class="card-header"><h3><i class="fas fa-tags"></i> Plans et tarifs</h3></div>
            <div style="padding:24px;text-align:center;color:#6C757D;"><p>Configuration des plans — Bientôt disponible</p></div>
        </div>`;
}

async function loadUsers() {
    try {
        const res = await fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        const users = res.ok ? await res.json() : [];
        document.getElementById('usersTable').innerHTML = users.length ? users.map(u => `
            <tr><td><strong>${u.name || 'N/A'}</strong></td><td>${u.email}</td><td>${u.phone || 'N/A'}</td>
            <td><span class="badge badge-info">${u.role}</span></td><td>${new Date(u.createdAt).toLocaleDateString('fr-FR')}</td></tr>
        `).join('') : '<tr><td colspan="5" style="text-align:center;color:#6C757D;">Aucun utilisateur</td></tr>';
    } catch (e) { console.error(e); }
}

// ===== INIT =====
loadPage('dashboard');
