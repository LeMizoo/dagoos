// ========================================
// DAGO ADMIN - DASHBOARD
// ========================================

const API_URL = 'https://dagoos-api.onrender.com/api';
const LANDING_URL = 'https://dago-mobility.pages.dev';
const LOGIN_URL = 'index.html';

let currentPage = 'dashboard';

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
    const main = document.getElementById('mainContent');
    
    switch(page) {
        case 'dashboard':
            main.innerHTML = await getDashboardHTML();
            loadDashboardStats();
            break;
        case 'fleets':
            main.innerHTML = await getFleetsHTML();
            loadFleets();
            break;
        case 'coops':
            main.innerHTML = await getCoopsHTML();
            loadCoops();
            break;
        case 'payments':
            main.innerHTML = getPaymentsHTML();
            break;
        case 'settings':
            main.innerHTML = await getSettingsHTML();
            loadUsers();
            break;
    }
}

// ===== DASHBOARD =====
async function getDashboardHTML() {
    return `
        <div class="topbar">
            <h1><i class="fas fa-chart-line" style="color:#F1C40F;"></i> Tableau de bord</h1>
            <div class="user-info">
                <span>${user.name || user.email}</span>
                <div class="user-avatar">${(user.name || 'A')[0].toUpperCase()}</div>
            </div>
        </div>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue"><i class="fas fa-users"></i></div>
                <div class="stat-info"><div class="stat-number" id="totalUsers">0</div><div class="stat-label">Utilisateurs</div></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i class="fas fa-truck"></i></div>
                <div class="stat-info"><div class="stat-number" id="totalFleets">0</div><div class="stat-label">Flottes</div></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon yellow"><i class="fas fa-building"></i></div>
                <div class="stat-info"><div class="stat-number" id="totalCoops">0</div><div class="stat-label">Coopératives</div></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon red"><i class="fas fa-motorcycle"></i></div>
                <div class="stat-info"><div class="stat-number" id="totalDrivers">0</div><div class="stat-label">Chauffeurs</div></div>
            </div>
        </div>
        <div class="card">
            <div class="card-header"><h3><i class="fas fa-clock"></i> Dernières inscriptions</h3></div>
            <table>
                <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Date</th></tr></thead>
                <tbody id="recentUsers"><tr><td colspan="4" style="text-align:center;color:#6C757D;">Chargement...</td></tr></tbody>
            </table>
        </div>
    `;
}

async function loadDashboardStats() {
    try {
        const [usersRes, orgsRes, driversRes] = await Promise.all([
            fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/organizations`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/drivers`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        const users = usersRes.ok ? await usersRes.json() : [];
        const orgs = orgsRes.ok ? await orgsRes.json() : [];
        const drivers = driversRes.ok ? await driversRes.json() : [];
        
        document.getElementById('totalUsers').textContent = users.length;
        document.getElementById('totalFleets').textContent = orgs.filter(o => o.type === 'FLEET_MANAGER').length;
        document.getElementById('totalCoops').textContent = orgs.filter(o => o.type === 'COOPERATIVE').length;
        document.getElementById('totalDrivers').textContent = drivers.length;
        
        document.getElementById('fleetCount').textContent = orgs.filter(o => o.type === 'FLEET_MANAGER').length;
        document.getElementById('coopCount').textContent = orgs.filter(o => o.type === 'COOPERATIVE').length;
        
        const recent = users.slice(-5).reverse();
        document.getElementById('recentUsers').innerHTML = recent.map(u => `
            <tr>
                <td><strong>${u.name || 'N/A'}</strong></td>
                <td>${u.email}</td>
                <td><span class="badge badge-info">${u.role}</span></td>
                <td>${new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
            </tr>
        `).join('') || '<tr><td colspan="4" style="text-align:center;color:#6C757D;">Aucun utilisateur</td></tr>';
    } catch (e) {
        console.error(e);
    }
}

// ===== FLOTTES =====
async function getFleetsHTML() {
    return `
        <div class="topbar"><h1><i class="fas fa-truck"></i> Flottes</h1></div>
        <div class="card">
            <div class="card-header"><h3>Toutes les flottes</h3></div>
            <table>
                <thead><tr><th>Nom</th><th>Code</th><th>Email</th><th>Plan</th><th>Statut</th><th>Actions</th></tr></thead>
                <tbody id="fleetsTable"><tr><td colspan="6" style="text-align:center;color:#6C757D;">Chargement...</td></tr></tbody>
            </table>
        </div>
    `;
}

async function loadFleets() {
    try {
        const res = await fetch(`${API_URL}/organizations`, { headers: { 'Authorization': `Bearer ${token}` } });
        const orgs = res.ok ? await res.json() : [];
        const fleets = orgs.filter(o => o.type === 'FLEET_MANAGER');
        
        document.getElementById('fleetsTable').innerHTML = fleets.map(f => `
            <tr>
                <td><strong>${f.name}</strong></td>
                <td><code>${f.code}</code></td>
                <td>${f.email || 'N/A'}</td>
                <td><span class="badge badge-info">Gratuit</span></td>
                <td><span class="badge badge-success">Actif</span></td>
                <td class="action-btns">
                    <button class="btn-view"><i class="fas fa-eye"></i></button>
                    <button class="btn-edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-suspend"><i class="fas fa-ban"></i></button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="6" style="text-align:center;color:#6C757D;">Aucune flotte</td></tr>';
    } catch (e) { console.error(e); }
}

// ===== COOPÉRATIVES =====
async function getCoopsHTML() {
    return `
        <div class="topbar"><h1><i class="fas fa-building"></i> Coopératives</h1></div>
        <div class="card">
            <div class="card-header"><h3>Toutes les coopératives</h3></div>
            <table>
                <thead><tr><th>Nom</th><th>Code</th><th>Email</th><th>Plan</th><th>Statut</th><th>Actions</th></tr></thead>
                <tbody id="coopsTable"><tr><td colspan="6" style="text-align:center;color:#6C757D;">Chargement...</td></tr></tbody>
            </table>
        </div>
    `;
}

async function loadCoops() {
    try {
        const res = await fetch(`${API_URL}/organizations`, { headers: { 'Authorization': `Bearer ${token}` } });
        const orgs = res.ok ? await res.json() : [];
        const coops = orgs.filter(o => o.type === 'COOPERATIVE');
        
        document.getElementById('coopsTable').innerHTML = coops.map(c => `
            <tr>
                <td><strong>${c.name}</strong></td>
                <td><code>${c.code}</code></td>
                <td>${c.email || 'N/A'}</td>
                <td><span class="badge badge-info">Gratuit</span></td>
                <td><span class="badge badge-success">Actif</span></td>
                <td class="action-btns">
                    <button class="btn-view"><i class="fas fa-eye"></i></button>
                    <button class="btn-edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-suspend"><i class="fas fa-ban"></i></button>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="6" style="text-align:center;color:#6C757D;">Aucune coopérative</td></tr>';
    } catch (e) { console.error(e); }
}

// ===== PAIEMENTS =====
function getPaymentsHTML() {
    return `
        <div class="topbar"><h1><i class="fas fa-credit-card"></i> Paiements</h1></div>
        <div class="card" style="text-align:center;padding:60px;">
            <i class="fas fa-credit-card" style="font-size:48px;color:#CCC;margin-bottom:16px;"></i>
            <h3 style="color:#6C757D;">Module de paiement</h3>
            <p style="color:#AAA;">Bientôt disponible</p>
        </div>
    `;
}

// ===== PARAMÈTRES =====
async function getSettingsHTML() {
    return `
        <div class="topbar"><h1><i class="fas fa-cog"></i> Paramètres</h1></div>
        <div class="card">
            <div class="card-header"><h3><i class="fas fa-users"></i> Utilisateurs</h3></div>
            <table>
                <thead><tr><th>Nom</th><th>Email</th><th>Téléphone</th><th>Rôle</th><th>Date</th></tr></thead>
                <tbody id="usersTable"><tr><td colspan="5" style="text-align:center;color:#6C757D;">Chargement...</td></tr></tbody>
            </table>
        </div>
        <div class="card" style="margin-top:24px;">
            <div class="card-header"><h3><i class="fas fa-tags"></i> Plans et tarifs</h3></div>
            <div style="padding:24px; text-align:center; color:#6C757D;">
                <p>Configuration des plans pour Flottes et Coopératives — Bientôt disponible</p>
            </div>
        </div>
    `;
}

async function loadUsers() {
    try {
        const res = await fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } });
        const users = res.ok ? await res.json() : [];
        
        document.getElementById('usersTable').innerHTML = users.map(u => `
            <tr>
                <td><strong>${u.name || 'N/A'}</strong></td>
                <td>${u.email}</td>
                <td>${u.phone || 'N/A'}</td>
                <td><span class="badge badge-info">${u.role}</span></td>
                <td>${new Date(u.createdAt).toLocaleDateString('fr-FR')}</td>
            </tr>
        `).join('') || '<tr><td colspan="5" style="text-align:center;color:#6C757D;">Aucun utilisateur</td></tr>';
    } catch (e) { console.error(e); }
}

// ===== INIT =====
loadPage('dashboard');
