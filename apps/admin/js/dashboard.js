// ========================================
// DAGO ADMIN - DASHBOARD v5
// ========================================

const API_URL = 'https://dagoos-api.onrender.com/api';
const LANDING_URL = 'https://dago-mobility.pages.dev';
const LOGIN_URL = 'index.html';

let currentPage = 'dashboard';
let refreshInterval;
let unreadCount = 0;
let orgsData = [], driversData = [], usersData = [];

// ===== AUTH =====
const token = localStorage.getItem('dagoos_token');
const user = JSON.parse(localStorage.getItem('dagoos_user') || '{}');
if (!token || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) { window.location.href = LOGIN_URL; }

document.getElementById("sidebarUser").textContent = user.name || user.email;
document.getElementById("sidebarAvatar").textContent = (user.name || "A")[0].toUpperCase();

// ===== UTILS =====
function logout() { localStorage.clear(); window.location.href = LANDING_URL; }
// listener supprimé
function setTheme(t) {
    document.body.classList.remove('dark');
    document.querySelectorAll('.sidebar-footer .theme-btns button').forEach(b => b.classList.remove('active'));
    if (t === 'dark') { document.body.classList.add('dark'); document.getElementById('theme-dark').classList.add('active'); }
    else if (t === 'light') { document.getElementById('theme-light').classList.add('active'); }
    else { document.getElementById('theme-system').classList.add('active'); }
    localStorage.setItem('dago_theme', t);
}

function showModal(title, content) { document.getElementById("modalContent").innerHTML = `<h2>${title}</h2>${content}<div class="btn-row"><button class="btn btn-primary" onclick="closeModal()">Fermer</button></div>`; document.getElementById("modalOverlay").classList.add("show"); }
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('show'); }

function getTableHTML(type, title) {
    let cols = '';
    if (type === 'flottes' || type === 'coops') cols = `<th onclick="sortTable('${type}','name')">Nom <i class="fas fa-sort"></i></th><th>Code</th><th>Email</th><th>Chauffeurs</th><th>Plan</th><th>Statut</th><th>Actions</th>`;
    else if (type === 'drivers') cols = `<th>Code</th><th>Nom</th><th>Organisation</th><th>Statut</th><th>Actions</th>`;
    else if (type === 'logs') cols = `<th>Date</th><th>Utilisateur</th><th>Action</th><th>Détails</th>`;
    else if (type === 'messages') cols = `<th>De</th><th>Sujet</th><th>Message</th><th>Type</th><th>Date</th><th>Actions</th>`;
    return `<div class="topbar"><h1>${title}</h1>
        <div style="display:flex;gap:8px;">
            ${type !== 'logs' && type !== 'messages' ? `<input type="text" placeholder="🔍 Rechercher..." oninput="filterTable('${type}', this.value)" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-family:'Inter',sans-serif;font-size:13px;background:var(--bg);color:var(--text);">` : ''}
            ${type === 'flottes' || type === 'coops' ? `<button class="btn btn-primary btn-sm" onclick="addOrg('${type === 'flottes' ? 'FLEET_MANAGER' : 'COOPERATIVE'}')"><i class="fas fa-plus"></i> Ajouter</button>` : ''}
            ${type !== 'messages' ? `<button class="btn btn-sm" style="background:var(--border);" onclick="exportCSV('${type}')"><i class="fas fa-download"></i> CSV</button>` : ''}
        </div></div>
        <div class="card"><table><thead><tr>${cols}</tr></thead><tbody id="${type}Table"></tbody></table></div>`;
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

async function loadPage(page) {
    if (refreshInterval) clearInterval(refreshInterval);
    const main = document.getElementById('mainInner');
    currentPage = page;
    
    switch(page) {
        case 'dashboard': main.innerHTML = getDashboardHTML(); await loadDashboardStats(); refreshInterval = setInterval(loadDashboardStats, 30000); break;
        case 'fleets': main.innerHTML = getTableHTML('flottes', '🚛 Flottes'); await loadFleets(); break;
        case 'coops': main.innerHTML = getTableHTML('coops', '🏢 Coopératives'); await loadCoops(); break;
        case 'drivers': main.innerHTML = getTableHTML('drivers', '🛵 Chauffeurs'); await loadDrivers(); break;
        case 'messages': main.innerHTML = getTableHTML('messages', '📬 Messages'); await loadMessages(); refreshInterval = setInterval(loadMessages, 30000); break;
        case 'logs': main.innerHTML = getTableHTML('logs', '📋 Logs'); await loadLogs(); break;
        case 'payments': main.innerHTML = '<div class="topbar"><h1>💳 Paiements</h1></div><div class="card" style="text-align:center;padding:60px;"><i class="fas fa-credit-card" style="font-size:48px;color:#CCC;"></i><h3 style="color:var(--text2);">Bientôt disponible</h3></div>'; break;
        case 'settings': main.innerHTML = getSettingsHTML(); break;
        case 'plans-flotte': main.innerHTML = getPlansTabHTML('FLOTTE'); break;
        case 'plans-coop': main.innerHTML = getPlansTabHTML('COOP'); break;
    }
}

// ===== DASHBOARD =====
function getDashboardHTML() {
    return `<div class="topbar"><div><h1>📊 Tableau de bord</h1><p style="color:var(--text2);font-size:13px;" id="currentDate"></p></div>
        <div style="display:flex;align-items:center;gap:12px;"><span id="apiStatus" style="font-size:12px;padding:4px 10px;border-radius:50px;"></span>
        <button onclick="loadDashboardStats()" style="padding:8px;background:var(--border);border:none;border-radius:8px;cursor:pointer;"><i class="fas fa-sync-alt"></i></button>
        <span style="font-size:11px;color:var(--text2);" id="lastRefresh"></span></div></div>
        <div class="stats-grid" id="statsGrid"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            <div class="card"><div class="card-header"><h3>📝 Activités</h3></div><div style="padding:0 18px 14px;max-height:280px;overflow-y:auto;" id="recentActivities"></div></div>
            <div class="card"><div class="card-header"><h3>📍 Inscriptions</h3></div><div style="padding:0 18px 14px;max-height:280px;overflow-y:auto;" id="recentUsers"></div></div>
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
        ['fleetCount','coopCount','driverCount'].forEach(id => { const e = el(id); if (e) e.textContent = id === 'driverCount' ? driversData.length : (id === 'fleetCount' ? fleets : coops); });
        if (el('recentUsers')) el('recentUsers').innerHTML = usersData.slice(-6).reverse().map(u => `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);"><div style="width:32px;height:32px;border-radius:50%;background:#DBEAFE;color:#1A5276;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;">${(u.name||'?')[0].toUpperCase()}</div><div><strong>${u.name||'N/A'}</strong><br><span style="font-size:10px;color:var(--text2);">${u.role} · ${new Date(u.createdAt).toLocaleDateString('fr')}</span></div></div>`).join('') || '<p style="text-align:center;color:var(--text2);padding:20px;">Aucune</p>';
        if (el('recentActivities')) el('recentActivities').innerHTML = driversData.slice(0,5).map(d => `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);"><div>🛵</div><div><strong>${d.user?.name||d.driverCode}</strong><br><span style="font-size:10px;color:var(--text2);">${d.organization?.name||'N/A'} · ${d.status==='active'?'🟢':'🔴'}</span></div></div>`).join('') || '<p style="text-align:center;color:var(--text2);padding:20px;">Aucune</p>';
        if (el('apiStatus')) { el('apiStatus').innerHTML = '🟢 API Online'; el('apiStatus').style.background = '#D1FAE5'; el('apiStatus').style.color = '#065F46'; }
        loadMessagesCount();
    } catch (e) { if (el('apiStatus')) { el('apiStatus').innerHTML = '🔴 API Offline'; el('apiStatus').style.background = '#FEE2E2'; el('apiStatus').style.color = '#991B1B'; } }
}

// ===== FLOTTES / COOPS =====
async function loadFleets() { await loadOrgs('flottes', 'FLEET_MANAGER'); }
async function loadCoops() { await loadOrgs('coops', 'COOPERATIVE'); }
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
            return `<tr><td><img src="${o.logo||'assets/logo/b-trans.png'}" class="logo-cell" style="vertical-align:middle;margin-right:8px;"><strong>${o.name}</strong></td>
                <td><code>${orgType==='FLEET_MANAGER'?'FL':'CO'}-${o.code}</code></td><td>${o.email||'N/A'}</td><td>${count}</td>
                <td><span class="badge badge-info">${o.plan||'Freemium'}</span></td>
                <td><span class="badge ${o.status==='active'?'badge-success':'badge-danger'}">${o.status}</span></td>
                <td class="action-btns"><button class="btn-sm btn-view" onclick="viewOrg('${o.id}')"><i class="fas fa-eye"></i></button>
                <button class="btn-sm btn-edit" onclick="editOrg('${o.id}')"><i class="fas fa-edit"></i></button>
                <button class="btn-sm ${o.status==='active'?'btn-suspend':'btn-success'}" onclick="toggleOrgStatus('${o.id}','${o.status}')"><i class="fas fa-${o.status==='active'?'ban':'check'}"></i></button></td></tr>`;
        }).join('') : `<tr><td colspan="7" style="text-align:center;color:var(--text2);">Aucune donnée</td></tr>`;
    } catch (e) { console.error(e); }
}

async function loadDrivers() {
    try {
        const res = await fetch(`${API_URL}/drivers`, { headers: { Authorization: `Bearer ${token}` } });
        driversData = res.ok ? await res.json() : [];
        document.getElementById('driversTable').innerHTML = driversData.length ? driversData.map(d => `
            <tr><td><code>${d.driverCode}</code></td><td><strong>${d.user?.name||'N/A'}</strong></td><td>${d.organization?.name||'N/A'}</td>
            <td><span class="badge ${d.status==='active'?'badge-success':'badge-danger'}">${d.status}</span></td>
            <td class="action-btns"><button class="btn-sm btn-view" onclick="viewDriver('${d.id}')"><i class="fas fa-eye"></i></button></td></tr>`).join('')
            : '<tr><td colspan="5" style="text-align:center;color:var(--text2);">Aucun chauffeur</td></tr>';
    } catch (e) { console.error(e); }
}

// ===== MESSAGES =====
async function loadMessagesCount() {
    try {
        const res = await fetch(`${API_URL}/messages/unread-count`, { headers: { Authorization: `Bearer ${token}` } });
        const data = res.ok ? await res.json() : { count: 0 };
        unreadCount = data.count;
        const badge = document.getElementById('msgCount');
        const notifBadge = document.querySelector('.notif-btn .badge');
        if (unreadCount > 0) {
            if (badge) { badge.style.display = 'inline'; badge.textContent = unreadCount; }
            if (notifBadge) notifBadge.style.display = 'block';
        } else {
            if (badge) badge.style.display = 'none';
            if (notifBadge) notifBadge.style.display = 'none';
        }
    } catch (e) {}
}

async function loadMessages() {
    try {
        const res = await fetch(`${API_URL}/messages`, { headers: { Authorization: `Bearer ${token}` } });
        const messages = res.ok ? await res.json() : [];
        document.getElementById('messagesTable').innerHTML = messages.length ? messages.map(m => `
            <tr style="${!m.read ? 'background:#FEF3C7;' : ''}">
                <td><img src="${m.organization?.logo||'assets/logo/b-trans.png'}" class="logo-cell" style="vertical-align:middle;margin-right:6px;"><strong>${m.organization?.name||'N/A'}</strong><br><span style="font-size:10px;color:var(--text2);">${m.organization?.type==='COOPERATIVE'?'🏢 Coop':'🚛 Flotte'}</span></td>
                <td><strong>${m.subject}</strong></td>
                <td>${m.content.substring(0,100)}${m.content.length>100?'...':''}${m.reply?`<br><br><span style="color:#27AE60;"><strong>↳ Réponse:</strong> ${m.reply}</span>`:''}</td>
                <td><span class="badge badge-${m.type==='urgent'?'danger':'info'}">${m.type}</span></td>
                <td style="font-size:11px;">${new Date(m.createdAt).toLocaleString('fr')}</td>
                <td class="action-btns">${!m.replied?`<button class="btn-sm btn-primary" onclick="replyMessage('${m.id}')"><i class="fas fa-reply"></i> Répondre</button>`:'<span class="badge badge-success">✅ Répondu</span>'}${!m.read?`<button class="btn-sm btn-view" onclick="markAsRead('${m.id}')"><i class="fas fa-check"></i></button>`:''}</td></tr>`).join('')
            : '<tr><td colspan="6" style="text-align:center;color:var(--text2);">📭 Aucun message</td></tr>';
        loadMessagesCount();
    } catch (e) { console.error(e); }
}

async function markAsRead(id) { await fetch(`${API_URL}/messages/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }); loadMessages(); }
async function replyMessage(id) {
    const reply = prompt('Votre réponse :');
    if (!reply) return;
    await fetch(`${API_URL}/messages/${id}/reply`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ reply }) });
    loadMessages();
}

// ===== LOGS =====
async function loadLogs() {
    try {
        const res = await fetch(`${API_URL}/logs`, { headers: { Authorization: `Bearer ${token}` } });
        const logs = res.ok ? await res.json() : [];
        document.getElementById('logsTable').innerHTML = logs.length ? logs.slice(0,50).map(l => `<tr><td>${new Date(l.createdAt).toLocaleString('fr')}</td><td>${l.userId||'Système'}</td><td>${l.action}</td><td>${l.details||''}</td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--text2);">Aucun log</td></tr>';
    } catch (e) { document.getElementById('logsTable').innerHTML = '<tr><td colspan="4">Logs bientôt disponibles</td></tr>'; }
}

// ===== ACTIONS =====
function viewOrg(id) {
    const org = orgsData.find(o => o.id === id); if (!org) return;
    const drv = driversData.filter(d => d.organization?.code === org.code);
    showModal(org.name, `<p><strong>Code:</strong> ${org.code}</p><p><strong>Email:</strong> ${org.email||'N/A'}</p><p><strong>Plan:</strong> ${org.plan||'Freemium'}</p><p><strong>Statut:</strong> ${org.status}</p><p><strong>Chauffeurs:</strong> ${drv.length}</p><img src="${org.logo||'assets/logo/b-trans.png'}" style="width:50px;height:50px;border-radius:50%;">${drv.length?'<hr><h4>Chauffeurs</h4>'+drv.map(d=>`<p>🛵 ${d.driverCode} - ${d.user?.name||'N/A'}</p>`).join(''):''}`);
}
function editOrg(id) {
    const org = orgsData.find(o => o.id === id); if (!org) return;
    showModal("Modifier " + org.name, "<div class="form-group"><label>Nom</label><input id="editName" value="" + org.name + ""></div><div class="form-group"><label>Email</label><input id="editEmail" value="" + (org.email||"") + ""></div><div class="form-group"><label>Plan</label><select id="editPlan"><option " + (org.plan=="Freemium"?"selected":"") + ">Freemium</option><option " + (org.plan=="Basic"?"selected":"") + ">Basic</option><option " + (org.plan=="Standard"?"selected":"") + ">Standard</option><option " + (org.plan=="Premium"?"selected":"") + ">Premium</option></select></div>");
}
function toggleOrgStatus(id, s) { if (confirm(`Changer le statut en "${s==='active'?'suspended':'active'}" ?`)) { alert('✅ Statut changé (simulation)'); loadPage(currentPage); } }
function viewDriver(id) { const d = driversData.find(d=>d.id===id); if(!d)return; showModal(d.user?.name||d.driverCode,`<p><strong>Code:</strong> ${d.driverCode}</p><p><strong>Organisation:</strong> ${d.organization?.name||'N/A'}</p><p><strong>Statut:</strong> ${d.status}</p>`); }
function addOrg(type) { showModal('Ajouter',`<div class="form-group"><label>Nom</label><input id="addName"></div><div class="form-group"><label>Email</label><input id="addEmail"></div>`);}

// ===== FILTER / SORT / EXPORT =====
function filterTable(type, query) { const q = query.toLowerCase(); if (type==='flottes'||type==='coops') { const orgType = type==='flottes'?'FLEET_MANAGER':'COOPERATIVE'; const filtered = orgsData.filter(o => o.type===orgType && (o.name||'').toLowerCase().includes(q)); renderOrgs(type, filtered); } }
function sortTable(type, field) { let data = type==='flottes'?orgsData.filter(o=>o.type==='FLEET_MANAGER'):type==='coops'?orgsData.filter(o=>o.type==='COOPERATIVE'):driversData; data.sort((a,b)=>(a[field]||'').localeCompare(b[field]||'')); if(type==='flottes'||type==='coops') renderOrgs(type,data); }
function renderOrgs(type, items) { const orgType = type==='flottes'?'FLEET_MANAGER':'COOPERATIVE'; document.getElementById(type+'Table').innerHTML = items.map(o => { const count = driversData.filter(d=>d.organization?.code===o.code).length; return `<tr><td><img src="${o.logo||'assets/logo/b-trans.png'}" class="logo-cell" style="vertical-align:middle;margin-right:8px;"><strong>${o.name}</strong></td><td><code>${orgType==='FLEET_MANAGER'?'FL':'CO'}-${o.code}</code></td><td>${o.email||'N/A'}</td><td>${count}</td><td><span class="badge badge-info">${o.plan||'Freemium'}</span></td><td><span class="badge ${o.status==='active'?'badge-success':'badge-danger'}">${o.status}</span></td><td class="action-btns"><button class="btn-sm btn-view" onclick="viewOrg('${o.id}')"><i class="fas fa-eye"></i></button><button class="btn-sm btn-edit" onclick="editOrg('${o.id}')"><i class="fas fa-edit"></i></button><button class="btn-sm ${o.status==='active'?'btn-suspend':'btn-success'}" onclick="toggleOrgStatus('${o.id}','${o.status}')"><i class="fas fa-${o.status==='active'?'ban':'check'}"></i></button></td></tr>`; }).join(''); }
function exportCSV(type) { let csv=''; const items = type==='flottes'?orgsData.filter(o=>o.type==='FLEET_MANAGER'):type==='coops'?orgsData.filter(o=>o.type==='COOPERATIVE'):[]; csv='Nom,Code,Email,Plan,Statut\n'; items.forEach(o=>{csv+=`"${o.name}","${o.code}","${o.email||''}","${o.plan||'Freemium'}","${o.status}"\n`;}); const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=type+'_'+new Date().toISOString().split('T')[0]+'.csv'; a.click(); }

// ===== SETTINGS =====
function switchSettingsTab(tab) { currentSettingsTab=tab; document.querySelectorAll('.settings-tab').forEach(t=>t.classList.remove('active')); document.getElementById('tab-'+tab).classList.add('active'); document.getElementById('plans-content').innerHTML=getPlansContent(tab); }
function getSettingsHTML() {
    return `<div class="topbar"><h1>⚙️ Paramètres</h1></div>
        <div style="display:flex;gap:0;margin-bottom:24px;background:var(--card);border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <button class="settings-tab active" id="tab-FLOTTE" onclick="switchSettingsTab('FLOTTE')" style="flex:1;padding:16px;border:none;background:transparent;cursor:pointer;font-size:15px;font-weight:600;font-family:'Inter',sans-serif;">🏍️ Plans Flotte</button>
            <button class="settings-tab" id="tab-COOP" onclick="switchSettingsTab('COOP')" style="flex:1;padding:16px;border:none;background:transparent;cursor:pointer;font-size:15px;font-weight:600;font-family:'Inter',sans-serif;">📦 Plans Coop</button>
        </div><div id="plans-content">${getPlansContent('FLOTTE')}</div>
        <div class="card" style="padding:24px;margin-top:24px;"><h3>🌐 Général</h3>
            <div style="margin-top:16px;"><label>💱 Monnaie</label><input value="Ar" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;" disabled></div>
            <div style="margin-top:16px;"><label>🌐 Langue</label><select style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;"><option>🇫🇷 Français</option><option>🇲🇬 Malagasy</option><option>🇬🇧 English</option></select></div>
        </div>
        <button onclick="alert('✅ Sauvegardé !')" style="width:100%;padding:16px;background:#1A5276;color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;margin-top:24px;"><i class="fas fa-save"></i> Enregistrer</button>
        <style>.settings-tab.active{background:#1A5276!important;color:white!important;}.settings-tab:not(.active):hover{background:var(--border);}</style>`;
}
function getPlansTabHTML(type) { return `<div class="topbar"><h1>${type==='FLOTTE'?'🏍️ Plans Flotte':'📦 Plans Coop'}</h1><a href="#" onclick="loadPage('settings');return false;" style="color:var(--text2);text-decoration:none;">← Retour</a></div>${getPlansContent(type)}<button onclick="alert('✅ Sauvegardé !')" style="width:100%;padding:16px;background:#1A5276;color:white;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;margin-top:24px;"><i class="fas fa-save"></i> Enregistrer</button>`; }
function getPlansContent(type) {
    const plans = type==='FLOTTE'?[{nom:'Freemium',prix:0,vehiculesMax:1,chauffeursMax:1},{nom:'Basic',prix:15000,vehiculesMax:5,chauffeursMax:10},{nom:'Standard',prix:35000,vehiculesMax:20,chauffeursMax:50},{nom:'Premium',prix:75000,vehiculesMax:100,chauffeursMax:200}]:[{nom:'Freemium',prix:0,vehiculesMax:1,livreursMax:2},{nom:'Basic',prix:20000,vehiculesMax:5,livreursMax:15},{nom:'Standard',prix:45000,vehiculesMax:20,livreursMax:60},{nom:'Premium',prix:90000,vehiculesMax:100,livreursMax:300}];
    const label=type==='FLOTTE'?'chauffeurs':'livreurs'; const maxField=type==='FLOTTE'?'chauffeursMax':'livreursMax';
    return `<div class="card" style="padding:24px;"><h3>📋 Plans mensuels</h3>${plans.map(p=>`<div style="display:flex;align-items:center;gap:16px;padding:16px;border:1px solid var(--border);border-radius:12px;margin-top:12px;flex-wrap:wrap;"><div style="width:100px;font-weight:700;">${p.nom}</div><div><input type="number" value="${p.prix}" style="width:80px;padding:8px;border:1px solid var(--border);border-radius:8px;text-align:center;font-weight:700;"> <span style="font-size:13px;color:var(--text2);">Ar/mois</span></div><div style="display:flex;gap:12px;"><span>🏍️ <input type="number" value="${p.vehiculesMax}" style="width:50px;padding:6px;border:1px solid var(--border);border-radius:6px;text-align:center;"> véhicules</span><span>👥 <input type="number" value="${p[maxField]||0}" style="width:50px;padding:6px;border:1px solid var(--border);border-radius:6px;text-align:center;"> ${label}</span></div><span class="badge badge-success">✅ Actif</span></div>`).join('')}</div><div class="card" style="padding:24px;margin-top:16px;"><h3>📉 Réduction annuelle</h3><div style="display:flex;align-items:center;gap:12px;margin-top:12px;"><input type="number" value="7" style="width:80px;padding:12px;border:1px solid var(--border);border-radius:8px;text-align:center;font-weight:700;font-size:18px;"> <span style="font-size:18px;">%</span></div></div>`;
}

// ===== INIT =====
loadPage('dashboard');
