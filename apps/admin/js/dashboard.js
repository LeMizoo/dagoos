// ========================================
// DAGO ADMIN - DASHBOARD v3
// ========================================

const API_URL = 'https://dagoos-api.onrender.com/api';
const LANDING_URL = 'https://dago-mobility.pages.dev';
const LOGIN_URL = 'index.html';

let currentPage = 'dashboard';
let currentSettingsTab = 'FLOTTE';
let refreshInterval;

// ===== AUTH =====
const token = localStorage.getItem('dagoos_token');
const user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');

if (!token || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    window.location.href = LOGIN_URL;
}

document.getElementById('sidebarUser').textContent = '👑 ' + (user.name || user.email);

function logout() {
    localStorage.clear();
    window.location.href = LANDING_URL;
}

// ===== NAVIGATION =====
document.querySelectorAll('.sidebar-nav a[data-page]').forEach(link => {
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
        case 'drivers':
            main.innerHTML = getDriversHTML();
            await loadDrivers();
            break;
        case 'payments':
            main.innerHTML = getPaymentsHTML();
            break;
        case 'settings':
            main.innerHTML = getSettingsHTML();
            break;
    }
}

function switchSettingsTab(tab) {
    currentSettingsTab = tab;
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('plans-content').innerHTML = getPlansContent(tab);
}

// ===== DASHBOARD =====
function getDashboardHTML() {
    return `
        <div class="topbar">
            <div><h1>📊 Tableau de bord</h1><p style="color:#6C757D;font-size:13px;" id="currentDate"></p></div>
            <div style="display:flex;align-items:center;gap:12px;">
                <span id="apiStatus" style="font-size:12px;padding:4px 10px;border-radius:50px;"></span>
                <button onclick="loadDashboardStats()" style="padding:8px;background:#F1F5F9;border:none;border-radius:8px;cursor:pointer;"><i class="fas fa-sync-alt"></i></button>
                <span style="font-size:11px;color:#AAA;" id="lastRefresh"></span>
            </div>
        </div>
        <div class="stats-grid" id="statsGrid"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;" class="dashboard-grid">
            <div class="card"><div class="card-header"><h3>📝 Activités récentes</h3></div><div style="padding:0 24px 16px;max-height:300px;overflow-y:auto;" id="recentActivities"></div></div>
            <div class="card"><div class="card-header"><h3>📍 Dernières inscriptions</h3></div><div style="padding:0 24px 16px;max-height:300px;overflow-y:auto;" id="recentUsers"></div></div>
        </div>
    `;
}

async function loadDashboardStats() {
    const now = new Date();
    const el = id => document.getElementById(id);
    if (el('currentDate')) el('currentDate').textContent = now.toLocaleDateString('fr', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (el('lastRefresh')) el('lastRefresh').textContent = 'Mis à jour à ' + now.toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' });

    try {
        const [usersRes, orgsRes, driversRes] = await Promise.all([
            fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/organizations`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/drivers`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const users = usersRes.ok ? await usersRes.json() : [];
        const orgs = orgsRes.ok ? await orgsRes.json() : [];
        const drivers = driversRes.ok ? await driversRes.json() : [];
        
        const fleets = orgs.filter(o => o.type === 'FLEET_MANAGER').length;
        const coops = orgs.filter(o => o.type === 'COOPERATIVE').length;
        
        if (el('statsGrid')) el('statsGrid').innerHTML = `
            <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-dollar-sign"></i></div><div class="stat-info"><div class="stat-number">0 Ar</div><div class="stat-label">Revenus aujourd'hui</div></div></div>
            <div class="stat-card"><div class="stat-icon green"><i class="fas fa-shopping-cart"></i></div><div class="stat-info"><div class="stat-number">0</div><div class="stat-label">Courses aujourd'hui</div></div></div>
            <div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-users"></i></div><div class="stat-info"><div class="stat-number">${drivers.length}</div><div class="stat-label">Chauffeurs</div></div></div>
            <div class="stat-card"><div class="stat-icon red"><i class="fas fa-building"></i></div><div class="stat-info"><div class="stat-number">${fleets} / ${coops}</div><div class="stat-label">Flottes & Coops</div></div></div>
        `;
        
        if (el('fleetCount')) el('fleetCount').textContent = fleets;
        if (el('coopCount')) el('coopCount').textContent = coops;
        if (el('driverCount')) el('driverCount').textContent = drivers.length;
        
        if (el('recentUsers')) el('recentUsers').innerHTML = users.slice(-6).reverse().map(u => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #F1F5F9;">
                <div style="width:36px;height:36px;border-radius:50%;background:#DBEAFE;color:#1A5276;display:flex;align-items:center;justify-content:center;font-weight:600;">${(u.name || '?')[0].toUpperCase()}</div>
                <div><strong>${u.name || 'N/A'}</strong><br><span style="font-size:12px;color:#6C757D;">${u.role} · ${new Date(u.createdAt).toLocaleDateString('fr')}</span></div>
            </div>`).join('') || '<p style="text-align:center;color:#6C757D;padding:20px;">Aucune inscription</p>';
        
        if (el('recentActivities')) el('recentActivities').innerHTML = drivers.slice(0, 5).map(d => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #F1F5F9;">
                <div>🛵</div><div><strong>${d.user?.name || d.driverCode}</strong><br><span style="font-size:12px;color:#6C757D;">${d.organization?.name || 'N/A'} · ${d.status === 'active' ? '🟢 Actif' : '🔴 Inactif'}</span></div>
            </div>`).join('') || '<p style="text-align:center;color:#6C757D;padding:20px;">Aucune activité</p>';
        
        if (el('apiStatus')) { el('apiStatus').innerHTML = '🟢 API Online'; el('apiStatus').style.background = '#D1FAE5'; el('apiStatus').style.color = '#065F46'; }
    } catch (e) {
        if (el('apiStatus')) { el('apiStatus').innerHTML = '🔴 API Offline'; el('apiStatus').style.background = '#FEE2E2'; el('apiStatus').style.color = '#991B1B'; }
    }
}

// ===== FLOTTES =====
function getFleetsHTML() { return `<div class="topbar"><h1>🚛 Flottes</h1></div><div class="card"><div class="card-header"><h3>Toutes les flottes</h3></div><table><thead><tr><th>Nom</th><th>Code</th><th>Email</th><th>Chauffeurs</th><th>Plan</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="fleetsTable"></tbody></table></div>`; }
async function loadFleets() {
    const [orgsRes, driversRes] = await Promise.all([
        fetch(`${API_URL}/organizations`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/drivers`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    const orgs = orgsRes.ok ? await orgsRes.json() : [];
    const drivers = driversRes.ok ? await driversRes.json() : [];
    const fleets = orgs.filter(o => o.type === 'FLEET_MANAGER');
    document.getElementById('fleetsTable').innerHTML = fleets.length ? fleets.map(f => {
        const count = drivers.filter(d => d.organization?.code === f.code).length;
        return `<tr><td><strong>${f.name}</strong></td><td><code>FL-${f.code}</code></td><td>${f.email||'N/A'}</td><td>${count}</td><td><span class="badge badge-info">Freemium</span></td><td><span class="badge badge-success">Actif</span></td><td class="action-btns"><button class="btn-view"><i class="fas fa-eye"></i></button><button class="btn-edit"><i class="fas fa-edit"></i></button></td></tr>`;
    }).join('') : '<tr><td colspan="7" style="text-align:center;color:#6C757D;">Aucune flotte</td></tr>';
}

// ===== COOPS =====
function getCoopsHTML() { return `<div class="topbar"><h1>🏢 Coopératives</h1></div><div class="card"><div class="card-header"><h3>Toutes les coopératives</h3></div><table><thead><tr><th>Nom</th><th>Code</th><th>Email</th><th>Chauffeurs</th><th>Plan</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="coopsTable"></tbody></table></div>`; }
async function loadCoops() {
    const [orgsRes, driversRes] = await Promise.all([
        fetch(`${API_URL}/organizations`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/drivers`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);
    const orgs = orgsRes.ok ? await orgsRes.json() : [];
    const drivers = driversRes.ok ? await driversRes.json() : [];
    const coops = orgs.filter(o => o.type === 'COOPERATIVE');
    document.getElementById('coopsTable').innerHTML = coops.length ? coops.map(c => {
        const count = drivers.filter(d => d.organization?.code === c.code).length;
        return `<tr><td><strong>${c.name}</strong></td><td><code>CO-${c.code}</code></td><td>${c.email||'N/A'}</td><td>${count}</td><td><span class="badge badge-info">Freemium</span></td><td><span class="badge badge-success">Actif</span></td><td class="action-btns"><button class="btn-view"><i class="fas fa-eye"></i></button><button class="btn-edit"><i class="fas fa-edit"></i></button></td></tr>`;
    }).join('') : '<tr><td colspan="7" style="text-align:center;color:#6C757D;">Aucune coopérative</td></tr>';
}

// ===== DRIVERS =====
function getDriversHTML() { return `<div class="topbar"><h1>🛵 Chauffeurs</h1></div><div class="card"><div class="card-header"><h3>Tous les chauffeurs</h3></div><table><thead><tr><th>Code</th><th>Nom</th><th>Organisation</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="driversTable"></tbody></table></div>`; }
async function loadDrivers() {
    const res = await fetch(`${API_URL}/drivers`, { headers: { 'Authorization': `Bearer ${token}` } });
    const drivers = res.ok ? await res.json() : [];
    document.getElementById('driversTable').innerHTML = drivers.length ? drivers.map(d => `
        <tr><td><code>${d.driverCode}</code></td><td><strong>${d.user?.name || 'N/A'}</strong></td><td>${d.organization?.name || 'N/A'}</td>
        <td><span class="badge ${d.status==='active'?'badge-success':'badge-danger'}">${d.status}</span></td>
        <td class="action-btns"><button class="btn-view"><i class="fas fa-eye"></i></button></td></tr>
    `).join('') : '<tr><td colspan="5" style="text-align:center;color:#6C757D;">Aucun chauffeur</td></tr>';
}

// ===== PAIEMENTS =====
function getPaymentsHTML() { return `<div class="topbar"><h1>💳 Paiements</h1></div><div class="card" style="text-align:center;padding:60px;"><i class="fas fa-credit-card" style="font-size:48px;color:#CCC;"></i><h3 style="color:#6C757D;">Module de paiement</h3><p style="color:#AAA;">Bientôt disponible</p></div>`; }

// ===== PARAMÈTRES AVEC ONGLETS =====
function getSettingsHTML() {
    return `
        <div class="topbar"><h1>⚙️ Paramètres</h1></div>
        
        <div style="display:flex;gap:0;margin-bottom:24px;background:white;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <button class="settings-tab active" id="tab-FLOTTE" onclick="switchSettingsTab('FLOTTE')" style="flex:1;padding:16px;border:none;background:transparent;cursor:pointer;font-size:15px;font-weight:600;font-family:'Inter',sans-serif;transition:0.3s;">
                🏍️ Plans Flotte
            </button>
            <button class="settings-tab" id="tab-COOP" onclick="switchSettingsTab('COOP')" style="flex:1;padding:16px;border:none;background:transparent;cursor:pointer;font-size:15px;font-weight:600;font-family:'Inter',sans-serif;transition:0.3s;">
                📦 Plans Coop
            </button>
        </div>
        
        <div id="plans-content">${getPlansContent('FLOTTE')}</div>
        
        <div class="card" style="padding:24px;margin-top:24px;">
            <h3>🌐 Général</h3>
            <div style="margin-top:16px;"><label style="font-weight:500;">💱 Monnaie</label><input value="Ar" style="width:100%;padding:10px;border:1px solid #E9ECEF;border-radius:8px;margin-top:4px;" disabled></div>
            <div style="margin-top:16px;"><label style="font-weight:500;">🌐 Langue</label>
                <select style="width:100%;padding:10px;border:1px solid #E9ECEF;border-radius:8px;margin-top:4px;">
                    <option>🇫🇷 Français</option><option>🇲🇬 Malagasy</option><option>🇬🇧 English</option>
                </select>
            </div>
            <div style="margin-top:20px;display:flex;align-items:center;justify-content:space-between;">
                <div><strong>🔔 Notifications</strong><br><span style="color:#6C757D;font-size:13px;">Activer toutes les notifications</span></div>
                <button id="notifToggle" onclick="this.classList.toggle('active');" style="width:48px;height:28px;border-radius:50px;background:#E9ECEF;border:none;cursor:pointer;position:relative;">
                    <span style="position:absolute;top:2px;left:2px;width:24px;height:24px;background:white;border-radius:50%;transition:0.3s;"></span>
                </button>
            </div>
        </div>
        <button onclick="alert('✅ Paramètres sauvegardés !')" style="width:100%;padding:16px;background:#1A5276;color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;margin-top:24px;">
            <i class="fas fa-save"></i> Enregistrer
        </button>
        
        <style>
            .settings-tab.active { background: #1A5276 !important; color: white !important; }
            .settings-tab:not(.active):hover { background: #F1F5F9; }
        </style>
    `;
}

function getPlansContent(type) {
    const plans = type === 'FLOTTE' 
        ? [{ nom: 'Freemium', prix: 0, vehiculesMax: 1, chauffeursMax: 1 }, { nom: 'Basic', prix: 15000, vehiculesMax: 5, chauffeursMax: 10 }, { nom: 'Standard', prix: 35000, vehiculesMax: 20, chauffeursMax: 50 }, { nom: 'Premium', prix: 75000, vehiculesMax: 100, chauffeursMax: 200 }]
        : [{ nom: 'Freemium', prix: 0, vehiculesMax: 1, livreursMax: 2 }, { nom: 'Basic', prix: 20000, vehiculesMax: 5, livreursMax: 15 }, { nom: 'Standard', prix: 45000, vehiculesMax: 20, livreursMax: 60 }, { nom: 'Premium', prix: 90000, vehiculesMax: 100, livreursMax: 300 }];
    
    const label = type === 'FLOTTE' ? 'chauffeurs' : 'livreurs';
    const maxField = type === 'FLOTTE' ? 'chauffeursMax' : 'livreursMax';
    
    return `
        <div class="card" style="padding:24px;">
            <h3>📋 Plans mensuels</h3>
            ${plans.map((p,i) => `
                <div style="display:flex;align-items:center;gap:16px;padding:16px;border:1px solid #F1F5F9;border-radius:12px;margin-top:12px;flex-wrap:wrap;">
                    <div style="width:100px;font-weight:700;">${p.nom}</div>
                    <div><input type="number" value="${p.prix}" style="width:80px;padding:8px;border:1px solid #E9ECEF;border-radius:8px;text-align:center;font-weight:700;"> <span style="font-size:13px;color:#6C757D;">Ar/mois</span></div>
                    <div style="display:flex;gap:12px;">
                        <span>🏍️ <input type="number" value="${p.vehiculesMax}" style="width:50px;padding:6px;border:1px solid #E9ECEF;border-radius:6px;text-align:center;"> véhicules</span>
                        <span>👥 <input type="number" value="${p[maxField] || 0}" style="width:50px;padding:6px;border:1px solid #E9ECEF;border-radius:6px;text-align:center;"> ${label}</span>
                    </div>
                    <span class="badge badge-success">✅ Actif</span>
                </div>
            `).join('')}
        </div>
        <div class="card" style="padding:24px;margin-top:16px;">
            <h3>📉 Réduction abonnement annuel</h3>
            <div style="display:flex;align-items:center;gap:12px;margin-top:12px;">
                <input type="number" value="7" style="width:80px;padding:12px;border:1px solid #E9ECEF;border-radius:8px;text-align:center;font-weight:700;font-size:18px;"> <span style="font-size:18px;">%</span>
                <span style="color:#6C757D;font-size:13px;">pour les abonnements annuels</span>
            </div>
        </div>
    `;
}

// ===== INIT =====
loadPage('dashboard');
