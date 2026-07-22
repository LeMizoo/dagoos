// ========================================
// DAGO ADMIN - DASHBOARD v4 COMPLET
// ========================================

const API_URL = 'https://dagoos-api.onrender.com/api';
const LANDING_URL = 'https://dago-mobility.pages.dev';
const LOGIN_URL = 'index.html';

let currentPage = 'dashboard';
let currentSettingsTab = 'FLOTTE';
let refreshInterval;
let orgsData = [];
let driversData = [];
let usersData = [];

// ===== AUTH =====
const token = localStorage.getItem('dagoos_token');
const user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
if (!token || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) { window.location.href = LOGIN_URL; }

document.getElementById('sidebarUser').textContent = '👑 ' + (user.name || user.email);
document.getElementById('headerUser').textContent = user.name || user.email;
document.getElementById('headerAvatar').textContent = (user.name || 'A')[0].toUpperCase();

function logout() { localStorage.clear(); window.location.href = LANDING_URL; }
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function toggleDropdown() { document.getElementById('userDropdown').classList.toggle('show'); }
function toggleSubmenu(key) { document.getElementById('sub-' + key).classList.toggle('open'); }

// Close dropdown on click outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-dropdown')) document.getElementById('userDropdown').classList.remove('show');
});

// ===== MODAL =====
function showModal(title, content, onSave) {
    document.getElementById('modalContent').innerHTML = `
        <h2>${title}</h2>${content}
        <div class="btn-row">
            <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
            <button class="btn btn-primary" id="modalSaveBtn">Enregistrer</button>
        </div>`;
    document.getElementById('modalOverlay').classList.add('show');
    if (onSave) document.getElementById('modalSaveBtn').onclick = onSave;
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('show'); }

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

async function loadPage(page) {
    if (refreshInterval) clearInterval(refreshInterval);
    const main = document.getElementById('mainInner');
    
    switch(page) {
        case 'dashboard': main.innerHTML = getDashboardHTML(); await loadDashboardStats(); refreshInterval = setInterval(loadDashboardStats, 30000); break;
        case 'fleets': main.innerHTML = getTableHTML('flottes', '🚛 Flottes'); await loadFleets(); break;
        case 'coops': main.innerHTML = getTableHTML('coops', '🏢 Coopératives'); await loadCoops(); break;
        case 'drivers': main.innerHTML = getTableHTML('drivers', '🛵 Chauffeurs'); await loadDrivers(); break;
        case 'payments': main.innerHTML = getPaymentsHTML(); break;
        case 'logs': main.innerHTML = getTableHTML('logs', '📋 Logs'); await loadLogs(); break;
        case 'settings': main.innerHTML = getSettingsHTML(); break;
        case 'plans-flotte': main.innerHTML = getPlansTabHTML('FLOTTE'); break;
        case 'plans-coop': main.innerHTML = getPlansTabHTML('COOP'); break;
    }
}

// ===== TABLE GENERIC =====
function getTableHTML(type, title) {
    let cols = '';
    if (type === 'flottes' || type === 'coops') cols = `<th onclick="sortTable('${type}','name')">Nom <i class="fas fa-sort"></i></th><th>Code</th><th>Email</th><th>Chauffeurs</th><th>Plan</th><th>Statut</th><th>Actions</th>`;
    else if (type === 'drivers') cols = `<th onclick="sortTable('${type}','driverCode')">Code <i class="fas fa-sort"></i></th><th>Nom</th><th>Organisation</th><th>Statut</th><th>Actions</th>`;
    else if (type === 'logs') cols = `<th>Date</th><th>Utilisateur</th><th>Action</th><th>Détails</th>`;
    
    return `
        <div class="topbar"><h1>${title}</h1>
            <div style="display:flex;gap:8px;">
                ${type !== 'logs' ? `<input type="text" placeholder="🔍 Rechercher..." oninput="filterTable('${type}', this.value)" style="padding:8px 12px;border:1px solid #E9ECEF;border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;">` : ''}
                ${type === 'flottes' || type === 'coops' ? `<button class="btn btn-primary btn-sm" onclick="addOrg('${type === 'flottes' ? 'FLEET_MANAGER' : 'COOPERATIVE'}')"><i class="fas fa-plus"></i> Ajouter</button>` : ''}
                <button class="btn btn-sm" style="background:#E9ECEF;" onclick="exportCSV('${type}')"><i class="fas fa-download"></i> CSV</button>
            </div>
        </div>
        <div class="card">
            <table><thead><tr>${cols}</tr></thead><tbody id="${type}Table"></tbody></table>
        </div>`;
}

// ===== DASHBOARD =====
function getDashboardHTML() {
    return `
        <div class="topbar"><div><h1>📊 Tableau de bord</h1><p style="color:#6C757D;font-size:13px;" id="currentDate"></p></div>
            <div style="display:flex;align-items:center;gap:12px;">
                <span id="apiStatus" style="font-size:12px;padding:4px 10px;border-radius:50px;"></span>
                <button onclick="loadDashboardStats()" style="padding:8px;background:#F1F5F9;border:none;border-radius:8px;cursor:pointer;"><i class="fas fa-sync-alt"></i></button>
                <span style="font-size:11px;color:#AAA;" id="lastRefresh"></span>
            </div></div>
        <div class="stats-grid" id="statsGrid"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            <div class="card"><div class="card-header"><h3>📝 Activités récentes</h3></div><div style="padding:0 20px 16px;max-height:300px;overflow-y:auto;" id="recentActivities"></div></div>
            <div class="card"><div class="card-header"><h3>📍 Dernières inscriptions</h3></div><div style="padding:0 20px 16px;max-height:300px;overflow-y:auto;" id="recentUsers"></div></div>
        </div>`;
}

async function loadDashboardStats() {
    const now = new Date();
    const el = id => document.getElementById(id);
    if (el('currentDate')) el('currentDate').textContent = now.toLocaleDateString('fr', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (el('lastRefresh')) el('lastRefresh').textContent = 'Mis à jour à ' + now.toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' });

    try {
        const [usersRes, orgsRes, driversRes] = await Promise.all([
            fetch(`${API_URL}/users`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/organizations`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/drivers`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        usersData = usersRes.ok ? await usersRes.json() : [];
        orgsData = orgsRes.ok ? await orgsRes.json() : [];
        driversData = driversRes.ok ? await driversRes.json() : [];
        
        const fleets = orgsData.filter(o => o.type === 'FLEET_MANAGER').length;
        const coops = orgsData.filter(o => o.type === 'COOPERATIVE').length;
        
        if (el('statsGrid')) el('statsGrid').innerHTML = `
            <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-dollar-sign"></i></div><div class="stat-info"><div class="stat-number">0 Ar</div><div class="stat-label">Revenus aujourd'hui</div></div></div>
            <div class="stat-card"><div class="stat-icon green"><i class="fas fa-shopping-cart"></i></div><div class="stat-info"><div class="stat-number">0</div><div class="stat-label">Courses aujourd'hui</div></div></div>
            <div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-users"></i></div><div class="stat-info"><div class="stat-number">${driversData.length}</div><div class="stat-label">Chauffeurs</div></div></div>
            <div class="stat-card"><div class="stat-icon red"><i class="fas fa-building"></i></div><div class="stat-info"><div class="stat-number">${fleets} / ${coops}</div><div class="stat-label">Flottes & Coops</div></div></div>`;
        
        if (el('fleetCount')) el('fleetCount').textContent = fleets;
        if (el('coopCount')) el('coopCount').textContent = coops;
        if (el('driverCount')) el('driverCount').textContent = driversData.length;
        
        if (el('recentUsers')) el('recentUsers').innerHTML = usersData.slice(-6).reverse().map(u => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #F1F5F9;">
                <div style="width:34px;height:34px;border-radius:50%;background:#DBEAFE;color:#1A5276;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;">${(u.name || '?')[0].toUpperCase()}</div>
                <div><strong>${u.name || 'N/A'}</strong><br><span style="font-size:11px;color:#6C757D;">${u.role} · ${new Date(u.createdAt).toLocaleDateString('fr')}</span></div>
            </div>`).join('') || '<p style="text-align:center;color:#6C757D;padding:20px;">Aucune inscription</p>';
        
        if (el('recentActivities')) el('recentActivities').innerHTML = driversData.slice(0, 5).map(d => `
            <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #F1F5F9;">
                <div>🛵</div><div><strong>${d.user?.name || d.driverCode}</strong><br><span style="font-size:11px;color:#6C757D;">${d.organization?.name || 'N/A'} · ${d.status === 'active' ? '🟢 Actif' : '🔴 Inactif'}</span></div>
            </div>`).join('') || '<p style="text-align:center;color:#6C757D;padding:20px;">Aucune activité</p>';
        
        if (el('apiStatus')) { el('apiStatus').innerHTML = '🟢 API Online'; el('apiStatus').style.background = '#D1FAE5'; el('apiStatus').style.color = '#065F46'; }
    } catch (e) {
        if (el('apiStatus')) { el('apiStatus').innerHTML = '🔴 API Offline'; el('apiStatus').style.background = '#FEE2E2'; el('apiStatus').style.color = '#991B1B'; }
    }
}

// ===== LOADERS =====
async function loadFleets() { loadOrgs('flottes', 'FLEET_MANAGER'); }
async function loadCoops() { loadOrgs('coops', 'COOPERATIVE'); }

async function loadOrgs(type, orgType) {
    try {
        const [orgsRes, driversRes] = await Promise.all([
            fetch(`${API_URL}/organizations`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/drivers`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        orgsData = orgsRes.ok ? await orgsRes.json() : [];
        driversData = driversRes.ok ? await driversRes.json() : [];
        const items = orgsData.filter(o => o.type === orgType);
        
        document.getElementById(type + 'Table').innerHTML = items.length ? items.map(o => {
            const count = driversData.filter(d => d.organization?.code === o.code).length;
            return `<tr>
                <td><img src="${o.logo || 'assets/logo/b-trans.png'}" class="logo-cell" style="vertical-align:middle;margin-right:8px;"><strong>${o.name}</strong></td>
                <td><code>${orgType === 'FLEET_MANAGER' ? 'FL' : 'CO'}-${o.code}</code></td>
                <td>${o.email||'N/A'}</td><td>${count}</td>
                <td><span class="badge badge-info">${o.plan||'Freemium'}</span></td>
                <td><span class="badge ${o.status==='active'?'badge-success':'badge-danger'}">${o.status||'actif'}</span></td>
                <td class="action-btns">
                    <button class="btn-sm btn-view" onclick="viewOrg('${o.id}')"><i class="fas fa-eye"></i></button>
                    <button class="btn-sm btn-edit" onclick="editOrg('${o.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-sm ${o.status==='active'?'btn-suspend':'btn-success'}" onclick="toggleOrgStatus('${o.id}','${o.status}')"><i class="fas fa-${o.status==='active'?'ban':'check'}"></i></button>
                </td></tr>`;
        }).join('') : `<tr><td colspan="7" style="text-align:center;color:#6C757D;">Aucune donnée</td></tr>`;
    } catch (e) { console.error(e); }
}

async function loadDrivers() {
    try {
        const res = await fetch(`${API_URL}/drivers`, { headers: { Authorization: `Bearer ${token}` } });
        driversData = res.ok ? await res.json() : [];
        document.getElementById('driversTable').innerHTML = driversData.length ? driversData.map(d => `
            <tr><td><code>${d.driverCode}</code></td><td><strong>${d.user?.name || 'N/A'}</strong></td><td>${d.organization?.name || 'N/A'}</td>
            <td><span class="badge ${d.status==='active'?'badge-success':'badge-danger'}">${d.status}</span></td>
            <td class="action-btns"><button class="btn-sm btn-view" onclick="viewDriver('${d.id}')"><i class="fas fa-eye"></i></button></td></tr>
        `).join('') : '<tr><td colspan="5" style="text-align:center;color:#6C757D;">Aucun chauffeur</td></tr>';
    } catch (e) { console.error(e); }
}

// ===== LOGS =====
async function loadLogs() {
    try {
        const res = await fetch(`${API_URL}/logs`, { headers: { Authorization: `Bearer ${token}` } });
        const logs = res.ok ? await res.json() : [];
        document.getElementById('logsTable').innerHTML = logs.length ? logs.slice(0, 50).map(l => `
            <tr><td>${new Date(l.createdAt).toLocaleString('fr')}</td><td>${l.userId||'Système'}</td><td>${l.action}</td><td>${l.details||''}</td></tr>
        `).join('') : '<tr><td colspan="4" style="text-align:center;color:#6C757D;">Aucun log</td></tr>';
    } catch (e) { document.getElementById('logsTable').innerHTML = '<tr><td colspan="4">Logs bientôt disponibles</td></tr>'; }
}

// ===== ACTIONS =====
function viewOrg(id) {
    const org = orgsData.find(o => o.id === id);
    if (!org) return;
    const drivers = driversData.filter(d => d.organization?.code === org.code);
    showModal(org.name, `
        <p><strong>Code:</strong> ${org.code}</p>
        <p><strong>Email:</strong> ${org.email||'N/A'}</p>
        <p><strong>Plan:</strong> ${org.plan||'Freemium'}</p>
        <p><strong>Statut:</strong> ${org.status}</p>
        <p><strong>Chauffeurs:</strong> ${drivers.length}</p>
        <p><strong>Logo:</strong> <img src="${org.logo||'assets/logo/b-trans.png'}" style="width:40px;height:40px;border-radius:50%;"></p>
        ${drivers.length ? '<hr><h4>Chauffeurs</h4>' + drivers.map(d => `<p>🛵 ${d.driverCode} - ${d.user?.name||'N/A'}</p>`).join('') : ''}
    `);
}

function editOrg(id) {
    const org = orgsData.find(o => o.id === id);
    if (!org) return;
    showModal('Modifier ' + org.name, `
        <div class="form-group"><label>Nom</label><input id="editName" value="${org.name}"></div>
        <div class="form-group"><label>Email</label><input id="editEmail" value="${org.email||''}"></div>
        <div class="form-group"><label>Plan</label><select id="editPlan">
            <option ${org.plan==='Freemium'?'selected':''}>Freemium</option>
            <option ${org.plan==='Basic'?'selected':''}>Basic</option>
            <option ${org.plan==='Standard'?'selected':''}>Standard</option>
            <option ${org.plan==='Premium'?'selected':''}>Premium</option>
        </select></div>
    `, async () => {
        // Save changes (à implémenter côté API)
        alert('✅ Modifications sauvegardées (simulation)');
        closeModal();
        loadPage(currentPage);
    });
}

function toggleOrgStatus(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if (confirm(`Confirmer le changement de statut en "${newStatus}" ?`)) {
        alert(`✅ Statut changé en "${newStatus}" (simulation)`);
        loadPage(currentPage);
    }
}

function viewDriver(id) {
    const d = driversData.find(d => d.id === id);
    if (!d) return;
    showModal(d.user?.name || d.driverCode, `
        <p><strong>Code:</strong> ${d.driverCode}</p>
        <p><strong>Organisation:</strong> ${d.organization?.name||'N/A'}</p>
        <p><strong>Statut:</strong> ${d.status}</p>
        <p><strong>Créé le:</strong> ${new Date(d.createdAt).toLocaleDateString('fr')}</p>
    `);
}

function addOrg(type) {
    showModal('Ajouter une ' + (type === 'FLEET_MANAGER' ? 'flotte' : 'coopérative'), `
        <div class="form-group"><label>Nom</label><input id="addName"></div>
        <div class="form-group"><label>Email</label><input id="addEmail"></div>
        <div class="form-group"><label>Téléphone</label><input id="addPhone"></div>
    `, async () => {
        const name = document.getElementById('addName').value;
        const email = document.getElementById('addEmail').value;
        const phone = document.getElementById('addPhone').value;
        if (!name) return alert('Nom requis');
        // Appel API (à implémenter)
        alert('✅ ' + name + ' créé (simulation)');
        closeModal();
        loadPage(currentPage);
    });
}

// ===== FILTER & SORT & EXPORT =====
let sortDirection = {};
function sortTable(type, field) {
    sortDirection[field] = !sortDirection[field];
    const dir = sortDirection[field] ? 1 : -1;
    let data = type === 'flottes' ? orgsData.filter(o => o.type === 'FLEET_MANAGER') 
             : type === 'coops' ? orgsData.filter(o => o.type === 'COOPERATIVE')
             : type === 'drivers' ? driversData : [];
    data.sort((a, b) => {
        let valA = field === 'name' ? (a.name || '') : (a.driverCode || '');
        let valB = field === 'name' ? (b.name || '') : (b.driverCode || '');
        return valA.localeCompare(valB) * dir;
    });
    // Re-render
    if (type === 'flottes') renderOrgs('flottes', data);
    else if (type === 'coops') renderOrgs('coops', data);
}

function renderOrgs(type, items) {
    const orgType = type === 'flottes' ? 'FLEET_MANAGER' : 'COOPERATIVE';
    document.getElementById(type + 'Table').innerHTML = items.map(o => {
        const count = driversData.filter(d => d.organization?.code === o.code).length;
        return `<tr><td><img src="${o.logo||'assets/logo/b-trans.png'}" class="logo-cell" style="vertical-align:middle;margin-right:8px;"><strong>${o.name}</strong></td>
            <td><code>${orgType==='FLEET_MANAGER'?'FL':'CO'}-${o.code}</code></td><td>${o.email||'N/A'}</td><td>${count}</td>
            <td><span class="badge badge-info">${o.plan||'Freemium'}</span></td>
            <td><span class="badge ${o.status==='active'?'badge-success':'badge-danger'}">${o.status}</span></td>
            <td class="action-btns">
                <button class="btn-sm btn-view" onclick="viewOrg('${o.id}')"><i class="fas fa-eye"></i></button>
                <button class="btn-sm btn-edit" onclick="editOrg('${o.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-sm ${o.status==='active'?'btn-suspend':'btn-success'}" onclick="toggleOrgStatus('${o.id}','${o.status}')"><i class="fas fa-${o.status==='active'?'ban':'check'}"></i></button>
            </td></tr>`;
    }).join('');
}

function filterTable(type, query) {
    const q = query.toLowerCase();
    if (type === 'flottes' || type === 'coops') {
        const orgType = type === 'flottes' ? 'FLEET_MANAGER' : 'COOPERATIVE';
        const filtered = orgsData.filter(o => o.type === orgType && (o.name||'').toLowerCase().includes(q));
        renderOrgs(type, filtered);
    }
}

function exportCSV(type) {
    let csv = '';
    if (type === 'flottes' || type === 'coops') {
        const orgType = type === 'flottes' ? 'FLEET_MANAGER' : 'COOPERATIVE';
        const items = orgsData.filter(o => o.type === orgType);
        csv = 'Nom,Code,Email,Plan,Statut\n';
        items.forEach(o => { csv += `"${o.name}","${o.code}","${o.email||''}","${o.plan||'Freemium'}","${o.status}"\n`; });
    }
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = type + '_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
}

// ===== SETTINGS =====
function switchSettingsTab(tab) {
    currentSettingsTab = tab;
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('plans-content').innerHTML = getPlansContent(tab);
}

function getSettingsHTML() {
    return `
        <div class="topbar"><h1>⚙️ Paramètres</h1></div>
        <div style="display:flex;gap:0;margin-bottom:24px;background:white;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <button class="settings-tab active" id="tab-FLOTTE" onclick="switchSettingsTab('FLOTTE')" style="flex:1;padding:16px;border:none;background:transparent;cursor:pointer;font-size:15px;font-weight:600;font-family:'Inter',sans-serif;">🏍️ Plans Flotte</button>
            <button class="settings-tab" id="tab-COOP" onclick="switchSettingsTab('COOP')" style="flex:1;padding:16px;border:none;background:transparent;cursor:pointer;font-size:15px;font-weight:600;font-family:'Inter',sans-serif;">📦 Plans Coop</button>
        </div>
        <div id="plans-content">${getPlansContent('FLOTTE')}</div>
        <div class="card" style="padding:24px;margin-top:24px;">
            <h3>🌐 Général</h3>
            <div style="margin-top:16px;"><label>💱 Monnaie</label><input value="Ar" style="width:100%;padding:10px;border:1px solid #E9ECEF;border-radius:8px;" disabled></div>
            <div style="margin-top:16px;"><label>🌐 Langue</label><select style="width:100%;padding:10px;border:1px solid #E9ECEF;border-radius:8px;"><option>🇫🇷 Français</option><option>🇲🇬 Malagasy</option><option>🇬🇧 English</option></select></div>
        </div>
        <button onclick="alert('✅ Paramètres sauvegardés !')" style="width:100%;padding:16px;background:#1A5276;color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;margin-top:24px;"><i class="fas fa-save"></i> Enregistrer</button>
        <style>.settings-tab.active{background:#1A5276!important;color:white!important;}.settings-tab:not(.active):hover{background:#F1F5F9;}</style>`;
}

function getPlansTabHTML(type) {
    return `
        <div class="topbar"><h1>${type==='FLOTTE'?'🏍️ Plans Flotte':'📦 Plans Coop'}</h1><a href="#" onclick="loadPage('settings');return false;" style="color:#6C757D;text-decoration:none;">← Retour</a></div>
        ${getPlansContent(type)}
        <button onclick="alert('✅ Sauvegardé !')" style="width:100%;padding:16px;background:#1A5276;color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;margin-top:24px;"><i class="fas fa-save"></i> Enregistrer</button>`;
}

function getPlansContent(type) {
    const plans = type === 'FLOTTE' 
        ? [{ nom: 'Freemium', prix: 0, vehiculesMax: 1, chauffeursMax: 1 }, { nom: 'Basic', prix: 15000, vehiculesMax: 5, chauffeursMax: 10 }, { nom: 'Standard', prix: 35000, vehiculesMax: 20, chauffeursMax: 50 }, { nom: 'Premium', prix: 75000, vehiculesMax: 100, chauffeursMax: 200 }]
        : [{ nom: 'Freemium', prix: 0, vehiculesMax: 1, livreursMax: 2 }, { nom: 'Basic', prix: 20000, vehiculesMax: 5, livreursMax: 15 }, { nom: 'Standard', prix: 45000, vehiculesMax: 20, livreursMax: 60 }, { nom: 'Premium', prix: 90000, vehiculesMax: 100, livreursMax: 300 }];
    const label = type === 'FLOTTE' ? 'chauffeurs' : 'livreurs';
    const maxField = type === 'FLOTTE' ? 'chauffeursMax' : 'livreursMax';
    return `
        <div class="card" style="padding:24px;"><h3>📋 Plans mensuels</h3>
            ${plans.map(p => `
                <div style="display:flex;align-items:center;gap:16px;padding:16px;border:1px solid #F1F5F9;border-radius:12px;margin-top:12px;flex-wrap:wrap;">
                    <div style="width:100px;font-weight:700;">${p.nom}</div>
                    <div><input type="number" value="${p.prix}" style="width:80px;padding:8px;border:1px solid #E9ECEF;border-radius:8px;text-align:center;font-weight:700;"> <span style="font-size:13px;color:#6C757D;">Ar/mois</span></div>
                    <div style="display:flex;gap:12px;"><span>🏍️ <input type="number" value="${p.vehiculesMax}" style="width:50px;padding:6px;border:1px solid #E9ECEF;border-radius:6px;text-align:center;"> véhicules</span>
                    <span>👥 <input type="number" value="${p[maxField]||0}" style="width:50px;padding:6px;border:1px solid #E9ECEF;border-radius:6px;text-align:center;"> ${label}</span></div>
                    <span class="badge badge-success">✅ Actif</span>
                </div>`).join('')}
        </div>
        <div class="card" style="padding:24px;margin-top:16px;"><h3>📉 Réduction annuelle</h3>
            <div style="display:flex;align-items:center;gap:12px;margin-top:12px;"><input type="number" value="7" style="width:80px;padding:12px;border:1px solid #E9ECEF;border-radius:8px;text-align:center;font-weight:700;font-size:18px;"> <span style="font-size:18px;">%</span></div>
        </div>`;
}

// ===== PAYMENTS =====
function getPaymentsHTML() { return `<div class="topbar"><h1>💳 Paiements</h1></div><div class="card" style="text-align:center;padding:60px;"><i class="fas fa-credit-card" style="font-size:48px;color:#CCC;"></i><h3 style="color:#6C757D;">Bientôt disponible</h3></div>`; }

// ===== INIT =====
loadPage('dashboard');
